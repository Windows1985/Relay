"use client";

import { useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

export function TextGame({ roundId, promptText }: { roundId: string; promptText: string }) {
  const [text, setText] = useState("");
  const { submit, submitting, error } = useSubmitRound(roundId);

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="font-mono led-text text-lg font-bold uppercase tracking-widest">{promptText}</div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        rows={4}
        placeholder="Type your answer..."
        className="bezel-inset w-full resize-none p-3 text-ink placeholder:text-ink-dim"
      />
      <button
        onClick={() => submit({ text })}
        disabled={submitting || text.trim().length === 0}
        className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide disabled:opacity-50"
      >
        Transmit
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
