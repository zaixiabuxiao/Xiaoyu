-- 002_auth_membership_rls.sql
-- 羽扬日记 — Supabase Auth membership model + RLS policies.
--
-- This migration is INERT for the running app: client code still reads/writes
-- localStorage. Until membership rows are seeded for the two users (see
-- supabase/README.md) and the cloud feature flag is flipped, no app data
-- moves to the cloud.
--
-- After this file runs:
--   - Anonymous (anon-key) requests are denied for every table — by design.
--   - Authenticated users see ONLY the diary_space they're a member of.
--   - Storage objects in `daily-photos` and `album-photos` are gated by the
--     same membership through a path-prefix policy.
--   - The `save_daily_record` RPC checks membership before any insert.
--
-- The fixed passcode 0515 in the client is a soft UX gate. RLS is the actual
-- access control. Service-role key bypasses RLS and must NEVER ship to the
-- browser.

-- ──────────────────────────────────────────────────────────────────────────
-- diary_space_members: links Supabase Auth users to a diary_space.
-- Seeded manually after creating Auth users; see supabase/README.md.
-- ──────────────────────────────────────────────────────────────────────────

create table if not exists diary_space_members (
  diary_space_id uuid        not null references diary_spaces(id) on delete cascade,
  user_id        uuid        not null references auth.users(id) on delete cascade,
  role           text        not null default 'member',
  created_at     timestamptz not null default now(),
  primary key (diary_space_id, user_id),
  constraint diary_space_members_role_check
    check (role in ('owner', 'member'))
);

create index if not exists diary_space_members_user_idx
  on diary_space_members (user_id);
create index if not exists diary_space_members_space_idx
  on diary_space_members (diary_space_id);

alter table diary_space_members enable row level security;

-- ──────────────────────────────────────────────────────────────────────────
-- Helper: is the calling auth.uid() a member of this diary_space?
--
-- security definer + locked search_path so that RLS on diary_space_members
-- doesn't make policies that call this function recurse, and so that no
-- writable schema can shadow `diary_space_members`. Function only returns
-- a boolean; it cannot leak rows.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.is_diary_space_member(space_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.diary_space_members
    where diary_space_id = space_id
      and user_id = auth.uid()
  );
$$;

revoke all on function public.is_diary_space_member(uuid) from public;
grant execute on function public.is_diary_space_member(uuid) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- Helper: parse the leading {diary_space_id} segment from a storage path
-- and check membership. Used by storage.objects policies. Same security
-- properties as is_diary_space_member.
-- ──────────────────────────────────────────────────────────────────────────

create or replace function public.is_member_of_storage_path(path text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.diary_space_members m
    where m.user_id = auth.uid()
      and m.diary_space_id::text = split_part(coalesce(path, ''), '/', 1)
  );
$$;

revoke all on function public.is_member_of_storage_path(text) from public;
grant execute on function public.is_member_of_storage_path(text) to authenticated;

-- ──────────────────────────────────────────────────────────────────────────
-- RLS policies on application tables.
--
-- All policies require to authenticated AND membership of the relevant
-- diary_space. No anon access. No public reads. No client-side INSERT into
-- diary_space_members — that table is admin-seeded.
-- ──────────────────────────────────────────────────────────────────────────

-- diary_space_members
drop policy if exists "members read own membership" on diary_space_members;
create policy "members read own membership"
  on diary_space_members
  for select
  to authenticated
  using (user_id = auth.uid());

-- (No insert/update/delete policy on diary_space_members — operations
--  are denied for everyone except service-role. Owners can be added later
--  via a server-side admin tool or future invite flow.)

-- diary_spaces: members can read; owners can update.
drop policy if exists "members select diary_space" on diary_spaces;
create policy "members select diary_space"
  on diary_spaces
  for select
  to authenticated
  using (is_diary_space_member(id));

