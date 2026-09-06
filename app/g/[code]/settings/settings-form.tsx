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
      <label className="flex flex-col gap-1 text-sm text-ink-dim">
        Name
        <input name="name" defaultValue={group.name} required className="input-bezel px-3 py-2" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-ink-dim">
        Time zone (IANA)
        <input name="tz" defaultValue={group.tz} required className="input-bezel px-3 py-2" />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1 text-sm text-ink-dim">
          Opens
          <input
            type="time"
            name="windowStart"
            defaultValue={group.window_start.slice(0, 5)}
            required
            className="input-bezel px-3 py-2"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1 text-sm text-ink-dim">
          Closes
          <input
            type="time"
            name="windowEnd"
            defaultValue={group.window_end.slice(0, 5)}
            required
            className="input-bezel px-3 py-2"
          />
        </label>
      </div>
      <p className="text-xs text-ink-dim">Changes apply from the next opening, never mid-round.</p>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      {state.saved && <p className="text-sm text-ok">Saved.</p>}
      <button
        type="submit"
        disabled={pending}
        className="btn-tactile py-3 text-sm font-bold uppercase tracking-wide disabled:opacity-50"
      >
        Save
      </button>
    </form>
  );
}
