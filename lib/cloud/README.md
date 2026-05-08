# lib/cloud/

Cloud data access layer for 羽扬日记's eventual Supabase sync.

**Nothing in this folder is wired into the UI.** The running app still reads and writes only `localStorage` (`lib/local-records.ts`, `lib/use-local-records.ts`). These modules exist so a later phase can flip the data layer over without inventing data shapes from scratch.

## Module map

| File | What it does |
|---|---|
| `errors.ts` | `CloudResult<T>` discriminated union, `CloudErrorCode` taxonomy, `ok` / `err` constructors, `normalizeError(...)` (translates Supabase / Postgres errors into stable codes), and `ensureCloudClient()` precondition guard |
| `types.ts` | Cloud row + input shapes (snake_case to match SQL) and the pure mappers `mapCloudDailyRecordToDailyRecord` / `mapCloudAlbumPhotoToAlbumPhoto` that convert rows to the existing `DailyRecord` / `AlbumPhoto` shapes from `lib/local-records.ts` |
| `diary-space.ts` | `getCloudDiarySpace`, `getCloudAppSettings`, `updateCloudAppSettings` |
| `storage.ts` | `uploadDailyPhoto`, `uploadAlbumPhoto`, `getSignedPhotoUrl`, `deletePhoto` (private bucket access, anon client only) |
| `daily-records.ts` | `listCloudDailyRecords`, `saveCloudDailyRecord` (RPC-backed), `updateCloudDailyRecord`, `deleteCloudDailyRecord` |
| `album-photos.ts` | `listCloudAlbumPhotos`, `saveCloudAlbumPhoto`, `deleteCloudAlbumPhoto` |
| `planned-chapters.ts` | `listCloudPlannedChapters`, `addCloudPlannedChapter`, `removeCloudPlannedChapter` |

Every public function returns `Promise<CloudResult<T>>`. Callers narrow on `result.ok` instead of catching exceptions.

## Required runtime assumptions

All of these must be true before any of these functions can return `ok: true`:

1. `NEXT_PUBLIC_CLOUD_ENABLED === "true"` and `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.
2. The user has an active Supabase Auth session (signed in through whatever sign-in flow lands in 9D-3 or later).
3. There's a `diary_space_members` row that links `auth.uid()` to the diary space they're trying to access. Without it, RLS returns either no rows on selects or `42501 not_allowed:` on the RPC.
4. The path convention for storage uploads matches the storage RLS policy: paths must start with `{diary_space_id}/...`.

When any of these fail, the helpers return one of these stable codes:

```
CLOUD_DISABLED          // feature flag is off
SUPABASE_NOT_CONFIGURED // env vars missing
NOT_AUTHENTICATED       // no Auth session / 401 / JWT errors
NOT_ALLOWED             // RLS / RPC membership denial (42501)
DAILY_RECORD_EXISTS     // unique violation on (diary_space_id, la_date)
PHOTO_REQUIRED          // RPC raised 23514 or input.photos was empty
NOT_FOUND               // single() returned no rows / required arg missing
NETWORK_ERROR           // fetch / TypeError
UNKNOWN                 // anything else, with the original error in `cause`
```

## Why these modules are not wired into the UI yet

- The data flow during a save is a multi-step orchestration: compress photo → upload to storage → call `save_daily_record` RPC with the resulting `storagePath`. That orchestration belongs in the migration / switch phase (9E–9F), not here.
- Switching the UI to the cloud is the most visible behavior change in the project. Doing it on the same commit as the data-layer scaffolding makes it impossible to roll back cleanly.
- Until Auth is wired (9D-3 or wherever it lands), every cloud call will return `NOT_AUTHENTICATED` or `NOT_ALLOWED` anyway. Wiring the UI now would just paint the page in error states.

So 9D-2 is intentionally inert: we can import these modules and call them in a console, but the UI doesn't.

## Manual smoke-test recipe (local browser)

There is no automated script for now — running these against a real Supabase project requires real env + an authenticated session, which the test runner can't simulate cheaply. Manual procedure:

1. Apply both migrations (see `supabase/README.md`).
2. Create a Supabase Auth user and seed a `diary_space_members` row (see `supabase/README.md` membership section).
3. Copy `.env.example` → `.env.local`, fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   NEXT_PUBLIC_CLOUD_ENABLED=true
   ```
4. `npm run dev`, open the app, then in the browser devtools console:
   ```ts
   const { getCloudDiarySpace } = await import("/_next/static/chunks/...");
   // Easier: temporarily attach to window from a dev-only file.
   ```
   The simpler path is to add a one-off dev page (e.g. `app/_dev/cloud/page.tsx`) that imports a function from `lib/cloud/...`, calls it, and renders the JSON result. That dev page should not ship to production.
5. Sign in via the Supabase JS client (also temporary), then click through the dev page and watch each function return `{ ok: true, data: ... }` or one of the stable error codes.

## Functions safe to call now (anon, unauthenticated, flag off)

All of them. They never throw in normal use:

- With the flag off → `{ ok: false, code: "CLOUD_DISABLED" }`.
- With the flag on but anon → most return `{ ok: false, code: "NOT_AUTHENTICATED" }` or `{ ok: true, data: [] }` on RLS-filtered selects.
- With the flag on, signed in, but not a member → still `{ ok: false, code: "NOT_ALLOWED" }` from the RPC; selects return empty arrays.

This is by design: the modules were built to be called speculatively without crashing, so the UI can fall back to localStorage on any error code.

## What this folder does NOT do

- It does **not** import or modify any UI component.
- It does **not** read or write `localStorage`.
- It does **not** invoke `save_daily_record` automatically — the caller has to opt in.
- It does **not** orchestrate photo upload + record insert. That happens in the migration phase.
- It does **not** ship the service-role key. Only `getSupabaseClient()` (anon-only) is used.
