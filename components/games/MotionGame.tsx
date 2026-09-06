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
          setPermissionError("Motion access denied — this game needs it to count shakes.");
          return;
        }
      } catch {
        setPermissionError("Couldn't request motion access.");
        return;
      }
    }
    setPhase("counting");
  }

  if (phase === "gate") {
    return (
      <div className="bezel flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">Shake</div>
        <p className="text-sm text-ink-dim">Shake your phone as many times as you can in 15 seconds.</p>
        {permissionError && <p className="text-sm text-danger">{permissionError}</p>}
        <button onClick={start} className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide">
          Ready
        </button>
      </div>
    );
  }

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="font-mono led-text text-6xl font-bold tabular-nums">{count}</div>
      <div className="bezel-inset w-full py-2 text-sm text-ink-dim">
        {(msLeft / 1000).toFixed(1)}s left
      </div>
      {submitting && <p className="text-sm text-ink-dim">Transmitting...</p>}
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
