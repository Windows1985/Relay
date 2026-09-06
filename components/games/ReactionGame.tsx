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

  return (
    <div
      onClick={phase === "waiting" || phase === "go" ? handleTap : undefined}
      className={`bezel flex w-full max-w-sm flex-col items-center gap-6 px-6 py-10 text-center ${
        phase === "go" ? "bg-amber" : ""
      }`}
    >
      <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">
        Reaction {round + 1}/{ROUNDS}
      </div>

      {phase === "ready" && (
        <button
          onClick={armRound}
          className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
        >
          Ready
        </button>
      )}
      {phase === "waiting" && <p className="text-sm text-ink-dim">Wait for it...</p>}
      {phase === "go" && <p className="text-2xl font-bold text-ground">TAP!</p>}
      {phase === "too_soon" && (
        <>
          <p className="text-sm text-danger">Too soon.</p>
          <button
            onClick={armRound}
            className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
          >
            Retry
          </button>
        </>
      )}
      {phase === "done" && (
        <div className="font-mono led-text text-4xl font-bold tabular-nums">
          {Math.min(...results)}ms
        </div>
      )}
      {submitting && <p className="text-sm text-ink-dim">Transmitting...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
