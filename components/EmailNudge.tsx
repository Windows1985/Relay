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
      <div className="bezel-inset w-full max-w-sm px-4 py-3 text-center text-sm text-ok">
        Check your inbox to confirm.
      </div>
    );
  }

  return (
    <form action={formAction} className="bezel-inset flex w-full max-w-sm flex-col gap-2 px-4 py-3">
      <p className="text-xs text-ink-dim">
        Your streak is worth protecting. Add an email so you can recover your account.
      </p>
      <div className="flex gap-2">
        <input
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          className="input-bezel flex-1 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="btn-tactile px-4 py-2 text-xs font-bold uppercase tracking-wide disabled:opacity-50"
        >
          Save
        </button>
      </div>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
    </form>
  );
}
