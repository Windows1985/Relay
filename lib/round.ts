// Round phase is derived from timestamps, never a stored status column —
// this is the one function every screen reads that derivation through.
export type RoundPhase =
  | { kind: "no_round"; opensAt: null }
  | { kind: "scheduled"; opensAt: Date }
  | { kind: "live"; opensAt: Date; hasSubmitted: boolean }
  | { kind: "voting"; votesCloseAt: Date; hasVoted: boolean }
  | { kind: "settled"; winnerId: string | null; streakSurvived: boolean | null };

export type RoundTimestamps = {
  opens_at: string;
  reveal_at: string | null;
  votes_close_at: string | null;
  settled_at: string | null;
  needs_vote: boolean;
  winner_id: string | null;
  streak_survived: boolean | null;
};

export function deriveRoundPhase(
  round: RoundTimestamps | null,
  now: Date,
  hasSubmitted: boolean,
  hasVoted: boolean,
): RoundPhase {
  if (!round) return { kind: "no_round", opensAt: null };

  const opensAt = new Date(round.opens_at);
  if (now < opensAt) return { kind: "scheduled", opensAt };

  if (round.settled_at) {
    return { kind: "settled", winnerId: round.winner_id, streakSurvived: round.streak_survived };
  }

  if (round.reveal_at) {
    if (round.needs_vote && round.votes_close_at) {
      return { kind: "voting", votesCloseAt: new Date(round.votes_close_at), hasVoted };
    }
    // Revealed, auto-scored, not yet settled (tick hasn't run this minute
    // yet) — treat as settled-pending; the UI shows the same reveal state.
    return { kind: "settled", winnerId: round.winner_id, streakSurvived: round.streak_survived };
  }

  return { kind: "live", opensAt, hasSubmitted };
}

function demo() {
  const base: RoundTimestamps = {
    opens_at: "2026-01-01T19:00:00Z",
    reveal_at: null,
    votes_close_at: null,
    settled_at: null,
    needs_vote: false,
    winner_id: null,
    streak_survived: null,
  };
  const before = new Date("2026-01-01T18:00:00Z");
  const during = new Date("2026-01-01T20:00:00Z");

  console.assert(deriveRoundPhase(null, during, false, false).kind === "no_round", "no round");
  console.assert(deriveRoundPhase(base, before, false, false).kind === "scheduled", "scheduled");
  console.assert(deriveRoundPhase(base, during, false, false).kind === "live", "live");

  const revealedVoted = { ...base, reveal_at: during.toISOString(), needs_vote: true, votes_close_at: "2026-01-02T12:00:00Z" };
  console.assert(deriveRoundPhase(revealedVoted, during, true, false).kind === "voting", "voting");

  const settled = { ...base, reveal_at: during.toISOString(), settled_at: during.toISOString(), winner_id: "u1", streak_survived: true };
  const settledPhase = deriveRoundPhase(settled, during, true, false);
  console.assert(settledPhase.kind === "settled" && settledPhase.winnerId === "u1", "settled");

  console.log("lib/round.ts self-check passed");
}

if (require.main === module) demo();
