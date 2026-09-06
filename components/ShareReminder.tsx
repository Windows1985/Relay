"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

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
  if (notPlayed <= 0) {
    return (
      <button disabled className="btn-secondary w-full">
        Everyone&apos;s in — reveal is coming
      </button>
    );
  }

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
    <button onClick={send} className="btn-secondary w-full">
      <ShareIcon size={18} />
      {copied ? "Copied to clipboard" : `Nudge the ${notPlayed} who haven't played`}
    </button>
  );
}
