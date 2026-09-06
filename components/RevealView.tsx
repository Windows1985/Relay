"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Submission = {
  userId: string;
  username: string;
  payload: Record<string, unknown>;
  score: number | null;
  hidden: boolean;
  photoUrl: string | null;
  voteCount: number;
};

export function RevealView({
  roundId,
  currentUserId,
  inputType,
  scoring,
  needsVote,
  votingOpen,
  hasVoted,
  settled,
  winnerId,
  streakSurvived,
  votesCloseAt,
  submissions,
}: {
  roundId: string;
  currentUserId: string;
  inputType: string;
  scoring: string;
  target: number | null;
  needsVote: boolean;
  votingOpen: boolean;
  hasVoted: boolean;
  settled: boolean;
  winnerId: string | null;
  streakSurvived: boolean | null;
  votesCloseAt: string | null;
  submissions: Submission[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [voted, setVoted] = useState(hasVoted);
  const [reported, setReported] = useState<Set<string>>(new Set());

  async function castVote(targetUserId: string) {
    setBusy(targetUserId);
    const supabase = createClient();
    const { error } = await supabase
      .from("votes")
      .insert({ round_id: roundId, voter_id: currentUserId, target_user_id: targetUserId });
    setBusy(null);
    if (!error) {
      setVoted(true);
      router.refresh();
    }
  }

  async function reportSubmission(targetUserId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("reports")
      .insert({ round_id: roundId, target_user_id: targetUserId, reporter_id: currentUserId });
    if (!error) {
      setReported((prev) => new Set(prev).add(targetUserId));
      router.refresh();
    }
  }

  const showVoteCounts = settled;
  const canVoteNow = needsVote && votingOpen && !voted;

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="bezel flex flex-col items-center gap-2 px-6 py-8 text-center">
        <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">
          {settled ? "Results" : canVoteNow ? "Vote" : "Votes in"}
        </div>
        {settled && streakSurvived !== null && (
          <p className={`text-sm ${streakSurvived ? "text-ok" : "text-danger"}`}>
            {streakSurvived ? "Streak survives." : "Streak broke."}
          </p>
        )}
        {!settled && needsVote && votesCloseAt && (
          <p className="text-sm text-ink-dim">
            Results at {new Date(votesCloseAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>

      {submissions
        .filter((s) => !s.hidden || s.userId === currentUserId)
        .map((s) => {
          const isWinner = settled && winnerId === s.userId;
          return (
            <div
              key={s.userId}
              className={`bezel-inset flex flex-col gap-2 p-4 ${isWinner ? "ring-2 ring-amber" : ""}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{s.username}</span>
                {isWinner && <span className="font-mono led-text text-xs uppercase">Winner</span>}
                {scoring !== "vote" && scoring !== "tally" && s.score !== null && (
                  <span className="font-mono text-sm text-ink-dim tabular-nums">{s.score}</span>
                )}
                {showVoteCounts && (scoring === "vote" || scoring === "tally") && (
                  <span className="font-mono text-sm text-ink-dim tabular-nums">{s.voteCount} votes</span>
                )}
              </div>

              {inputType === "photo" && s.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={`${s.username}'s submission`} className="w-full object-cover" />
              )}
              {inputType === "text" && typeof s.payload.text === "string" && (
                <p className="text-ink">{s.payload.text}</p>
              )}

              {inputType === "photo" && s.userId !== currentUserId && !reported.has(s.userId) && (
                <button
                  onClick={() => reportSubmission(s.userId)}
                  className="self-end text-xs text-danger underline"
                >
                  Report
                </button>
              )}
              {reported.has(s.userId) && <span className="self-end text-xs text-ink-dim">Reported</span>}

              {canVoteNow && s.userId !== currentUserId && (
                <button
                  onClick={() => castVote(s.userId)}
                  disabled={busy === s.userId}
                  className="btn-tactile w-full py-2 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
                >
                  Vote
                </button>
              )}
            </div>
          );
        })}
    </div>
  );
}
