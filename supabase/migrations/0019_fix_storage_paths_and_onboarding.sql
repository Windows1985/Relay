-- BUG: the photos policies parsed '<round_id>/<user_id>.jpg' with
-- storage.foldername(), which returns ONLY the folder segments — one element
-- here, since '<user_id>.jpg' is the filename, not a folder. So [2] was always
-- NULL: the insert check could never be true ("new row violates row-level
-- security policy" on every upload) and the read check passed NULL as the
-- user id, so no photo was ever readable either. split_part parses the real
-- shape instead.
drop policy if exists "upload own submission photo to an open round you're on" on storage.objects;
drop policy if exists "read a submission photo you're allowed to see" on storage.objects;

create policy "upload own submission photo to an open round you're on"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
    and exists (
      select 1 from public.rounds r
      where r.id = split_part(name, '/', 1)::uuid
        and r.reveal_at is null
        and auth.uid() = any(r.roster)
    )
  );

-- The client uploads with upsert:true so a "Retake" replaces the file; that is
-- an UPDATE on storage.objects, which had no policy at all and would have
-- failed the same way once the insert was fixed.
create policy "replace own submission photo while the round is open"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'photos'
    and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
    and exists (
      select 1 from public.rounds r
      where r.id = split_part(name, '/', 1)::uuid
        and r.reveal_at is null
        and auth.uid() = any(r.roster)
    )
  )
  with check (
    bucket_id = 'photos'
    and split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
  );

create policy "read a submission photo you're allowed to see"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (
      split_part(split_part(name, '/', 2), '.', 1) = auth.uid()::text
      or public.can_view_submission(
           split_part(name, '/', 1)::uuid,
           split_part(split_part(name, '/', 2), '.', 1)::uuid
         )
    )
  );

-- circle_trace is traced with a finger on a canvas, not by moving the phone.
-- Marking it requires='motion' would wrongly exclude it from any group where
-- someone denied the motion permission.
update public.modes set requires = 'none' where id = 'circle_trace';

-- Onboarding is per-account, not per-device: a home-screen PWA has its own
-- storage, so localStorage would replay the intro after install.
alter table public.profiles add column if not exists onboarded boolean not null default false;
