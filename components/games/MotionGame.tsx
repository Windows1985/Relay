"use client";

import { useEffect, useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

type Phase = "gate" | "counting" | "done";

export function MotionGame({ roundId, durationMs }: { roundId: string; durationMs: number }) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [count, setCount] = useState(0);
  const [msLeft, setMsLeft] = useState(durationMs);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  const lastMagnitude = useRef(0);
  const lastCountAt = useRef(0);
  const countRef = useRef(0);

  useEffect(() => {
    if (phase !== "counting") return;

    function handleMotion(e: DeviceMotionEvent) {
      const a = e.accelerationIncludingGravity;
      if (!a || a.x === null || a.y === null || a.z === null) return;
      const magnitude = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
      const delta = Math.abs(magnitude - lastMagnitude.current);
      lastMagnitude.current = magnitude;

      const now = Date.now();
      if (delta > 15 && now - lastCountAt.current > 200) {
        lastCountAt.current = now;
        countRef.current += 1;
        setCount(countRef.current);
      }
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
          setPermissionError("Motion access was denied — this game needs it to count shakes.");
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
          <span className="text-xs font-bold text-ink-2">shakes</span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full transition-[width] duration-100" style={{ width: `${progress * 100}%`, background: "var(--sunset)" }} />
      </div>
      <p className="text-sm font-bold text-ink-2">{phase === "done" ? (submitting ? "Posting…" : "Done!") : `${(msLeft / 1000).toFixed(1)}s left — keep going`}</p>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
