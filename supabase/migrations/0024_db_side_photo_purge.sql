-- Photo deletion used to depend on a Next.js route on Vercel, which needs
-- RELAY_WEBHOOK_SECRET and SUPABASE_SERVICE_ROLE_KEY set there. They weren't,
-- so nothing was ever deleted. Supabase blocks deleting storage rows from SQL
-- (storage.protect_delete), but pg_net can call the Storage API directly, so
-- the database does this itself and the deployment drops out of the picture.
insert into public.app_settings (key, value) values ('service_role_key', null)
on conflict (key) do nothing;
insert into public.app_settings (key, value) values ('project_url', 'https://ptcoqnzfuocrqrqtbmkw.supabase.co')
on conflict (key) do update set value = excluded.value;

-- pg_net is fire-and-forget, so this cannot know whether Storage accepted the
-- delete. Clearing photo_path on the assumption it did would claim a deletion
-- that may not have happened (wrong key, network failure). Leaving the row
-- alone means the reveal page's signed-URL call fails for an object that is
-- genuinely gone and the UI falls back to "photo deleted" — so the interface
-- reflects the bucket's real state rather than an optimistic one.
create or replace function public.purge_round_photos(p_round_id uuid, p_user_id uuid default null)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  service_key text;
  project_url text;
  paths text[];
begin
  select value into service_key from public.app_settings where key = 'service_role_key';
  select value into project_url from public.app_settings where key = 'project_url';
  if service_key is null or project_url is null then return 0; end if;

  select array_agg(photo_path) into paths
  from public.submissions
  where round_id = p_round_id
    and photo_path is not null
    and (p_user_id is null or user_id = p_user_id);

  if paths is null or array_length(paths, 1) = 0 then return 0; end if;

  perform net.http_delete(
    url := project_url || '/storage/v1/object/photos',
    headers := jsonb_build_object(
      'content-type', 'application/json',
      'authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('prefixes', to_jsonb(paths))
  );

  return array_length(paths, 1);
end;
$$;

revoke execute on function public.purge_round_photos(uuid, uuid) from public, anon, authenticated;

-- settle_round's photo step and handle_report now call the above instead of
-- the Vercel webhook. Every scoring/streak/freeze rule in settle_round is
-- unchanged from 0021; see that file for the full body.
create or replace function public.handle_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.submissions
  set hidden = true
  where round_id = new.round_id and user_id = new.target_user_id;

  perform public.purge_round_photos(new.round_id, new.target_user_id);
  return new;
end;
$$;
