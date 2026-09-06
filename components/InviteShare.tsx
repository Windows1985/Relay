"use client";

import { useState } from "react";
import { ShareIcon } from "@/components/icons";

export function InviteShare({ code, groupName }: { code: string; groupName: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/j/${code}`;
    const text = `Join "${groupName}" on Relay — one game a night: ${url}`;
    if (navigator.share) {
      try {
        await navigator.share({ text, url });
        return;
      } catch {
        // cancelled — fall through
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={share} className="btn-primary w-full">
      <ShareIcon size={18} />
      {copied ? "Link copied" : "Invite friends"}
    </button>
  );
}
