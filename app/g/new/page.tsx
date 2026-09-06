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
      <form action={formAction} className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-center text-2xl font-semibold">Start a group</h1>
        <input type="hidden" name="tz" value={tz} />
        <input
          name="name"
          placeholder="Group name"
          required
          className="rounded border px-3 py-2"
        />
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <button
          type="submit"
          disabled={pending || !tz}
          className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
        >
          Create
        </button>
      </form>
    </main>
  );
}
