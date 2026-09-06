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
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="groupId" value={group.id} />
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Group name
        <input name="name" defaultValue={group.name} required className="input font-normal" />
      </label>
      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-bold">
          Opens
          <input type="time" name="windowStart" defaultValue={group.window_start.slice(0, 5)} required className="input font-normal" />
        </label>
        <label className="flex flex-1 flex-col gap-1.5 text-sm font-bold">
          Closes
          <input type="time" name="windowEnd" defaultValue={group.window_end.slice(0, 5)} required className="input font-normal" />
        </label>
      </div>
      <label className="flex flex-col gap-1.5 text-sm font-bold">
        Time zone
        <input name="tz" defaultValue={group.tz} required className="input font-normal" />
        <span className="text-xs font-normal text-ink-2">Everyone plays on this clock, wherever they are. Set from the creator&apos;s phone.</span>
      </label>
      <p className="text-xs text-ink-2">Changes apply from the next opening, never mid-round.</p>
      {state.error && <p className="text-sm font-bold text-danger">{state.error}</p>}
      {state.saved && <p className="text-sm font-bold text-ok">Saved.</p>}
      <button type="submit" disabled={pending} className="btn-primary w-full">
        Save
      </button>
    </form>
  );
}
