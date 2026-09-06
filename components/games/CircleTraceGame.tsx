"use client";

import { useRef, useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 108;
const BINS = 36; // 10° each — used to check you actually went all the way round

type Point = { x: number; y: number };

// Scores a finger-traced circle out of 100: how close every point sat to the
// guide ring, multiplied by how much of the ring you actually covered (so a
// perfect little arc can't beat a full lap).
function scoreTrace(points: Point[]): { score: number; coverage: number } {
  if (points.length < 12) return { score: 0, coverage: 0 };

  const covered = new Set<number>();
  let errorSum = 0;

  for (const p of points) {
    const dx = p.x - CENTER;
    const dy = p.y - CENTER;
    const dist = Math.sqrt(dx * dx + dy * dy);
    errorSum += Math.abs(dist - RADIUS) / RADIUS;
    const angle = Math.atan2(dy, dx) + Math.PI; // 0..2π
    covered.add(Math.min(BINS - 1, Math.floor((angle / (Math.PI * 2)) * BINS)));
  }

  const meanError = errorSum / points.length;
  const coverage = covered.size / BINS;
  const accuracy = Math.max(0, 1 - meanError * 2.5);
  return { score: Math.round(accuracy * coverage * 100), coverage };
}

export function CircleTraceGame({ roundId }: { roundId: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const points = useRef<Point[]>([]);
  const drawing = useRef(false);
  const [result, setResult] = useState<{ score: number; coverage: number } | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  function ctx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function paintGuide() {
    const c = ctx();
    if (!c) return;
    c.clearRect(0, 0, SIZE, SIZE);
    c.setLineDash([6, 8]);
    c.lineWidth = 2;
    c.strokeStyle = "#ebe7e2";
    c.beginPath();
    c.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
    c.stroke();
    c.setLineDash([]);
  }

  function pointFrom(e: React.PointerEvent<HTMLCanvasElement>): Point {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * SIZE,
      y: ((e.clientY - rect.top) / rect.height) * SIZE,
    };
  }

  function onDown(e: React.PointerEvent<HTMLCanvasElement>) {
    if (result) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    points.current = [pointFrom(e)];
    paintGuide();
  }

  function onMove(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || result) return;
    const p = pointFrom(e);
    const prev = points.current[points.current.length - 1];
    points.current.push(p);

    const c = ctx();
    if (!c || !prev) return;
    c.lineWidth = 5;
    c.lineCap = "round";
    c.strokeStyle = "#c13584";
    c.beginPath();
    c.moveTo(prev.x, prev.y);
    c.lineTo(p.x, p.y);
    c.stroke();
  }

  function onUp() {
    if (!drawing.current || result) return;
    drawing.current = false;
    const scored = scoreTrace(points.current);
    if (scored.coverage < 0.5) {
      points.current = [];
      paintGuide();
      setResult(null);
      return;
    }
    setResult(scored);
    submit({ value: scored.score });
  }

  return (
    <>
      <canvas
        ref={(el) => {
          canvasRef.current = el;
          if (el && points.current.length === 0) paintGuide();
        }}
        width={SIZE}
        height={SIZE}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        className="w-full max-w-[280px] touch-none rounded-[20px] bg-paper-warm"
        aria-label="Trace the circle"
      />

      {result ? (
        <>
          <div className="ring">
            <div className="ring-inner h-28 w-28">
              <span className="num text-4xl font-semibold">{result.score}</span>
              <span className="text-xs font-bold text-ink-2">out of 100</span>
            </div>
          </div>
          <p className="text-sm font-bold text-ink-2">{submitting ? "Posting…" : "Done!"}</p>
        </>
      ) : (
        <p className="text-sm font-bold text-ink-2">
          Trace the dashed ring in one go — all the way around, without lifting your finger.
        </p>
      )}
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
