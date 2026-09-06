"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { createGroup } from "./actions";
import { ChevronLeftIcon } from "@/components/icons";

export default function NewGroupPage() {
  const [tz, setTz] = useState("");
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const [state, formAction, pending] = useActionState(createGroup, { error: null } as { error: string | null });

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href="/" className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Start a group</h1>
      </header>
      <form action={formAction} className="card flex flex-col gap-4 p-5">
        <input type="hidden" name="tz" value={tz} />
        <label className="flex flex-col gap-1.5 text-sm font-bold">
          Group name
          <input name="name" placeholder="The group chat's name works" required autoFocus className="input font-normal" />
        </label>
        <p className="text-xs text-ink-2">
          Games open nightly 7–10pm in your time zone{tz ? ` (${tz})` : ""}. You can change that later. You&apos;ll need three people for the first game.
        </p>
        {state.error && <p className="text-sm font-bold text-danger">{state.error}</p>}
        <button type="submit" disabled={pending || !tz} className="btn-primary w-full">
          Create group
        </button>
      </form>
    </main>
  );
}
