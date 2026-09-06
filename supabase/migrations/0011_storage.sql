insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

-- Path convention: {round_id}/{user_id}.jpg
create policy "upload own submission photo to an open round you're on"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[2] = auth.uid()::text
    and exists (
      select 1 from public.rounds r
      where r.id = (storage.foldername(name))[1]::uuid
        and r.reveal_at is null
        and auth.uid() = any(r.roster)
    )
  );

-- Own file always readable (mirrors submissions' own-row policy: you can
-- always see what you submitted, even before reveal); anyone else's only
-- once can_view_submission allows it (reveal has passed and caller has
-- their own submission in the round).
create policy "read a submission photo you're allowed to see"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[2] = auth.uid()::text
      or public.can_view_submission((storage.foldername(name))[1]::uuid, (storage.foldername(name))[2]::uuid)
    )
  );
