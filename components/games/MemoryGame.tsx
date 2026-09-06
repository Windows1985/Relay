"use client";

import { useEffect, useRef, useState } from "react";
import { tap, buzz } from "@/lib/haptics";
import { useSubmitRound } from "./useSubmitRound";

const PADS = [
  { id: 0, color: "#f9a73e" },
  { id: 1, color: "#fb5f6a" },
  { id: 2, color: "#c13584" },
  { id: 3, color: "#7c3aed" },
];

type Phase = "ready" | "showing" | "input" | "done";

// Simon: the sequence grows by one each round; your score is the longest
// sequence you repeated correctly.
export function MemoryGame({ roundId }: { roundId: string }) {
  const [phase, setPhase] = useState<Phase>("ready");
  const [sequence, setSequence] = useState<number[]>([]);
  const [lit, setLit] = useState<number | null>(null);
  const [level, setLevel] = useState(0);
  const inputIndex = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const { submit, submitting, error } = useSubmitRound(roundId);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  function playSequence(seq: number[]) {
    setPhase("showing");
    timers.current.forEach(clearTimeout);
    timers.current = [];
    seq.forEach((pad, i) => {
      timers.current.push(setTimeout(() => setLit(pad), 600 * i + 250));
      timers.current.push(setTimeout(() => setLit(null), 600 * i + 700));
    });
    timers.current.push(
      setTimeout(() => {
        inputIndex.current = 0;
        setPhase("input");
      }, 600 * seq.length + 300),
    );
  }

  function nextRound(current: number[]) {
    const next = [...current, Math.floor(Math.random() * 4)];
    setSequence(next);
    playSequence(next);
  }

  function press(pad: number) {
    if (phase !== "input") return;
    tap();
    setLit(pad);
    setTimeout(() => setLit(null), 160);

    if (sequence[inputIndex.current] !== pad) {
      buzz();
      setPhase("done");
      submit({ value: level });
      return;
    }

    inputIndex.current += 1;
    if (inputIndex.current >= sequence.length) {
      setLevel(sequence.length);
      setTimeout(() => nextRound(sequence), 550);
    }
  }

  if (phase === "ready") {
    return (
      <>
        <button onClick={() => nextRound([])} className="btn-primary w-full">
          Start
        </button>
        <p className="text-sm font-bold text-ink-2">Repeat the pattern. It grows by one each time.</p>
      </>
    );
  }

  if (phase === "done") {
    return (
      <>
        <div className="ring">
          <div className="ring-inner h-44 w-44">
            <span className="num text-6xl font-semibold">{level}</span>
            <span className="text-xs font-bold text-ink-2">steps remembered</span>
          </div>
        </div>
        <p className="text-sm font-bold text-ink-2">{submitting ? "Posting…" : "Done!"}</p>
        {error && <p className="text-sm font-bold text-danger">{error}</p>}
      </>
    );
  }

  return (
    <>
      <div className="grid w-full max-w-[280px] grid-cols-2 gap-3">
        {PADS.map((p) => (
          <button
            key={p.id}
            onPointerDown={() => press(p.id)}
            disabled={phase !== "input"}
            aria-label={`Pad ${p.id + 1}`}
            className="aspect-square rounded-[20px] transition-all duration-150 disabled:opacity-100"
            style={{
              background: p.color,
              opacity: lit === p.id ? 1 : 0.35,
              transform: lit === p.id ? "scale(0.96)" : "scale(1)",
            }}
          />
        ))}
      </div>
      <p className="text-sm font-bold text-ink-2">
        {phase === "showing" ? "Watch…" : `Your turn — ${sequence.length} step${sequence.length === 1 ? "" : "s"}`}
      </p>
    </>
  );
}
