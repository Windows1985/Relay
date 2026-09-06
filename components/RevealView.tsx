"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Name } from "@/components/Name";
import { ANIM_CLASS, type CosmeticCss } from "@/lib/cosmetics";
import { FlameIcon, HeartIcon } from "@/components/icons";
import { modeCopy } from "@/lib/modes";

type Submission = {
  userId: string;
  username: string;
  equippedColour: string | null;
  equippedAnim: string | null;
  payload: Record<string, unknown>;
  score: number | null;
  hidden: boolean;
  photoUrl: string | null;
  voteCount: number;
};

function scoreLabel(modeId: string, score: number) {
  if (modeId === "stop10") return `${(score / 1000).toFixed(2)}s`;
  if (modeId === "reaction") return `${score}ms`;
  if (modeId === "shake") return `${score} shakes`;
  if (modeId === "tap_fast") return `${score} taps`;
  return String(score);
}

export function RevealView({
  roundId,
  modeId,
  currentUserId,
  inputType,
  scoring,
  needsVote,
  votingOpen,
  hasVoted,
  myVoteTarget,
  settled,
  winnerId,
  streakSurvived,
  freezeUsedByUsername,
  votesCloseAt,
  submissions,
  cosmeticsCss,
}: {
  roundId: string;
  modeId: string;
  currentUserId: string;
  inputType: string;
  scoring: string;
  target: number | null;
  needsVote: boolean;
  votingOpen: boolean;
  hasVoted: boolean;
  myVoteTarget: string | null;
  settled: boolean;
  winnerId: string | null;
  streakSurvived: boolean | null;
  freezeUsedByUsername: string | null;
  votesCloseAt: string | null;
  submissions: Submission[];
  cosmeticsCss: Record<string, CosmeticCss>;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [voted, setVoted] = useState<string | null>(myVoteTarget ?? (hasVoted ? "?" : null));
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Optimistic: the heart fills on tap and only reverts if the write fails,
  // so voting never waits on a round trip.
  async function castVote(targetUserId: string) {
    const previous = voted;
    setVoted(targetUserId);
    setBusy(targetUserId);
    setError(null);
    const supabase = createClient();
    const { error: err } = await supabase
      .from("votes")
      .insert({ round_id: roundId, voter_id: currentUserId, target_user_id: targetUserId });
    setBusy(null);
    if (err) {
      setVoted(previous);
      return setError("Couldn't save your vote. Try again.");
    }
    router.refresh();
  }

  async function reportSubmission(targetUserId: string) {
    const supabase = createClient();
    const { error: err } = await supabase
      .from("reports")
      .insert({ round_id: roundId, target_user_id: targetUserId, reporter_id: currentUserId });
    if (!err) {
      setReported((prev) => new Set(prev).add(targetUserId));
      router.refresh();
    }
  }

  const canVoteNow = needsVote && votingOpen && voted === null;
  const winner = submissions.find((s) => s.userId === winnerId);
  const { title } = modeCopy(modeId);

  return (
    <div className="flex w-full flex-col gap-4">
      <section className="card flex flex-col items-center gap-3 p-6 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-2">{title}</p>
        <h1 className="font-display text-2xl font-bold">
          {settled ? (winner ? "We have a winner" : "No winner tonight") : canVoteNow ? "Pick your favourite" : "Votes are in"}
        </h1>

        {settled && winner && (
          <div className="flex flex-col items-center gap-2">
            <div className="ring">
              <div className="ring-inner h-20 w-20">
                <span className="font-display text-3xl font-semibold">{winner.username.slice(0, 1).toUpperCase()}</span>
              </div>
            </div>
            <div className="font-display text-lg font-semibold">
              <Name
                username={winner.username}
                colourCss={winner.equippedColour ? cosmeticsCss[winner.equippedColour] ?? null : null}
                animClass={winner.equippedAnim ? ANIM_CLASS[winner.equippedAnim] ?? null : null}
              />
            </div>
          </div>
        )}

        {settled && streakSurvived !== null && (
          <span className={`chip ${streakSurvived ? "text-ok" : "text-danger"}`}>
            <FlameIcon size={14} />
            {streakSurvived ? "Streak lives" : "Streak broke"}
          </span>
        )}
        {settled && freezeUsedByUsername && (
          <p className="text-xs text-ink-2">Saved by a freeze — {freezeUsedByUsername} paid for it.</p>
        )}
        {!settled && needsVote && votesCloseAt && (
          <p className="text-sm text-ink-2">
            {canVoteNow ? "Tap the heart on the one that wins tonight." : "Results at "}
            {!canVoteNow && new Date(votesCloseAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
      </section>

      {submissions
        .filter((s) => !s.hidden || s.userId === currentUserId)
        .map((s) => {
          const isWinner = settled && winnerId === s.userId;
          const isMine = s.userId === currentUserId;
          const mineVote = voted === s.userId;
          const showHeart = scoring === "vote";
          const heartActive = mineVote || (settled && s.voteCount > 0);
          return (
            <article key={s.userId} className="card flex flex-col gap-3 p-4" style={isWinner ? { boxShadow: "0 0 0 2.5px var(--g3), var(--shadow-card)" } : undefined}>
              <header className="flex items-center gap-3">
                <span className="avatar">{s.username.slice(0, 1).toUpperCase()}</span>
                <span className="flex-1 font-bold">
                  <Name
                    username={isMine ? `${s.username} (you)` : s.username}
                    colourCss={s.equippedColour ? cosmeticsCss[s.equippedColour] ?? null : null}
                    animClass={s.equippedAnim ? ANIM_CLASS[s.equippedAnim] ?? null : null}
                  />
                </span>
                {isWinner && <span className="badge-sunset text-xs">Winner</span>}
                {!isWinner && s.score !== null && scoring !== "vote" && scoring !== "tally" && (
                  <span className="chip num">{scoreLabel(modeId, s.score)}</span>
                )}
              </header>

              {inputType === "photo" && s.photoUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.photoUrl} alt={`${s.username}'s photo`} className="aspect-square w-full rounded-2xl object-cover" />
              )}
              {inputType === "text" && typeof s.payload.text === "string" && (
                <p className="font-display text-xl font-semibold leading-snug">{s.payload.text}</p>
              )}
              {isWinner && s.score !== null && scoring !== "vote" && scoring !== "tally" && (
                <p className="num text-3xl font-semibold">{scoreLabel(modeId, s.score)}</p>
              )}

              {(showHeart || (inputType === "photo" && !isMine)) && (
                <footer className="flex items-center justify-between">
                  {showHeart ? (
                    <button
                      onClick={() => canVoteNow && !isMine && castVote(s.userId)}
                      disabled={!canVoteNow || isMine || busy === s.userId}
                      aria-label={isMine ? "Your post" : mineVote ? "Your vote" : "Vote for this"}
                      className={`flex min-h-11 items-center gap-2 rounded-full px-3 font-bold transition-transform ${
                        heartActive ? "text-g2" : "text-ink-2"
                      } ${mineVote ? "heart-pop" : ""} disabled:opacity-100`}
                    >
                      <HeartIcon size={26} filled={heartActive} />
                      {settled ? (
                        <span className="num text-sm">{s.voteCount}</span>
                      ) : mineVote ? (
                        <span className="text-sm">Your vote</span>
                      ) : canVoteNow && !isMine ? (
                        <span className="text-sm">Vote</span>
                      ) : null}
                    </button>
                  ) : (
                    <span />
                  )}
                  {inputType === "photo" && !isMine && (
                    reported.has(s.userId) ? (
                      <span className="text-xs font-bold text-ink-2">Reported</span>
                    ) : (
                      <button onClick={() => reportSubmission(s.userId)} className="min-h-11 px-2 text-xs font-bold text-ink-2">
                        Report
                      </button>
                    )
                  )}
                </footer>
              )}
            </article>
          );
        })}
    </div>
  );
}
