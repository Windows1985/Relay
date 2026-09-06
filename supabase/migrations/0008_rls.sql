create policy "members can view their group's rounds"
  on public.rounds for select to authenticated
  using (public.is_group_member(group_id));

-- SECURITY DEFINER (owned by postgres, bypasses RLS internally) so the
-- "caller has their own submission" check doesn't recurse back into the
-- submissions SELECT policy that calls this function.
create or replace function public.can_view_submission(p_round_id uuid, p_user_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.rounds r
    where r.id = p_round_id
      and public.is_group_member(r.group_id)
      and r.reveal_at is not null and r.reveal_at <= now()
      and exists (
        select 1 from public.submissions s
        where s.round_id = p_round_id and s.user_id = auth.uid()
      )
  );
$$;

create policy "own submission always visible; others visible after reveal to players"
  on public.submissions for select to authenticated
  using (
    user_id = auth.uid()
    or (public.can_view_submission(round_id, user_id) and not hidden)
  );
-- No insert/update/delete policy: all writes to submissions go through
-- submit_round() (SECURITY DEFINER), which validates and scores payloads
-- that plain RLS can't compute.

create policy "own vote always visible; all votes visible once settled"
  on public.votes for select to authenticated
  using (
    voter_id = auth.uid()
    or exists (
      select 1 from public.rounds r
      where r.id = round_id and r.settled_at is not null and public.is_group_member(r.group_id)
    )
  );

create policy "vote after reveal, before close, on a live submission"
  on public.votes for insert to authenticated
  with check (
    voter_id = auth.uid()
    and exists (
      select 1 from public.rounds r
      where r.id = round_id
        and public.is_group_member(r.group_id)
        and r.reveal_at is not null and r.reveal_at <= now()
        and (r.votes_close_at is null or now() < r.votes_close_at)
    )
    and exists (select 1 from public.submissions s where s.round_id = round_id and s.user_id = auth.uid())
    and exists (select 1 from public.submissions s2 where s2.round_id = round_id and s2.user_id = target_user_id and not s2.hidden)
  );

create policy "change vote before close"
  on public.votes for delete to authenticated
  using (
    voter_id = auth.uid()
    and exists (
      select 1 from public.rounds r
      where r.id = round_id and (r.votes_close_at is null or now() < r.votes_close_at)
    )
  );

create policy "members can report a live submission"
  on public.reports for insert to authenticated
  with check (
    reporter_id = auth.uid()
    and exists (
      select 1 from public.rounds r
      where r.id = round_id and public.is_group_member(r.group_id)
    )
    and exists (select 1 from public.submissions s where s.round_id = round_id and s.user_id = target_user_id)
  );

-- One report hides the photo group-wide immediately; actual blob deletion
-- happens out-of-band (Storage can't be touched from SQL) via pg_net
-- calling /api/photos/purge, wired up once that route exists.
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
  return new;
end;
$$;

create trigger on_report_created
  after insert on public.reports
  for each row execute function public.handle_report();
