-- Gap: handle_report() only set hidden=true and never actually called the
-- purge webhook, so a reported photo blob stayed live in Storage
-- indefinitely — spec requires "reported blobs are deleted rather than
-- quarantined," not just hidden from the UI.
create or replace function public.handle_report()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  app_url text;
  webhook_secret text;
begin
  update public.submissions
  set hidden = true
  where round_id = new.round_id and user_id = new.target_user_id;

  select value into app_url from public.app_settings where key = 'app_url';
  select value into webhook_secret from public.app_settings where key = 'webhook_secret';

  if app_url is not null and webhook_secret is not null then
    perform net.http_post(
      url := app_url || '/api/photos/purge',
      headers := jsonb_build_object('content-type', 'application/json', 'x-relay-secret', webhook_secret),
      body := jsonb_build_object('round_id', new.round_id, 'user_id', new.target_user_id)
    );
  end if;

  return new;
end;
$$;
