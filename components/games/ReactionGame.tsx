"use client";

import { useEffect, useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "ready" | "waiting" | "go" | "too_soon" | "done";

const ROUNDS = 3;

export function ReactionGame({ roundId }: { roundId: string }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [round, setRound] = useState(0);
  const [results, setResults] = useState<number[]>([]);
  const goAt = useRef(0);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  useEffect(() => () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  }, []);

  function armRound() {
    setPhase("waiting");
    const delay = 1000 + Math.random() * 3000;
    timeoutRef.current = setTimeout(() => {
      goAt.current = Date.now();
      setPhase("go");
    }, delay);
  }

  function handleTap() {
    if (phase === "waiting") {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setPhase("too_soon");
      return;
    }
    if (phase === "go") {
      const reaction = Date.now() - goAt.current;
      const next = [...results, reaction];
      setResults(next);
      if (next.length >= ROUNDS) {
        setPhase("done");
        submit({ value: Math.min(...next) });
      } else {
        setRound(round + 1);
        armRound();
      }
    }
  }

  const tappable = phase === "waiting" || phase === "go";

  return (
    <>
      <button
        onPointerDown={tappable ? handleTap : undefined}
        disabled={!tappable}
        className="flex h-56 w-full select-none flex-col items-center justify-center gap-1 rounded-[20px] transition-colors duration-100 disabled:opacity-100"
        style={{
          background: phase === "go" ? "var(--sunset)" : "var(--paper-warm)",
          color: phase === "go" ? "#fff" : "var(--ink)",
          border: phase === "go" ? "none" : "1.5px solid var(--line)",
        }}
        aria-label="Reaction pad"
      >
        {phase === "ready" && <span className="font-display text-xl font-semibold text-ink-2">Round {round + 1} of {ROUNDS}</span>}
        {phase === "waiting" && <span className="font-display text-2xl font-semibold text-ink-2">Wait for it…</span>}
        {phase === "go" && <span className="font-display text-5xl font-bold">TAP!</span>}
        {phase === "too_soon" && <span className="font-display text-2xl font-semibold text-danger">Too soon!</span>}
        {phase === "done" && (
          <>
            <span className="num text-5xl font-semibold">{Math.min(...results)}</span>
            <span className="text-xs font-bold text-ink-2">ms — your best</span>
          </>
        )}
      </button>

      {results.length > 0 && phase !== "done" && (
        <div className="flex gap-2">
          {results.map((r, i) => (
            <span key={i} className="chip num">
              {r}ms
            </span>
          ))}
        </div>
      )}

      {(phase === "ready" || phase === "too_soon") && (
        <button onClick={armRound} className="btn-primary w-full">
          {phase === "too_soon" ? "Try that one again" : "Ready"}
        </button>
      )}
      {phase === "done" && <p className="text-sm font-bold text-ink-2">{submitting ? "Posting…" : "Done!"}</p>}
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
