"use client";

import { useActionState } from "react";
import { pickUsername } from "./actions";

export function PickUsernameForm() {
  const [state, formAction, pending] = useActionState(pickUsername, {
    error: null,
  } as { error: string | null });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input
        name="username"
        placeholder="Username"
        autoComplete="username"
        required
        className="input-bezel px-3 py-2"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-tactile py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
      >
        Continue
      </button>
    </form>
  );
}
