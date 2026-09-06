"use client";

import { useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "ready" | "running" | "done";

export function StopAtTargetGame({ roundId, targetMs }: { roundId: string; targetMs: number }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [resultMs, setResultMs] = useState<number | null>(null);
  const startRef = useRef(0);
  const { submit, submitting, error } = useSubmitRound(roundId);

  function start() {
    startRef.current = Date.now();
    setPhase("running");
  }

  function stop() {
    const elapsed = Date.now() - startRef.current;
    setResultMs(elapsed);
    setPhase("done");
    submit({ value: elapsed });
  }

  if (phase === "done" && resultMs !== null) {
    const off = Math.abs(resultMs - targetMs);
    return (
      <>
        <div className="ring">
          <div className="ring-inner h-44 w-44">
            <span className="num text-5xl font-semibold">{(resultMs / 1000).toFixed(2)}</span>
            <span className="text-xs font-bold text-ink-2">seconds</span>
          </div>
        </div>
        <p className="text-sm font-bold text-ink-2">
          {off < 50 ? "Unreal." : off < 300 ? "Close!" : `${(off / 1000).toFixed(2)}s off`} {submitting && "· Posting…"}
        </p>
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
      </>
    );
  }

  return (
    <>
      <button
        onClick={phase === "ready" ? start : stop}
        className="btn-primary h-52 w-52 text-4xl"
        aria-label={phase === "ready" ? "Start the timer" : "Stop the timer"}
      >
        {phase === "ready" ? "Start" : "Stop"}
      </button>
      <p className="text-sm font-bold text-ink-2">
        {phase === "ready" ? "No clock. Just your gut." : "Counting… tap at exactly 10.00"}
      </p>
    </>
  );
}
