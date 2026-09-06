"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Name } from "@/components/Name";
import { ANIM_CLASS, type CosmeticCss } from "@/lib/cosmetics";
import { CheckIcon, FlameIcon } from "@/components/icons";

type Cosmetic = {
  id: string;
  kind: "colour" | "anim";
  price: number | null;
  streak_gate: number | null;
  css: CosmeticCss;
};

function label(c: Cosmetic) {
  return c.id.replace(/^(colour|anim)_/, "").replace(/_/g, " ");
}

export function ShopList({
  cosmetics,
  ownedIds,
  equippedColour,
  equippedAnim,
  username,
  balance,
  isAdmin,
}: {
  cosmetics: Cosmetic[];
  ownedIds: string[];
  equippedColour: string | null;
  equippedAnim: string | null;
  username: string;
  balance: number;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [owned, setOwned] = useState(new Set(ownedIds));
  const [equipped, setEquipped] = useState({ colour: equippedColour, anim: equippedAnim });
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);

  // Optimistic: apply the change locally on tap, roll it back if the RPC
  // rejects. Waiting on the server made every shop tap feel broken.
  function run(id: string, rpc: string, args: Record<string, unknown>, apply: () => void, revert: () => void) {
    setBusyId(id);
    setError(null);
    apply();
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.rpc(rpc, args);
      setBusyId(null);
      if (err) {
        revert();
        return setError(err.message);
      }
      router.refresh();
    });
  }

  function withoutId(id: string) {
    return (prev: Set<string>) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    };
  }

  const buy = (c: Cosmetic) =>
    run(c.id, "buy_cosmetic", { p_cosmetic_id: c.id }, () => setOwned((p) => new Set(p).add(c.id)), () => setOwned(withoutId(c.id)));
  const grant = (c: Cosmetic) =>
    run(c.id, "admin_grant_cosmetic", { p_cosmetic_id: c.id }, () => setOwned((p) => new Set(p).add(c.id)), () => setOwned(withoutId(c.id)));
  const equip = (c: Cosmetic) => {
    const previous = equipped[c.kind];
    run(
      c.id,
      "equip_cosmetic",
      { p_cosmetic_id: c.id },
      () => {
        setEquipped((p) => ({ ...p, [c.kind]: c.id }));
        setAnimKey((k) => k + 1);
      },
      () => setEquipped((p) => ({ ...p, [c.kind]: previous })),
    );
  };

  const previewCss = equipped.colour ? cosmetics.find((c) => c.id === equipped.colour)?.css ?? null : null;
  const previewAnim = equipped.anim ? ANIM_CLASS[equipped.anim] ?? null : null;

  return (
    <div className="flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-2 p-5 text-center">
        <p className="text-xs font-bold uppercase tracking-wide text-ink-2">How your name looks</p>
        <div key={animKey} className="font-display text-3xl font-semibold">
          <Name username={username} colourCss={previewCss} animClass={previewAnim} />
        </div>
        <p className="text-xs text-ink-2">Shows up everywhere your name does — every group, every reveal.</p>
      </section>

      {error && <p className="text-center text-sm font-bold text-danger">{error}</p>}

      {(["colour", "anim"] as const).map((kind) => (
        <section key={kind} className="flex flex-col gap-3">
          <h2 className="px-1 font-display text-lg font-semibold">{kind === "colour" ? "Name colours" : "Entrance moves"}</h2>
          <div className="grid grid-cols-2 gap-3">
            {cosmetics
              .filter((c) => c.kind === kind)
              .map((c) => {
                const isOwned = owned.has(c.id);
                const isEquipped = equipped[kind] === c.id;
                const gated = c.streak_gate !== null;
                const canAfford = balance >= (c.price ?? 0);
                return (
                  <div key={c.id} className="card flex flex-col items-center gap-3 p-4 text-center">
                    <div className="flex h-12 items-center justify-center font-display text-lg font-semibold">
                      {kind === "colour" ? (
                        <Name username={username} colourCss={c.css} animClass={null} />
                      ) : (
                        <span className={ANIM_CLASS[c.id] ?? ""}>{username}</span>
                      )}
                    </div>
                    <p className="text-xs font-bold capitalize text-ink-2">{label(c)}</p>

                    {isEquipped ? (
                      <span className="chip text-ok">
                        <CheckIcon size={14} /> Wearing
                      </span>
                    ) : isOwned ? (
                      <button onClick={() => equip(c)} disabled={busyId === c.id} className="btn-secondary min-h-10 w-full text-sm">
                        Wear it
                      </button>
                    ) : gated ? (
                      <span className="chip">
                        <FlameIcon size={12} /> {c.streak_gate}-day streak
                      </span>
                    ) : (
                      <button onClick={() => buy(c)} disabled={busyId === c.id || !canAfford} className="btn-primary min-h-10 w-full text-sm">
                        {c.price} tokens
                      </button>
                    )}

                    {isAdmin && !isOwned && (
                      <button onClick={() => grant(c)} disabled={busyId === c.id} className="text-xs font-bold text-g3">
                        Free (admin)
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </section>
      ))}
    </div>
  );
}
