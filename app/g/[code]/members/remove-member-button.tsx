"use client";

import { useTransition } from "react";
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

  return (
    <button
      disabled={pending}
      onClick={() =>
        startTransition(() => {
          removeMember(groupId, userId, inviteCode, isSelf);
        })
      }
      className="text-sm text-danger underline disabled:opacity-50"
    >
      {isSelf ? "Leave" : "Remove"}
    </button>
  );
}
