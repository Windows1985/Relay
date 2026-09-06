"use client";

import { useActionState } from "react";
import { updateGroupSettings } from "./actions";

type Group = {
  id: string;
  name: string;
  invite_code: string;
  tz: string;
  window_start: string;
  window_end: string;
};

export function SettingsForm({ group }: { group: Group }) {
  const [state, formAction, pending] = useActionState(updateGroupSettings, {
    error: null,
    saved: false,
  } as { error: string | null; saved: boolean });

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="groupId" value={group.id} />
      <label className="flex flex-col gap-1 text-sm">
        Name
        <input
          name="name"
          defaultValue={group.name}
          required
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Time zone (IANA)
        <input
          name="tz"
          defaultValue={group.tz}
          required
          className="rounded border px-3 py-2"
        />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Opens
          <input
            type="time"
            name="windowStart"
            defaultValue={group.window_start.slice(0, 5)}
            required
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Closes
          <input
            type="time"
            name="windowEnd"
            defaultValue={group.window_end.slice(0, 5)}
            required
            className="rounded border px-3 py-2"
          />
        </label>
      </div>
      <p className="text-xs text-zinc-500">
        Changes apply from the next opening, never mid-round.
      </p>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      {state.saved && <p className="text-sm text-green-600">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
