# 羽扬日记 — Supabase

This directory holds the Supabase schema and storage setup that will eventually power cloud sync. **The running app is still 100% localStorage.** Nothing here is consumed by the client until the cloud feature flag is flipped on (Phase 9D and later).

## Files

- `migrations/001_initial_schema.sql` — initial schema, indexes, storage buckets, the `save_daily_record` RPC, and an RLS lockdown.
- `migrations/002_auth_membership_rls.sql` — `diary_space_members` table, membership helper functions, application + storage RLS policies, RPC membership check.

## Apply the migrations

There are two common paths. Pick whichever matches your setup.

### Option A — Supabase CLI (recommended)

Install the CLI once:

```bash
npm install -g supabase
```

From the repo root, link to your Supabase project (you only do this once):

```bash
supabase login
supabase link --project-ref <your-project-ref>
```

Then push the migrations:

```bash
supabase db push
```

The CLI applies every file under `supabase/migrations/` in lexical order, so future phases can drop `003_*.sql`, `004_*.sql`, etc.

### Option B — Manual SQL editor

1. Open the Supabase dashboard → SQL editor.
2. Paste the entire contents of `migrations/001_initial_schema.sql` and run.
3. Then paste `migrations/002_auth_membership_rls.sql` and run.

Both migrations are **idempotent** (`create … if not exists`, `where not exists` seeds, `drop policy if exists` then `create policy`, `create or replace function`) so they're safe to re-run.

## What gets created

### Tables

- `diary_spaces` — one shared "diary book" for 小羽 + 扬扬. Seeded with one row.
- `daily_records` — diary pages. Unique on `(diary_space_id, la_date)`.
- `daily_record_photos` — child rows of `daily_records`. Photo-required rule enforced by `save_daily_record`, not by a column constraint.
- `album_photos` — free-form album uploads, NOT bound to a chapter.
- `planned_chapters` — composite PK `(diary_space_id, chapter_id)`.
- `app_settings` — `jsonb` catch-all per space.
- `diary_space_members` — links Supabase Auth users (`auth.users.id`) to a diary space. Composite PK `(diary_space_id, user_id)`. `role in ('owner', 'member')`.

### Storage buckets (private)

- `daily-photos`
- `album-photos`

Both buckets are **private**. `public = false`. Application access goes through signed URLs once the cloud data layer ships.

If your environment doesn't expose `storage.buckets` from migrations (e.g. a self-hosted Postgres running outside the Supabase platform), create the buckets manually in **Storage → New bucket** with these exact ids and "Public" left unchecked.

### RPC

- `save_daily_record(...)` — inserts the record + its photo rows in a single transaction. After 002 it also:
  - Calls `is_diary_space_member(p_diary_space_id)` and raises `42501 not_allowed: …` if the caller isn't a member.
  - Has `execute` revoked from `public` and granted only to `authenticated`.

  Existing behavior preserved: `23514 photo_required` if `p_photos` is null/empty/not-an-array; `23505` on duplicate `(diary_space_id, la_date)`.

### Helper functions

- `is_diary_space_member(space_id uuid) returns boolean` — `security definer`, locked `search_path`. Returns `true` only when `auth.uid()` matches a row in `diary_space_members` for that space. Used by every application-table policy.
- `is_member_of_storage_path(path text) returns boolean` — same security shape; parses the leading `{diary_space_id}/...` segment from a storage object name and runs the membership check. Used by the `storage.objects` policies.

Both helpers are `revoke all from public; grant execute to authenticated`.

## Membership: seeding 小羽 and 扬扬

The migration creates the membership table but **does not** insert any rows. To grant cloud access, you need to:

1. **Create Supabase Auth users for the two of you.** In the Supabase dashboard:
   - **Authentication → Users → Add user**, and pick a sign-in method. Magic-link email or password both work for the MVP. (Apple Sign-In is also supported and would be a nicer iPhone PWA experience down the road.)
   - Repeat for the second person.
