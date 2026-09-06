"use client";

import { Suspense, useActionState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { joinByCode } from "./actions";
import { ChevronLeftIcon } from "@/components/icons";

function JoinGroupForm() {
  const params = useSearchParams();
  const invalid = params.get("error") === "invalid";

  const [state, formAction, pending] = useActionState(joinByCode, {
    error: invalid ? "That code doesn't match a group. Check it and try again." : null,
  } as { error: string | null });

  return (
    <form action={formAction} className="card flex flex-col gap-4 p-5">
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Invite code
        <input
          name="code"
          placeholder="ABC123"
          required
          maxLength={6}
          autoFocus
          autoCapitalize="characters"
          className="input num text-center text-2xl uppercase tracking-[0.3em]"
        />
      </label>
      <p className="text-xs text-ink-2">Six characters, from whoever started the group. Or just tap their invite link.</p>
      {state.error && <p className="text-sm font-bold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        Join
      </button>
    </form>
  );
}

export default function JoinGroupPage() {
  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href="/" className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Join a group</h1>
      </header>
      <Suspense>
        <JoinGroupForm />
      </Suspense>
    </main>
  );
}
