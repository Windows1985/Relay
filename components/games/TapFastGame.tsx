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

  if (phase === "ready") {
    return (
      <button onClick={() => setPhase("tapping")} className="btn-primary w-full">
        Ready — start the clock
      </button>
    );
  }

  const progress = Math.max(0, msLeft / durationMs);
  return (
    <>
      <button
        onPointerDown={phase === "tapping" ? tap : undefined}
        disabled={phase !== "tapping"}
        className="btn-primary num h-52 w-52 text-6xl select-none"
        aria-label="Tap"
      >
        {count}
      </button>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: "var(--sunset)" }} />
      </div>
      <p className="text-sm font-bold text-ink-2">
        {phase === "done" ? (submitting ? "Posting…" : `${count} taps. Done!`) : `${(msLeft / 1000).toFixed(1)}s left`}
      </p>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
