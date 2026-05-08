-- 001_initial_schema.sql
-- 羽扬日记 — initial cloud schema.
--
-- This migration is INERT for the running app: app code still reads/writes
-- localStorage. The cloud feature flag stays off (`isCloudEnabled() = false`).
-- Real auth + membership-aware RLS policies are added in Phase 9D.
--
-- See supabase/README.md for application notes.

create extension if not exists pgcrypto;

-- ──────────────────────────────────────────────────────────────────────────
-- Helper: keep updated_at fresh on UPDATE
-- ──────────────────────────────────────────────────────────────────────────

create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- diary_spaces: one shared diary book for 小羽 and 扬扬.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists diary_spaces (
  id              uuid        primary key default gen_random_uuid(),
  name            text        not null,
  passcode_hash   text,                                   -- nullable; future use only
  timezone        text        not null default 'America/Los_Angeles',
  met_date        date        not null default '2022-09-10',
  together_date   date        not null default '2023-03-19',
  engagement_date date        not null default '2024-05-15',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

drop trigger if exists diary_spaces_set_updated_at on diary_spaces;
create trigger diary_spaces_set_updated_at
  before update on diary_spaces
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- daily_records: the diary page that gates the Home 100-grid.
-- One row per (diary_space_id, la_date).
-- la_date is a calendar date in America/Los_Angeles, stored as a `date`
-- so that two devices in different physical timezones cannot disagree.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists daily_records (
  id                  uuid        primary key default gen_random_uuid(),
  diary_space_id      uuid        not null references diary_spaces(id) on delete cascade,
  la_date             date        not null,
  chapter_id          text        not null,
  volume_id           text        not null,
  title               text        not null,
  note                text        not null,
  memory              text,
  husband_reflection  text,
  wife_reflection     text,
  location            text,
  wants_to_repeat     boolean     not null default false,
  time_label          text,
  recorded_at         timestamptz not null default now(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint daily_records_space_la_date_unique unique (diary_space_id, la_date),
  constraint daily_records_title_not_empty check (length(title) > 0),
  constraint daily_records_note_not_empty check (length(note) > 0)
);

create index if not exists daily_records_space_date_idx
  on daily_records (diary_space_id, la_date desc);

create index if not exists daily_records_space_chapter_idx
  on daily_records (diary_space_id, chapter_id);

drop trigger if exists daily_records_set_updated_at on daily_records;
create trigger daily_records_set_updated_at
  before update on daily_records
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- daily_record_photos: child rows of daily_records.
-- Photo-required is enforced by save_daily_record() below — there is no
-- column-level "≥ 1 photo" check because Postgres does not naturally express
-- it. Direct inserts into daily_records that bypass the RPC can produce a
-- photo-less record; do not call them from the client.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists daily_record_photos (
  id                uuid        primary key default gen_random_uuid(),
  daily_record_id   uuid        not null references daily_records(id) on delete cascade,
  storage_path      text        not null,
  width             int,
  height            int,
  bytes             bigint,
  position          int         not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists daily_record_photos_record_position_idx
  on daily_record_photos (daily_record_id, position);

-- ──────────────────────────────────────────────────────────────────────────
-- album_photos: free-form album uploads — not bound to a chapter or la_date.
-- Album photos do NOT light the Home 100-grid and do NOT trigger the
-- one-record-per-day rule (that rule lives on daily_records).
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists album_photos (
  id              uuid        primary key default gen_random_uuid(),
  diary_space_id  uuid        not null references diary_spaces(id) on delete cascade,
  storage_path    text        not null,
  taken_on        date,
  location        text,
  note            text,
  width           int,
  height          int,
  bytes           bigint,
  created_at      timestamptz not null default now()
);

create index if not exists album_photos_space_taken_idx
  on album_photos (diary_space_id, taken_on desc);

create index if not exists album_photos_space_created_idx
  on album_photos (diary_space_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- planned_chapters: composite primary key, no surrogate id.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists planned_chapters (
  diary_space_id  uuid        not null references diary_spaces(id) on delete cascade,
  chapter_id      text        not null,
  created_at      timestamptz not null default now(),
  primary key (diary_space_id, chapter_id)
);

-- ──────────────────────────────────────────────────────────────────────────
-- app_settings: jsonb catch-all per diary_space (1:1).
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists app_settings (
  diary_space_id  uuid        primary key references diary_spaces(id) on delete cascade,
  data            jsonb       not null default '{}'::jsonb,
  updated_at      timestamptz not null default now()
);

drop trigger if exists app_settings_set_updated_at on app_settings;
create trigger app_settings_set_updated_at
  before update on app_settings
  for each row execute function set_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- Storage buckets (private).
-- Both buckets reject public reads. Application access goes through signed
-- URLs once the cloud data layer ships in Phase 9D+.
-- ──────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
select 'daily-photos', 'daily-photos', false
where not exists (select 1 from storage.buckets where id = 'daily-photos');

insert into storage.buckets (id, name, public)
select 'album-photos', 'album-photos', false
where not exists (select 1 from storage.buckets where id = 'album-photos');

-- ──────────────────────────────────────────────────────────────────────────
-- save_daily_record RPC.
--
-- Enforces, in a single transaction:
--   1. p_photos must be a non-empty JSON array (photo-required rule)
--   2. (diary_space_id, la_date) uniqueness via the table constraint
--   3. record row + photo rows inserted atomically; either all or none
--
-- Returns the inserted daily_records.id. On unique violation, Postgres
-- raises 23505 — the client surfaces "今天已经写过一页了…".
-- On photo violation, this raises 23514 with message "photo_required: ...".
-- ──────────────────────────────────────────────────────────────────────────

create or replace function save_daily_record(
  p_diary_space_id     uuid,
  p_la_date            date,
  p_chapter_id         text,
  p_volume_id          text,
  p_title              text,
  p_note               text,
  p_memory             text        default null,
  p_husband_reflection text        default null,
  p_wife_reflection    text        default null,
  p_location           text        default null,
  p_wants_to_repeat    boolean     default false,
  p_time_label         text        default null,
  p_recorded_at        timestamptz default null,
  p_photos             jsonb       default '[]'::jsonb
) returns uuid
language plpgsql
security invoker
as $$
declare
  v_record_id uuid;
begin
  if p_photos is null
     or jsonb_typeof(p_photos) <> 'array'
     or jsonb_array_length(p_photos) = 0 then
    raise exception 'photo_required: a daily record must include at least one photo'
      using errcode = '23514';
  end if;

  insert into daily_records (
    diary_space_id, la_date, chapter_id, volume_id,
    title, note, memory, husband_reflection, wife_reflection,
    location, wants_to_repeat, time_label, recorded_at
  ) values (
    p_diary_space_id, p_la_date, p_chapter_id, p_volume_id,
    p_title, p_note, p_memory, p_husband_reflection, p_wife_reflection,
    p_location, coalesce(p_wants_to_repeat, false), p_time_label,
    coalesce(p_recorded_at, now())
  )
  returning id into v_record_id;

  insert into daily_record_photos (
    daily_record_id, storage_path, width, height, bytes, position
  )
  select
    v_record_id,
    photo->>'storage_path',
    nullif(photo->>'width',  '')::int,
    nullif(photo->>'height', '')::int,
    nullif(photo->>'bytes',  '')::bigint,
    coalesce((photo->>'position')::int, (idx - 1)::int)
  from jsonb_array_elements(p_photos) with ordinality as e(photo, idx);

  return v_record_id;
end;
$$;

-- ──────────────────────────────────────────────────────────────────────────
-- Row Level Security.
--
-- RLS is ENABLED on every table. No permissive policies are added here.
-- Net effect: both anon and authenticated requests are denied for all
-- reads and writes. This is intentional. The data layer in Phase 9D will
-- add membership-aware policies once Supabase Auth is wired up.
--
-- Server-side tools using the service-role key bypass RLS. The service-role
-- key MUST NOT be bundled into the Next.js client (see supabase/README.md).
-- ──────────────────────────────────────────────────────────────────────────

alter table diary_spaces        enable row level security;
alter table daily_records       enable row level security;
alter table daily_record_photos enable row level security;
alter table album_photos        enable row level security;
alter table planned_chapters    enable row level security;
alter table app_settings        enable row level security;

-- Future policy templates (kept as comments for reference; do NOT enable here):
--
--   create policy "members read daily_records" on daily_records
--     for select to authenticated
--     using (
--       diary_space_id in (
--         select diary_space_id from diary_space_members where user_id = auth.uid()
--       )
--     );
--
--   create policy "members write daily_records" on daily_records
--     for insert, update, delete to authenticated
--     using (
--       diary_space_id in (
--         select diary_space_id from diary_space_members where user_id = auth.uid()
--       )
--     );
--
-- Equivalent policies needed on every other table before the app can read.

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: exactly one diary_spaces row.
-- Idempotent: only inserts when the table is empty.
-- ──────────────────────────────────────────────────────────────────────────

insert into diary_spaces (name, timezone, met_date, together_date, engagement_date)
select '羽扬日记', 'America/Los_Angeles', '2022-09-10', '2023-03-19', '2024-05-15'
where not exists (select 1 from diary_spaces);

-- Seed app_settings row for that diary_space, also idempotent.
insert into app_settings (diary_space_id, data)
select id, '{}'::jsonb
from diary_spaces
where not exists (
  select 1 from app_settings where app_settings.diary_space_id = diary_spaces.id
);
