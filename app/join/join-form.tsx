"use client";

import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp } from "./actions";

export function JoinForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, { error: null } as {
    error: string | null;
  });

  return (
    <div className="card flex w-full flex-col gap-5 p-6">
      <div className="text-center">
        <h1 className="font-display text-3xl font-bold tracking-tight">Relay</h1>
        <p className="mt-1 text-sm text-ink-2">
          {mode === "signup" ? "Pick a name your friends will recognise." : "Welcome back."}
        </p>
      </div>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Username"
          autoComplete="username"
          autoCapitalize="none"
          required
          className="input"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="input"
        />
        {state.error && <p className="text-sm font-bold text-danger">{state.error}</p>}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <div className="flex items-center gap-3 text-xs font-bold text-ink-2">
        <span className="h-px flex-1 bg-line" />
        or
        <span className="h-px flex-1 bg-line" />
      </div>

      <button onClick={() => signInWithGoogle()} className="btn-secondary w-full">
        Continue with Google
      </button>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="py-1 text-sm font-bold text-g3"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
