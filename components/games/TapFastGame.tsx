"use client";

import { useEffect, useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "ready" | "tapping" | "done";

export function TapFastGame({ roundId, durationMs }: { roundId: string; durationMs: number }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [count, setCount] = useState(0);
  const [msLeft, setMsLeft] = useState(durationMs);
  const countRef = useRef(0);
  const { submit, submitting, error } = useSubmitRound(roundId);

  useEffect(() => {
    if (phase !== "tapping") return;
    const start = Date.now();
    const interval = setInterval(() => {
      const left = durationMs - (Date.now() - start);
      setMsLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(interval);
        setPhase("done");
        submit({ value: countRef.current });
      }
    }, 100);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  function tap() {
    countRef.current += 1;
    setCount(countRef.current);
  }

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-6 px-6 py-10 text-center">
      <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">Tap fast</div>

      {phase === "ready" && (
        <button
          onClick={() => setPhase("tapping")}
          className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide"
        >
          Ready
        </button>
      )}

      {phase === "tapping" && (
        <>
          <button
            onClick={tap}
            className="btn-tactile flex h-40 w-40 items-center justify-center rounded-full text-4xl font-bold"
          >
            {count}
          </button>
          <div className="bezel-inset w-full py-2 text-sm text-ink-dim">
            {(msLeft / 1000).toFixed(1)}s left
          </div>
        </>
      )}

      {phase === "done" && <div className="font-mono led-text text-4xl font-bold tabular-nums">{count}</div>}
      {submitting && <p className="text-sm text-ink-dim">Transmitting...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
