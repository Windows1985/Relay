"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { modeCopy } from "@/lib/modes";
import { BoltIcon, CheckIcon, SparkIcon } from "@/components/icons";

type Group = { id: string; name: string; invite_code: string; tz: string };
type Mode = { id: string; input_type: string; scoring: string; needs_vote: boolean; active: boolean };
type Round = { id: string; mode_id: string; reveal_at: string | null; votes_close_at: string | null; settled_at: string | null; local_date: string } | null;

function roundState(r: NonNullable<Round>) {
  if (r.settled_at) return "settled";
  if (r.reveal_at) return "revealed — voting";
  return "live";
}

export function AdminPanel({
  groups,
  modes,
  latestRounds,
  cosmeticIds,
  ownedCount,
}: {
  groups: Group[];
  modes: Mode[];
  latestRounds: Record<string, Round>;
  cosmeticIds: string[];
  ownedCount: number;
}) {
  const router = useRouter();
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [modeId, setModeId] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const group = groups.find((g) => g.id === groupId);
  const latest = groupId ? latestRounds[groupId] : null;
  const todayLocal = group ? new Date().toLocaleDateString("en-CA", { timeZone: group.tz }) : "";
  const roundToday = latest && latest.local_date === todayLocal ? latest : null;

  function openRound(replace: boolean) {
    if (!groupId || !modeId) return;
    setMsg(null);
    startTransition(async () => {
      const supabase = createClient();
      const { data, error } = await supabase.rpc("admin_open_round", { p_group_id: groupId, p_mode_id: modeId, p_replace: replace });
      if (error) {
        if (error.message.includes("ROUND_EXISTS")) {
          setConfirmReplace(true);
          return;
        }
        return setMsg({ kind: "err", text: error.message });
      }
      setConfirmReplace(false);
      setMsg({ kind: "ok", text: `${modeCopy(modeId).title} is live in ${group?.name}.` });
      router.refresh();
      router.push(`/play/${data}`);
    });
  }

  function advance(roundId: string) {
    setMsg(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("admin_advance_round", { p_round_id: roundId });
      if (error) return setMsg({ kind: "err", text: error.message });
      setMsg({ kind: "ok", text: "Round advanced." });
      router.refresh();
    });
  }

  function grantAll() {
    setMsg(null);
    startTransition(async () => {
      const supabase = createClient();
      for (const id of cosmeticIds) {
        const { error } = await supabase.rpc("admin_grant_cosmetic", { p_cosmetic_id: id });
        if (error) return setMsg({ kind: "err", text: error.message });
      }
      setMsg({ kind: "ok", text: "You own every cosmetic. Wear them from the Shop." });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {msg && (
        <p className={`card px-4 py-3 text-sm font-bold ${msg.kind === "ok" ? "text-ok" : "text-danger"}`}>{msg.text}</p>
      )}

      <section className="card flex flex-col gap-4 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Open a game now</h2>
          <p className="text-sm text-ink-2">Ignores the nightly window and player minimums. Everyone in the group gets it.</p>
        </div>

        {groups.length > 1 && (
          <label className="flex flex-col gap-1.5 text-sm font-bold">
            Group
            <select value={groupId} onChange={(e) => setGroupId(e.target.value)} className="input font-normal">
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </label>
        )}
        {groups.length === 0 && <p className="text-sm font-bold text-danger">Join a group first.</p>}

        <div className="grid grid-cols-2 gap-2">
          {modes.map((m) => {
            const active = modeId === m.id;
            return (
              <button
                key={m.id}
                onClick={() => { setModeId(m.id); setConfirmReplace(false); }}
                aria-pressed={active}
                className="flex min-h-14 flex-col items-start justify-center rounded-2xl border-[1.5px] px-3 py-2 text-left"
                style={{
                  borderColor: active ? "var(--g3)" : "var(--line)",
                  background: active ? "rgba(193, 53, 132, 0.08)" : "var(--paper)",
                  opacity: m.active ? 1 : 0.6,
                }}
              >
                <span className="font-bold leading-tight">{modeCopy(m.id).title}</span>
                <span className="text-[11px] font-bold text-ink-2">
                  {m.input_type}{m.needs_vote ? " · vote" : ""}{!m.active ? " · off" : ""}
                </span>
              </button>
            );
          })}
        </div>

        {confirmReplace ? (
          <div className="flex flex-col gap-2 rounded-2xl bg-paper-warm p-4">
            <p className="text-sm font-bold">Tonight&apos;s round already exists for {group?.name}. Replace it? Everyone&apos;s submissions for it are deleted.</p>
            <div className="flex gap-2">
              <button onClick={() => openRound(true)} disabled={pending} className="btn-primary flex-1">Replace it</button>
              <button onClick={() => setConfirmReplace(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => openRound(false)} disabled={pending || !groupId || !modeId} className="btn-primary w-full">
            <BoltIcon size={18} />
            {modeId ? `Open ${modeCopy(modeId).title}` : "Pick a game"}
          </button>
        )}
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Tonight&apos;s round</h2>
          <p className="text-sm text-ink-2">{group?.name ?? "—"}</p>
        </div>
        {roundToday ? (
          <>
            <div className="flex items-center justify-between">
              <span className="font-bold">{modeCopy(roundToday.mode_id).title}</span>
              <span className="chip">{roundState(roundToday)}</span>
            </div>
            <div className="flex gap-2">
              {!roundToday.settled_at && (
                <button onClick={() => advance(roundToday.id)} disabled={pending} className="btn-primary flex-1">
                  {roundToday.reveal_at ? "Close voting & settle" : "Reveal now"}
                </button>
              )}
              <Link href={roundToday.reveal_at ? `/reveal/${roundToday.id}` : `/play/${roundToday.id}`} className="btn-secondary flex-1">
                {roundToday.reveal_at ? "See reveal" : "Play it"}
              </Link>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-2">No round open today in this group.</p>
        )}
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-semibold">Shop</h2>
          <p className="text-sm text-ink-2">You own {ownedCount} of {cosmeticIds.length} cosmetics. The Shop also shows a &quot;Free (admin)&quot; option on each.</p>
        </div>
        <button onClick={grantAll} disabled={pending || ownedCount >= cosmeticIds.length} className="btn-secondary w-full">
          {ownedCount >= cosmeticIds.length ? <><CheckIcon size={18} /> You own everything</> : <><SparkIcon size={18} /> Own every cosmetic</>}
        </button>
      </section>
    </div>
  );
}
