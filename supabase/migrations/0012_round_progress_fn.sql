-- Bug: round_progress (security_invoker view over submissions) inherited
-- submissions' own restrictive policy, so a member who hasn't submitted yet
-- saw nobody's progress — defeating the spec's "3/6 played" fallback state,
-- which must be visible to every group member regardless of their own
-- submission status (it reveals a count/who's-in, never an answer).
drop view if exists public.round_progress;

create or replace function public.round_progress(p_round_id uuid)
returns table(user_id uuid, submitted_at timestamptz)
language sql
security definer
set search_path = public
stable
as $$
  select s.user_id, s.submitted_at
  from public.submissions s
  join public.rounds r on r.id = s.round_id
  where s.round_id = p_round_id and public.is_group_member(r.group_id);
$$;
