"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deriveRoundPhase, type RoundTimestamps } from "@/lib/round";

type Group = {
  invite_code: string;
  name: string;
  streak: number;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function ChannelStatus({
  group,
  round,
  roundId,
  rosterSize,
  estimatedOpensAt,
  hasSubmitted,
  hasVoted,
  submittedCount,
}: {
  group: Group;
  round: RoundTimestamps | null;
  roundId: string | null;
  rosterSize: number | null;
  estimatedOpensAt: string;
  hasSubmitted: boolean;
  hasVoted: boolean;
  submittedCount: number;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(tick);
  }, []);

  // Poll the server for phase transitions tick() makes on its own schedule
  // (reveal, settle) — the client can only compute the opens-at countdown
  // itself.
  useEffect(() => {
    const poll = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(poll);
  }, [router]);

  const phase = deriveRoundPhase(round, now, hasSubmitted, hasVoted);

  return (
    <div className="bezel flex w-full flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="text-xs tracking-[0.3em] text-ink-dim uppercase">
        {group.name} &middot; streak {group.streak}
      </div>

      {phase.kind === "no_round" && (
        <>
          <div className="font-mono led-text text-5xl font-bold tabular-nums sm:text-6xl">
            {formatCountdown(new Date(estimatedOpensAt).getTime() - now.getTime())}
          </div>
          <div className="text-sm text-ink-dim">until tonight&apos;s channel opens</div>
        </>
      )}

      {phase.kind === "scheduled" && (
        <>
          <div className="font-mono led-text text-5xl font-bold tabular-nums sm:text-6xl">
            {formatCountdown(phase.opensAt.getTime() - now.getTime())}
          </div>
          <div className="text-sm text-ink-dim">until tonight&apos;s channel opens</div>
        </>
      )}

      {phase.kind === "live" && !phase.hasSubmitted && roundId && (
        <>
          <div className="font-mono led-text text-2xl font-bold uppercase tracking-widest">Live</div>
          <Link
            href={`/play/${roundId}`}
            className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
          >
            Play tonight&apos;s game
          </Link>
        </>
      )}

      {phase.kind === "live" && phase.hasSubmitted && (
        <>
          <div className="font-mono led-text text-3xl font-bold tabular-nums">
            {submittedCount}
            {rosterSize ? ` / ${rosterSize}` : ""}
          </div>
          <div className="text-sm text-ink-dim">transmitted &middot; waiting on the rest of the group</div>
        </>
      )}

      {phase.kind === "voting" && roundId && (
        <>
          <div className="font-mono led-text text-2xl font-bold uppercase tracking-widest">
            {phase.hasVoted ? "Votes in" : "Vote open"}
          </div>
          <Link
            href={`/reveal/${roundId}`}
            className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
          >
            {phase.hasVoted ? "See submissions" : "Cast your vote"}
          </Link>
        </>
      )}

      {phase.kind === "settled" && roundId && (
        <>
          <div className="font-mono led-text text-2xl font-bold uppercase tracking-widest">Revealed</div>
          <Link
            href={`/reveal/${roundId}`}
            className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
          >
            See results
          </Link>
        </>
      )}
    </div>
  );
}
