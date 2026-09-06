"use client";

import { useState } from "react";
import { CheckIcon } from "@/components/icons";
import { useSubmitRound } from "./useSubmitRound";

export function NamePickGame({
  roundId,
  roster,
  currentUserId,
}: {
  roundId: string;
  roster: { id: string; username: string }[];
  currentUserId: string;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const { submit, submitting, error } = useSubmitRound(roundId);

  return (
    <>
      <div className="flex w-full flex-col gap-2">
        {roster
          .filter((m) => m.id !== currentUserId)
          .map((m) => {
            const active = selected === m.id;
            return (
              <button
                key={m.id}
                onClick={() => setSelected(m.id)}
                aria-pressed={active}
                className="flex min-h-14 w-full items-center gap-3 rounded-2xl border-[1.5px] px-4 text-left font-bold transition-colors"
                style={{
                  borderColor: active ? "var(--g3)" : "var(--line)",
                  background: active ? "rgba(193, 53, 132, 0.08)" : "var(--paper)",
                }}
              >
                <span className="avatar">{m.username.slice(0, 1).toUpperCase()}</span>
                <span className="flex-1">{m.username}</span>
                {active && <CheckIcon size={20} className="text-g3" />}
              </button>
            );
          })}
      </div>
      <button onClick={() => selected && submit({ target: selected })} disabled={submitting || !selected} className="btn-primary w-full">
        {submitting ? "Posting…" : selected ? "Lock it in" : "Pick someone"}
      </button>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
