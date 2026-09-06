"use client";

import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp } from "./actions";

export function JoinForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState(action, { error: null } as {
    error: string | null;
  });

  return (
    <div className="bezel flex w-full max-w-sm flex-col gap-6 px-6 py-10">
      <h1 className="text-center font-mono led-text text-2xl font-bold uppercase tracking-widest">
        Relay
      </h1>

      <form action={formAction} className="flex flex-col gap-3">
        <input
          name="username"
          placeholder="Username"
          autoComplete="username"
          required
          className="input-bezel px-3 py-2"
        />
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          required
          minLength={8}
          className="input-bezel px-3 py-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="btn-tactile py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        >
          {mode === "signin" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button onClick={() => signInWithGoogle()} className="btn-ghost py-3 text-sm font-medium">
        Continue with Google
      </button>

      <button
        onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-ink-dim underline"
      >
        {mode === "signin" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