2. **Copy each user's UUID.** It's the `id` column in **Authentication → Users**, e.g. `9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d`.
3. **Insert membership rows** in the SQL editor (or via `psql` with the service-role connection):

   ```sql
   -- 小羽 (treat as owner)
   insert into diary_space_members (diary_space_id, user_id, role)
   select id, '<XIAOYU_USER_UUID>', 'owner'
   from diary_spaces
   where name = '羽扬日记'
   on conflict (diary_space_id, user_id) do update set role = excluded.role;

   -- 扬扬 (also owner — both partners can edit)
   insert into diary_space_members (diary_space_id, user_id, role)
   select id, '<YANGYANG_USER_UUID>', 'owner'
   from diary_spaces
   where name = '羽扬日记'
   on conflict (diary_space_id, user_id) do update set role = excluded.role;
   ```

   Replace the two UUIDs with the real values. The `on conflict … do update` makes the script safe to re-run — running it twice does not duplicate rows.

4. **Verify** with `select * from diary_space_members;` from the SQL editor (which uses the service-role connection and bypasses RLS).

   You should see two rows pointing at the same `diary_space_id`.

> No client-side code can write to `diary_space_members`. There's no insert/update/delete policy on that table, so even an authenticated session is blocked from changing memberships. New members must be added through the SQL editor with the service role.

## RLS status

RLS is **ENABLED** on every table.

- `diary_space_members` — `select` allowed when `user_id = auth.uid()`. No insert/update/delete policy.
- `diary_spaces` — `select` for any member; `update` only for `role = 'owner'`. No insert/delete from clients.
- `daily_records`, `album_photos`, `planned_chapters`, `app_settings` — `for all` to authenticated members of the relevant `diary_space_id`.
- `daily_record_photos` — same, but the membership check joins through the parent `daily_records` row.
- `storage.objects` — separate `select / insert / update / delete` policies for `daily-photos` and `album-photos`. The first path segment must be the `diary_space_id` of a space the caller belongs to. Path convention: `{diary_space_id}/{...}`.

Service-role bypasses RLS for administrative work.

## Testing the lockdown

Once the migration is applied, you can verify the gate is doing its job. From the Supabase dashboard's SQL editor (which runs as service-role and ignores RLS, so use the URLs/keys directly to test the anon flow):

### 1. Anonymous access should fail

```bash
curl "https://<project-ref>.supabase.co/rest/v1/daily_records?select=id" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>"
# → []   (no rows, RLS denied silently for select)

curl -X POST "https://<project-ref>.supabase.co/rest/v1/daily_records" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"diary_space_id":"…","la_date":"2026-05-08","chapter_id":"c001","volume_id":"v1","title":"x","note":"x"}'
# → 401 / 403 — new row blocked
```

### 2. Authenticated member access should succeed

After signing in via Supabase Auth and getting a user JWT:

```bash
curl "https://<project-ref>.supabase.co/rest/v1/daily_records?select=id" \
  -H "apikey: <anon-key>" \
  -H "Authorization: Bearer <member-jwt>"
# → [...]   (member sees their diary_space's records)
```

### 3. Authenticated non-member access should fail

A signed-in user who is not in `diary_space_members` for any space gets:
- `[]` for selects (RLS filters everything out).
- `403` / `42501` on inserts and on the `save_daily_record` RPC.

If a select returns more than just the caller's own data, **stop** — there's a policy bug and the gate is leaking.

## Security: never expose the service-role key

- The browser is allowed to know `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both are public by Supabase's design — the anon key only has the access RLS lets through.
- The **service-role key bypasses RLS** and must never appear in `.env.local`, in Git, in `process.env.NEXT_PUBLIC_*`, or anywhere bundled to the client.
- Use the service-role key only in trusted server contexts: a one-off SQL session, a cron job, an Edge Function explicitly running with elevated privileges. Never in this Next.js app's client-side code.
- The fixed passcode `0515` in the client's `PasscodeGate` is a soft UX gate — "this is private, please don't snoop." It is **not** real security. Cloud access is controlled by Supabase Auth + RLS, not by the passcode.

## What this phase does NOT do

- It does **not** modify the running app.
- It does **not** migrate any localStorage data.
- It does **not** flip `NEXT_PUBLIC_CLOUD_ENABLED`.
- It does **not** create the data access layer or wire any client to Supabase. The client still reads/writes `localStorage`.

The next phase (9D-2 onwards) implements the data access layer — still behind the cloud feature flag — and only after that does any UI behavior change.
