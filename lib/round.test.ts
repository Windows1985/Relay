// Run with: npx tsx lib/round.test.ts
// Lives in its own file (not at the bottom of round.ts) because round.ts is
// imported by "use client" components — a Node-only `require.main ===
// module` guard there crashed the browser bundle with "module is not
// defined" and took the whole home page down.
import { deriveRoundPhase, type RoundTimestamps } from "./round";

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
