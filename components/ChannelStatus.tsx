"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deriveRoundPhase, type RoundTimestamps } from "@/lib/round";
import { ShareReminder } from "@/components/ShareReminder";
import { CheckIcon, LockIcon } from "@/components/icons";

type Group = {
  invite_code: string;
  name: string;
  streak: number;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const s = String(totalSeconds % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}

function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function ChannelStatus({
  group,
  round,
  roundId,
  rosterSize,
  estimatedOpensAt,
  estimatedWindowEnd,
  hasSubmitted,
  hasVoted,
  submittedCount,
}: {
  group: Group;
  round: RoundTimestamps | null;
  roundId: string | null;
  rosterSize: number | null;
  estimatedOpensAt: string;
  estimatedWindowEnd: string;
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

  // Poll for the phase transitions tick() makes on its own schedule. Runs
  // once: router.refresh is captured via closure.
  useEffect(() => {
    const poll = setInterval(() => router.refresh(), 15000);
    return () => clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const phase = deriveRoundPhase(round, now, hasSubmitted, hasVoted);
  const live = phase.kind === "live" || phase.kind === "voting" || phase.kind === "settled";
  const played = `${submittedCount}${rosterSize ? ` of ${rosterSize}` : ""} played`;

  let ringContent: React.ReactNode;
  let headline: string;
  let sub: string;
  let action: React.ReactNode;

  if (phase.kind === "no_round" || phase.kind === "scheduled") {
    const at = phase.kind === "scheduled" ? phase.opensAt.getTime() : new Date(estimatedOpensAt).getTime();
    ringContent = (
      <>
        <LockIcon size={26} className="text-ink-2" />
        <span className="num text-3xl font-semibold text-ink">{formatCountdown(at - now.getTime())}</span>
      </>
    );
    headline = "Tonight's game is locked";
    sub = `Opens at ${timeLabel(estimatedOpensAt)}. Nobody knows what it is yet.`;
    action = (
      <button disabled className="btn-primary w-full">
        Opens at {timeLabel(estimatedOpensAt)}
      </button>
    );
  } else if (phase.kind === "live" && !phase.hasSubmitted) {
    ringContent = (
      <>
        <span className="font-display text-3xl font-semibold text-ink">LIVE</span>
        <span className="text-xs font-bold text-ink-2">{played}</span>
      </>
    );
    headline = "Tonight's game is on";
    sub = "Play to unlock everyone's answers.";
    action = (
      <Link href={`/play/${roundId}`} className="btn-primary w-full">
        Play now
      </Link>
    );
  } else if (phase.kind === "live") {
    ringContent = (
      <>
        <CheckIcon size={28} className="text-g3" />
        <span className="num text-2xl font-semibold text-ink">
          {submittedCount}
          {rosterSize ? `/${rosterSize}` : ""}
        </span>
      </>
    );
    headline = "You're in";
    sub = `Reveal drops when everyone's played or at ${timeLabel(estimatedWindowEnd)}.`;
    action = (
      <ShareReminder
        groupName={group.name}
        hoursLeft={Math.max(1, Math.ceil((new Date(estimatedWindowEnd).getTime() - now.getTime()) / 3600000))}
        notPlayed={Math.max(0, (rosterSize ?? 0) - submittedCount)}
      />
    );
  } else if (phase.kind === "voting") {
    ringContent = (
      <>
        <span className="font-display text-2xl font-semibold text-ink">Vote</span>
        <span className="text-xs font-bold text-ink-2">{played}</span>
      </>
    );
    headline = phase.hasVoted ? "Your vote's in" : "Revealed — pick a winner";
    sub = phase.hasVoted ? "Results land when voting closes." : "Everyone's answers are open. Tap a heart.";
    action = (
      <Link href={`/reveal/${roundId}`} className="btn-primary w-full">
        {phase.hasVoted ? "See everyone's answers" : "Vote now"}
      </Link>
    );
  } else {
    ringContent = (
      <>
        <span className="font-display text-2xl font-semibold text-ink">Done</span>
        <span className="text-xs font-bold text-ink-2">{played}</span>
      </>
    );
    headline = "Tonight's revealed";
    sub = "See who won and whether the streak lived.";
    action = (
      <Link href={`/reveal/${roundId}`} className="btn-primary w-full">
        See the reveal
      </Link>
    );
  }

  return (
    <section className="card flex w-full flex-col items-center gap-4 p-6 text-center">
      <div className={`ring ${live ? "" : "ring-muted"} ${phase.kind === "live" && phase.hasSubmitted ? "ring-complete" : ""}`}>
        <div className="ring-inner h-40 w-40">{ringContent}</div>
      </div>

      <div className="flex flex-col gap-1">
        <h2 className="font-display text-xl font-semibold">{headline}</h2>
        <p className="text-sm text-ink-2">{sub}</p>
      </div>

      <div className="w-full">{action}</div>

      <Link href={`/g/${group.invite_code}`} className="chip">
        {group.name} · {group.streak} day streak
      </Link>
    </section>
  );
}
