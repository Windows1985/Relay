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
        autoCapitalize="none"
        required
        className="input"
      />
      {state.error && <p className="text-sm font-bold text-danger">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        Continue
      </button>
    </form>
  );
}
