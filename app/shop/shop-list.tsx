"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Name } from "@/components/Name";
import { ANIM_CLASS, type CosmeticCss } from "@/lib/cosmetics";

type Cosmetic = {
  id: string;
  kind: "colour" | "anim";
  price: number | null;
  streak_gate: number | null;
  css: CosmeticCss;
};

export function ShopList({
  cosmetics,
  ownedIds,
  equippedColour,
  equippedAnim,
  username,
  balance,
}: {
  cosmetics: Cosmetic[];
  ownedIds: string[];
  equippedColour: string | null;
  equippedAnim: string | null;
  username: string;
  balance: number;
}) {
  const router = useRouter();
  const [owned, setOwned] = useState(new Set(ownedIds));
  const [equipped, setEquipped] = useState({ colour: equippedColour, anim: equippedAnim });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function buy(cosmetic: Cosmetic) {
    setBusyId(cosmetic.id);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.rpc("buy_cosmetic", { p_cosmetic_id: cosmetic.id });
      setBusyId(null);
      if (err) return setError(err.message);
      setOwned((prev) => new Set(prev).add(cosmetic.id));
      router.refresh();
    });
  }

  function equip(cosmetic: Cosmetic) {
    setBusyId(cosmetic.id);
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.rpc("equip_cosmetic", { p_cosmetic_id: cosmetic.id });
      setBusyId(null);
      if (err) return setError(err.message);
      setEquipped((prev) => ({ ...prev, [cosmetic.kind === "colour" ? "colour" : "anim"]: cosmetic.id }));
    });
  }

  const preview = (
    <div className="bezel-inset px-4 py-3 text-center">
      <Name
        username={username}
        colourCss={equipped.colour ? cosmetics.find((c) => c.id === equipped.colour)?.css ?? null : null}
        animClass={null}
      />
    </div>
  );

  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      {preview}
      {error && <p className="text-center text-sm text-danger">{error}</p>}

      {(["colour", "anim"] as const).map((kind) => (
        <div key={kind} className="flex flex-col gap-2">
          <h2 className="text-xs uppercase tracking-widest text-ink-dim">
            {kind === "colour" ? "Name colours" : "Entry animations"}
          </h2>
          {cosmetics
            .filter((c) => c.kind === kind)
            .map((c) => {
              const isOwned = owned.has(c.id);
              const isEquipped = kind === "colour" ? equipped.colour === c.id : equipped.anim === c.id;
              const gated = c.streak_gate !== null;
              return (
                <div key={c.id} className="bezel-inset flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    {kind === "colour" ? (
                      <Name username={c.id.replace(/^colour_/, "").replace(/_/g, " ")} colourCss={c.css} animClass={null} />
                    ) : (
                      <span className={ANIM_CLASS[c.id] ?? ""}>{c.id.replace(/^anim_/, "").replace(/_/g, " ")}</span>
                    )}
                    {gated && <span className="text-xs text-ink-dim">{c.streak_gate}-day streak</span>}
                  </div>

                  {isEquipped ? (
                    <span className="text-xs text-ok uppercase">Equipped</span>
                  ) : isOwned ? (
                    <button
                      onClick={() => equip(c)}
                      disabled={pending && busyId === c.id}
                      className="btn-ghost px-3 py-1 text-xs uppercase disabled:opacity-50"
                    >
                      Equip
                    </button>
                  ) : gated ? (
                    <span className="text-xs text-ink-dim">Earned, not bought</span>
                  ) : (
                    <button
                      onClick={() => buy(c)}
                      disabled={(pending && busyId === c.id) || balance < (c.price ?? 0)}
                      className="btn-tactile px-3 py-1 text-xs font-bold uppercase disabled:opacity-40"
                    >
                      {c.price} tokens
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      ))}
    </div>
  );
}
