"use client";

import { useRef, useState } from "react";
import { tap } from "@/lib/haptics";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "ready" | "holding" | "done";

// Hold for exactly N seconds. No visible clock — same "trust your gut" idea as
// Stop at 10.00, but the whole hold is the input, so releasing early or late
// both cost you.
export function HoldButtonGame({ roundId, targetMs }: { roundId: string; targetMs: number }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [heldMs, setHeldMs] = useState<number | null>(null);
  const startRef = useRef(0);
  const { submit, submitting, error } = useSubmitRound(roundId);

  function down() {
    if (phase !== "ready") return;
    tap();
    startRef.current = Date.now();
    setPhase("holding");
  }

  function up() {
    if (phase !== "holding") return;
    const held = Date.now() - startRef.current;
    tap();
    setHeldMs(held);
    setPhase("done");
    submit({ value: held });
  }

  if (phase === "done" && heldMs !== null) {
    const off = Math.abs(heldMs - targetMs);
    return (
      <>
        <div className="ring">
          <div className="ring-inner h-44 w-44">
            <span className="num text-5xl font-semibold">{(heldMs / 1000).toFixed(2)}</span>
            <span className="text-xs font-bold text-ink-2">seconds held</span>
          </div>
        </div>
        <p className="text-sm font-bold text-ink-2">
          {off < 60 ? "Frighteningly good." : off < 350 ? "Close!" : `${(off / 1000).toFixed(2)}s off`}
          {submitting && " · Posting…"}
        </p>
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
      </>
    );
  }

  return (
    <>
      <button
        onPointerDown={down}
        onPointerUp={up}
        onPointerLeave={up}
        onPointerCancel={up}
        className={`btn-primary h-52 w-52 select-none text-2xl ${phase === "holding" ? "is-holding" : ""}`}
        aria-label={phase === "ready" ? "Press and hold" : "Release when you think it's time"}
      >
        {phase === "ready" ? "Hold me" : "Keep holding…"}
      </button>
      <p className="text-sm font-bold text-ink-2">
        {phase === "ready" ? `Release at exactly ${(targetMs / 1000).toFixed(0)} seconds.` : "Let go when it feels right."}
      </p>
    </>
  );
}
