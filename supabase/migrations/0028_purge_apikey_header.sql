-- Storage rejected new-format keys (sb_secret_...) with "Invalid Compact JWS"
-- because only an Authorization bearer was sent, which it tries to parse as a
-- JWT. Sending the key as `apikey` too works for both the new format and
-- legacy service_role JWTs, so this no longer depends on which key style the
-- project happens to issue. Verified end to end: a photo round settled and the
-- object became unfetchable ("Object not found").
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
      'apikey', service_key,
      'authorization', 'Bearer ' || service_key
    ),
    body := jsonb_build_object('prefixes', to_jsonb(paths))
  );

  return array_length(paths, 1);
end;
$$;

revoke execute on function public.purge_round_photos(uuid, uuid) from public, anon, authenticated;
