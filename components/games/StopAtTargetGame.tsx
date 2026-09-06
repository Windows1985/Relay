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

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">
        Stop at {(targetMs / 1000).toFixed(2)}s
      </div>
      <p className="text-sm text-ink-dim">No clock. Just your sense of time.</p>

      {phase === "ready" && (
        <button onClick={start} className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide">
          Start
        </button>
      )}
      {phase === "running" && (
        <button onClick={stop} className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide">
          Stop
        </button>
      )}
      {phase === "done" && resultMs !== null && (
        <div className="font-mono led-text text-4xl font-bold tabular-nums">
          {(resultMs / 1000).toFixed(2)}s
        </div>
      )}
      {submitting && <p className="text-sm text-ink-dim">Transmitting...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
