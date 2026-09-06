import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoundTimestamps } from "@/lib/round";
import { todayInZone } from "@/lib/tz";

export type TodaysRound = RoundTimestamps & {
  id: string;
  mode_id: string;
  input_type: string;
  scoring: string;
  target: number | null;
  duration_ms: number | null;
  roster: string[];
  prompt_text: string | null;
};

// Used by the home tile, play screen, and reveal screen — the round-plus-
// mode join every one of them needs before it can derive a phase. Filters
// to the group's *local* today (tick() only inserts a row once the window
// opens), so "no row yet" correctly means "hasn't opened tonight" rather
// than silently falling back to yesterday's settled round.
export async function getTodaysRound(
  supabase: SupabaseClient,
  groupId: string,
  groupTz: string,
): Promise<TodaysRound | null> {
  const { data } = await supabase
    .from("rounds")
    .select(
      `id, mode_id, opens_at, reveal_at, votes_close_at, settled_at, winner_id,
       streak_survived, roster, prompts(text),
       modes(input_type, scoring, target, duration_ms, needs_vote)`,
    )
    .eq("group_id", groupId)
    .eq("local_date", todayInZone(groupTz))
    .maybeSingle();

  if (!data) return null;
  const mode = data.modes as unknown as {
    input_type: string;
    scoring: string;
    target: number | null;
    duration_ms: number | null;
    needs_vote: boolean;
  };
  const prompt = data.prompts as unknown as { text: string } | null;

  return {
    id: data.id,
    mode_id: data.mode_id,
    input_type: mode.input_type,
    scoring: mode.scoring,
    target: mode.target,
    duration_ms: mode.duration_ms,
    roster: data.roster,
    prompt_text: prompt?.text ?? null,
    opens_at: data.opens_at,
    reveal_at: data.reveal_at,
    votes_close_at: data.votes_close_at,
    settled_at: data.settled_at,
    needs_vote: mode.needs_vote,
    winner_id: data.winner_id,
    streak_survived: data.streak_survived,
  };
}

// One call answers both "how many played" and "did I play" — asking those
// separately cost an extra round trip per group on every home render.
export async function getRoundProgress(
  supabase: SupabaseClient,
  roundId: string,
  userId: string,
): Promise<{ submittedCount: number; hasSubmitted: boolean }> {
  const { data } = await supabase.rpc("round_progress", { p_round_id: roundId });
  const rows = (data ?? []) as { user_id: string }[];
  return { submittedCount: rows.length, hasSubmitted: rows.some((r) => r.user_id === userId) };
}
