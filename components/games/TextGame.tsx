"use client";

import { useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

export function TextGame({ roundId }: { roundId: string }) {
  const [text, setText] = useState("");
  const { submit, submitting, error } = useSubmitRound(roundId);

  return (
    <>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={280}
        rows={4}
        placeholder="Type it here…"
        className="input min-h-32 resize-none py-3 text-base"
      />
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-bold text-ink-2">{280 - text.length} left</span>
        <button onClick={() => submit({ text })} disabled={submitting || text.trim().length === 0} className="btn-primary px-8">
          {submitting ? "Posting…" : "Post it"}
        </button>
      </div>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
