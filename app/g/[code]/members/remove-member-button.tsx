"use client";

import { useState, useTransition } from "react";
import { removeMember } from "./actions";

export function RemoveMemberButton({
  groupId,
  userId,
  inviteCode,
  isSelf,
}: {
  groupId: string;
  userId: string;
  inviteCode: string;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button onClick={() => setConfirming(true)} className="min-h-11 px-2 text-sm font-bold text-ink-2">
        {isSelf ? "Leave" : "Remove"}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <button
        disabled={pending}
        onClick={() => startTransition(() => { removeMember(groupId, userId, inviteCode, isSelf); })}
        className="min-h-11 px-2 text-sm font-bold text-danger"
      >
        {isSelf ? "Yes, leave" : "Yes, remove"}
      </button>
      <button onClick={() => setConfirming(false)} className="min-h-11 px-2 text-sm font-bold text-ink-2">
        No
      </button>
    </span>
  );
}