drop policy if exists "owners update diary_space" on diary_spaces;
create policy "owners update diary_space"
  on diary_spaces
  for update
  to authenticated
  using (
    exists (
      select 1
      from diary_space_members m
      where m.diary_space_id = diary_spaces.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  )
  with check (
    exists (
      select 1
      from diary_space_members m
      where m.diary_space_id = diary_spaces.id
        and m.user_id = auth.uid()
        and m.role = 'owner'
    )
  );

-- (No insert/delete policy on diary_spaces — single-row table, seeded.)

-- daily_records: members may select / insert / update / delete within their space.
drop policy if exists "members access daily_records" on daily_records;
create policy "members access daily_records"
  on daily_records
  for all
  to authenticated
  using (is_diary_space_member(diary_space_id))
  with check (is_diary_space_member(diary_space_id));

-- daily_record_photos: access via the parent record's diary_space membership.
drop policy if exists "members access daily_record_photos" on daily_record_photos;
create policy "members access daily_record_photos"
  on daily_record_photos
  for all
  to authenticated
  using (
    exists (
      select 1
      from daily_records r
      where r.id = daily_record_photos.daily_record_id
        and is_diary_space_member(r.diary_space_id)
    )
  )
  with check (
    exists (
      select 1
      from daily_records r
      where r.id = daily_record_photos.daily_record_id
        and is_diary_space_member(r.diary_space_id)
    )
  );

-- album_photos: members may select / insert / update / delete within their space.
drop policy if exists "members access album_photos" on album_photos;
create policy "members access album_photos"
  on album_photos
  for all
  to authenticated
  using (is_diary_space_member(diary_space_id))
  with check (is_diary_space_member(diary_space_id));

-- planned_chapters: members may select / insert / delete within their space.
drop policy if exists "members access planned_chapters" on planned_chapters;
create policy "members access planned_chapters"
  on planned_chapters
  for all
  to authenticated
  using (is_diary_space_member(diary_space_id))
  with check (is_diary_space_member(diary_space_id));

-- app_settings: members may select / update within their space.
-- INSERT also gated, so the migration's seeded row is the canonical one.
drop policy if exists "members access app_settings" on app_settings;
create policy "members access app_settings"
  on app_settings
  for all
  to authenticated
  using (is_diary_space_member(diary_space_id))
  with check (is_diary_space_member(diary_space_id));

-- ──────────────────────────────────────────────────────────────────────────
-- Storage object policies for the two private buckets.
--
-- Path convention:
--   daily-photos/{diary_space_id}/{daily_record_id}/{position}-{uuid}.jpg
--   album-photos/{diary_space_id}/{album_photo_id}.jpg
--
-- The policy parses the leading {diary_space_id} segment from `name` and
-- checks membership. Anonymous and non-member requests are denied.
-- ──────────────────────────────────────────────────────────────────────────

drop policy if exists "members read daily-photos" on storage.objects;
create policy "members read daily-photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'daily-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members insert daily-photos" on storage.objects;
create policy "members insert daily-photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'daily-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members update daily-photos" on storage.objects;
create policy "members update daily-photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'daily-photos'
    and is_member_of_storage_path(name)
  )
  with check (
    bucket_id = 'daily-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members delete daily-photos" on storage.objects;
create policy "members delete daily-photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'daily-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members read album-photos" on storage.objects;
create policy "members read album-photos"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'album-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members insert album-photos" on storage.objects;
create policy "members insert album-photos"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'album-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members update album-photos" on storage.objects;
create policy "members update album-photos"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'album-photos'
    and is_member_of_storage_path(name)
  )
  with check (
    bucket_id = 'album-photos'
    and is_member_of_storage_path(name)
  );

drop policy if exists "members delete album-photos" on storage.objects;
create policy "members delete album-photos"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'album-photos'
    and is_member_of_storage_path(name)
  );

-- ──────────────────────────────────────────────────────────────────────────
-- save_daily_record: add membership check + lock execute to authenticated.
--
-- Preserved behavior:
--   - photo-required (raises 23514)
--   - one-record-per-LA-date via the table unique constraint (raises 23505)
--   - record + photo rows inserted atomically
--
-- New behavior:
--   - non-members raise 42501 with message "not_allowed: …"
--   - public role no longer has execute; only authenticated does
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
  if not public.is_diary_space_member(p_diary_space_id) then
    raise exception 'not_allowed: caller is not a member of this diary space'
      using errcode = '42501';
  end if;

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

revoke all on function save_daily_record(
  uuid, date, text, text, text, text,
  text, text, text, text, boolean, text,
  timestamptz, jsonb
) from public;

grant execute on function save_daily_record(
  uuid, date, text, text, text, text,
  text, text, text, text, boolean, text,
  timestamptz, jsonb
) to authenticated;
