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
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
      <h1 className="text-center text-2xl font-semibold">Join a group</h1>
      <input
        name="code"
        placeholder="6-character code"
        required
        maxLength={6}
        className="rounded border px-3 py-2 uppercase"
      />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
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
