"use client";

import { useActionState } from "react";
import { setRecoveryEmail } from "@/app/me/actions";

export function EmailNudge() {
  const [state, formAction, pending] = useActionState(setRecoveryEmail, {
    error: null,
    done: false,
  } as { error: string | null; done: boolean });

  if (state.done) {
    return (
      <div className="card w-full px-5 py-4 text-center text-sm font-bold text-ok">
        Check your inbox to confirm your email.
      </div>
    );
  }

  return (
    <form action={formAction} className="card flex w-full flex-col gap-3 p-5">
      <div>
        <h3 className="font-display text-lg font-semibold">Protect your streak</h3>
        <p className="text-sm text-ink-2">Add an email so you can get back in if you forget your password.</p>
      </div>
      <input name="email" type="email" placeholder="you@example.com" required className="input" />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        Save email
      </button>
    </form>
  );
}
