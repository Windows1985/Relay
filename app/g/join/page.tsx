"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { joinByCode } from "./actions";

function JoinGroupForm() {
  const params = useSearchParams();
  const invalid = params.get("error") === "invalid";

  const [state, formAction, pending] = useActionState(joinByCode, {
    error: invalid ? "That invite code doesn't match a group." : null,
  } as { error: string | null });

  return (
    <form action={formAction} className="bezel flex w-full max-w-sm flex-col gap-3 px-6 py-10">
      <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
        Join a group
      </h1>
      <input
        name="code"
        placeholder="6-character code"
        required
        maxLength={6}
        className="input-bezel px-3 py-2 uppercase"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-tactile py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
      >
        Join
      </button>
    </form>
  );
}

export default function JoinGroupPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Suspense>
        <JoinGroupForm />
      </Suspense>
    </main>
  );
}
