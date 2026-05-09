-- 003_memory_folders.sql
-- 羽扬日记 — Memory folders for the unified 地图相册 (map album) concept.
--
-- Phase 9H. The previously-separate Album and Map ideas merge into a single
-- folder-based view: each folder is a place / memory space, and photos
-- belong to one folder. This migration:
--
--   1. Creates `memory_folders`, scoped per diary_space.
--   2. Adds `folder_id` to `album_photos` (nullable; on folder delete the
--      photo is preserved with `folder_id = null`, and the application
--      treats a null folder as the default "没有地点的照片" folder).
--   3. Backfills existing `album_photos` rows: rows with a `location` text
--      get a folder named after that location; rows without get the default
--      "没有地点的照片" folder. Folder rows are upserted on
--      (diary_space_id, name) so re-running the migration is safe.
--   4. Seeds a default "没有地点的照片" folder for every existing diary_space.
--   5. RLS: the same membership gate used elsewhere (`is_diary_space_member`).
--
-- This migration is idempotent. `daily_records` is intentionally left
-- unchanged — daily records continue to display via their existing
-- `location` column. Only album_photos get a true `folder_id`.

-- ──────────────────────────────────────────────────────────────────────────
-- memory_folders
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists memory_folders (
  id              uuid        primary key default gen_random_uuid(),
  diary_space_id  uuid        not null references diary_spaces(id) on delete cascade,
  name            text        not null,
  description     text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint memory_folders_name_unique
    unique (diary_space_id, name),
  constraint memory_folders_name_not_blank
    check (length(btrim(name)) > 0)
);

create index if not exists memory_folders_space_idx
  on memory_folders (diary_space_id);
create index if not exists memory_folders_space_name_idx
  on memory_folders (diary_space_id, name);

alter table memory_folders enable row level security;

drop policy if exists memory_folders_member_all on memory_folders;
create policy memory_folders_member_all
  on memory_folders
  for all
  to authenticated
  using (public.is_diary_space_member(diary_space_id))
  with check (public.is_diary_space_member(diary_space_id));

-- updated_at touch trigger
create or replace function public.touch_memory_folders_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists memory_folders_touch_updated_at on memory_folders;
create trigger memory_folders_touch_updated_at
  before update on memory_folders
  for each row
  execute function public.touch_memory_folders_updated_at();

-- ──────────────────────────────────────────────────────────────────────────
-- album_photos: add folder_id + index. on delete set null so deleting a
-- folder does not destroy its photos — they fall back to the default folder
-- in the application layer.
-- ──────────────────────────────────────────────────────────────────────────

alter table album_photos
  add column if not exists folder_id uuid
    references memory_folders(id) on delete set null;

create index if not exists album_photos_folder_idx
  on album_photos (folder_id);

-- ──────────────────────────────────────────────────────────────────────────
-- Seed: ensure every diary_space has the default "没有地点的照片" folder.
-- ──────────────────────────────────────────────────────────────────────────

insert into memory_folders (diary_space_id, name)
select ds.id, '没有地点的照片'
from diary_spaces ds
where not exists (
  select 1
  from memory_folders mf
  where mf.diary_space_id = ds.id
    and mf.name = '没有地点的照片'
);

-- ──────────────────────────────────────────────────────────────────────────
-- Backfill: existing album_photos rows without a folder_id get one.
--   - Rows with non-blank `location` → folder named after the location.
--   - Rows with null/blank location → default "没有地点的照片" folder.
-- The folder rows are upserted via `on conflict do nothing` against the
-- (diary_space_id, name) unique constraint.
-- ──────────────────────────────────────────────────────────────────────────

-- Step 1: insert any missing location-named folders.
insert into memory_folders (diary_space_id, name)
select distinct ap.diary_space_id, btrim(ap.location)
from album_photos ap
where ap.folder_id is null
  and ap.location is not null
  and length(btrim(ap.location)) > 0
on conflict (diary_space_id, name) do nothing;

-- Step 2: assign folder_id to album_photos rows that have a non-blank location.
update album_photos ap
set folder_id = mf.id
from memory_folders mf
where ap.folder_id is null
  and ap.location is not null
  and length(btrim(ap.location)) > 0
  and mf.diary_space_id = ap.diary_space_id
  and mf.name = btrim(ap.location);

-- Step 3: assign default folder_id to album_photos rows still without one.
update album_photos ap
set folder_id = mf.id
from memory_folders mf
where ap.folder_id is null
  and mf.diary_space_id = ap.diary_space_id
  and mf.name = '没有地点的照片';
