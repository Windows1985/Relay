"use client";

import { useState } from "react";

export function ShareReminder({
  groupName,
  hoursLeft,
  notPlayed,
}: {
  groupName: string;
  hoursLeft: number;
  notPlayed: number;
}) {
  const [copied, setCopied] = useState(false);
  if (notPlayed <= 0) return null;

  const text = `${groupName}: ${hoursLeft} hour${hoursLeft === 1 ? "" : "s"} left, ${notPlayed} of you ${
    notPlayed === 1 ? "hasn't" : "haven't"
  } played`;

  async function send() {
    if (navigator.share) {
      try {
        await navigator.share({ text });
        return;
      } catch {
        // user cancelled the share sheet — fall through to clipboard
      }
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={send} className="btn-ghost w-full py-2 text-xs uppercase tracking-wide">
      {copied ? "Copied" : "Nudge the group chat"}
    </button>
  );
}
