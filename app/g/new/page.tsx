"use client";

import { useActionState, useEffect, useState } from "react";
import { createGroup } from "./actions";

export default function NewGroupPage() {
  const [tz, setTz] = useState("");
  useEffect(() => {
    setTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  const [state, formAction, pending] = useActionState(createGroup, {
    error: null,
  } as { error: string | null });

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <form action={formAction} className="bezel flex w-full max-w-sm flex-col gap-3 px-6 py-10">
        <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
          Start a group
        </h1>
        <input type="hidden" name="tz" value={tz} />
        <input
          name="name"
          placeholder="Group name"
          required
          className="input-bezel px-3 py-2"
        />
        {state.error && <p className="text-sm text-danger">{state.error}</p>}
        <button
          type="submit"
          disabled={pending || !tz}
          className="btn-tactile py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </main>
  );
}
