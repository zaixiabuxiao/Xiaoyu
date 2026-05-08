# 羽扬日记 — Supabase

This directory holds the Supabase schema and storage setup that will eventually power cloud sync. **The running app is still 100% localStorage.** Nothing here is consumed by the client until the cloud feature flag is flipped on (Phase 9D and later).

## Files

- `migrations/001_initial_schema.sql` — initial schema, indexes, storage buckets, the `save_daily_record` RPC, and an RLS lockdown.

## Apply the migration

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

Then push the migration:

```bash
supabase db push
```

The CLI applies every file under `supabase/migrations/` in lexical order, so future phases can drop `002_*.sql`, `003_*.sql`, etc.

### Option B — Manual SQL editor

1. Open the Supabase dashboard → SQL editor.
2. Paste the entire contents of `migrations/001_initial_schema.sql`.
3. Run.

The migration is **idempotent** (`create … if not exists`, `where not exists` seeds, `drop trigger if exists`, etc.) so it's safe to re-run.

## What gets created

### Tables

- `diary_spaces` — one shared "diary book" for 小羽 + 扬扬. Seeded with one row.
- `daily_records` — diary pages. Unique on `(diary_space_id, la_date)`.
- `daily_record_photos` — child rows of `daily_records`. Photo-required rule enforced by `save_daily_record`, not by a column constraint.
- `album_photos` — free-form album uploads, NOT bound to a chapter.
- `planned_chapters` — composite PK `(diary_space_id, chapter_id)`.
- `app_settings` — `jsonb` catch-all per space.

### Storage buckets (private)

- `daily-photos`
- `album-photos`

Both buckets are **private**. `public = false`. Application access goes through signed URLs once the cloud data layer ships.

If your environment doesn't expose `storage.buckets` from migrations (e.g. a self-hosted Postgres running outside the Supabase platform), create the buckets manually in **Storage → New bucket** with these exact ids and "Public" left unchecked.

### RPC

- `save_daily_record(...)` — inserts the record + its photo rows in a single transaction. Raises `23514 photo_required` if `p_photos` is null/empty/not-an-array. Raises `23505` (handled by the unique constraint) on duplicate `la_date`.

## RLS status

RLS is **ENABLED** on every table. **Zero policies** are created in this migration.

Net effect right now:

- The Supabase anon key (the only key shipped to the browser) cannot read or write any of these tables.
- Authenticated requests cannot either — there's no policy granting access yet.
- The service-role key bypasses RLS, so administrative work (seeding, manual fixes) still works.

This is **intentional**. Adding cloud sync without proper RLS would expose the diary to anyone who has the Supabase project URL. The data layer that ships in Phase 9D adds:

1. Supabase Auth (email magic link or Apple Sign-In).
2. A membership table or claim that ties an authenticated user to a `diary_space_id`.
3. Permissive policies that gate all reads and writes by membership.

A template of those policies is included as comments at the bottom of the migration.

## Security: never expose the service-role key

- The browser is allowed to know `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Both are public by Supabase's design — the anon key only has the access RLS lets through.
- The **service-role key bypasses RLS** and must never appear in `.env.local`, in Git, in `process.env.NEXT_PUBLIC_*`, or anywhere bundled to the client.
- Use the service-role key only in trusted server contexts: a one-off SQL session, a cron job, an Edge Function explicitly running with elevated privileges. Never in this Next.js app's client-side code.

## What this phase does NOT do

- It does **not** modify the running app.
- It does **not** migrate any localStorage data.
- It does **not** add Supabase Auth or any policies that allow the app to read/write.
- It does **not** flip `NEXT_PUBLIC_CLOUD_ENABLED`.

The next phase (9D) implements the data access layer behind the same feature flag, still without changing UI behavior.
