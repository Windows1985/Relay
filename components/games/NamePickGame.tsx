"use client";

import { useState } from "react";
import { useSubmitRound } from "./useSubmitRound";

export function NamePickGame({
  roundId,
  promptText,
  roster,
  currentUserId,
}: {
  roundId: string;
  promptText: string;
  roster: { id: string; username: string }[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  return (
    <div className="bezel flex w-full max-w-sm flex-col items-center gap-4 px-6 py-10 text-center">
      <div className="font-mono led-text text-lg font-bold uppercase tracking-widest">{promptText}</div>
      <div className="flex w-full flex-col gap-2">
        {roster
          .filter((m) => m.id !== currentUserId)
          .map((m) => (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`bezel-inset w-full py-3 font-medium ${
                selected === m.id ? "ring-2 ring-amber" : ""
              }`}
            >
              {m.username}
            </button>
          ))}
      </div>
      <button
        onClick={() => selected && submit({ target: selected })}
        disabled={submitting || !selected}
        className="btn-tactile w-full py-4 text-lg font-bold uppercase tracking-wide disabled:opacity-50"
      >
        Transmit
      </button>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
