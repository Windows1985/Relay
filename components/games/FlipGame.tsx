"use client";

import { useEffect, useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "gate" | "counting" | "done";

// Counts face-up <-> face-down transitions off the gravity vector's z axis
// (z is +9.8 face up, -9.8 face down). Hysteresis thresholds at ±6 stop a
// phone held on its side from racking up phantom flips.
export function FlipGame({ roundId, durationMs }: { roundId: string; durationMs: number }) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [count, setCount] = useState(0);
  const [msLeft, setMsLeft] = useState(durationMs);
  const [facing, setFacing] = useState<"up" | "down" | "edge">("edge");
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  const orientation = useRef<"up" | "down" | null>(null);
  const countRef = useRef(0);

  useEffect(() => {
    if (phase !== "counting") return;

    function handleMotion(e: DeviceMotionEvent) {
      const z = e.accelerationIncludingGravity?.z;
      if (z === null || z === undefined) return;

      const next = z > 6 ? "up" : z < -6 ? "down" : null;
      if (!next) {
        setFacing("edge");
        return;
      }
      setFacing(next);
      if (orientation.current && orientation.current !== next) {
        countRef.current += 1;
        setCount(countRef.current);
      }
      orientation.current = next;
    }

    window.addEventListener("devicemotion", handleMotion);
    const start = Date.now();
    const interval = setInterval(() => {
      const left = durationMs - (Date.now() - start);
      setMsLeft(Math.max(0, left));
      if (left <= 0) {
        clearInterval(interval);
        window.removeEventListener("devicemotion", handleMotion);
        setPhase("done");
        submit({ value: countRef.current });
      }
    }, 100);

    return () => {
      window.removeEventListener("devicemotion", handleMotion);
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  async function start() {
    const DeviceMotionEventTyped = DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<"granted" | "denied">;
    };
    if (typeof DeviceMotionEventTyped.requestPermission === "function") {
      try {
        const result = await DeviceMotionEventTyped.requestPermission();
        if (result !== "granted") {
          setPermissionError("Motion access was denied — this game needs it to count flips.");
          return;
        }
      } catch {
        setPermissionError("Couldn't ask for motion access. Try again from the installed app.");
        return;
      }
    }
    setPhase("counting");
  }

  if (phase === "gate") {
    return (
      <>
        {permissionError && <p className="text-sm font-bold text-danger">{permissionError}</p>}
        <button onClick={start} className="btn-primary w-full">
          I&apos;m ready — go
        </button>
      </>
    );
  }

  const progress = Math.max(0, msLeft / durationMs);
  return (
    <>
      <div className="ring">
        <div className="ring-inner h-44 w-44">
          <span className="num text-6xl font-semibold">{count}</span>
          <span className="text-xs font-bold text-ink-2">flips</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: "var(--sunset)" }} />
      </div>
      <p className="text-sm font-bold text-ink-2">
        {phase === "done"
          ? submitting
            ? "Posting…"
            : "Done!"
          : `${(msLeft / 1000).toFixed(1)}s — screen ${facing === "edge" ? "on its side" : facing}`}
      </p>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
