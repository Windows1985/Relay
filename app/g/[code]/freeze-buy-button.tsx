"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FreezeBuyButton({ groupId, canAfford }: { groupId: string; canAfford: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function buy() {
    setError(null);
    startTransition(async () => {
      const supabase = createClient();
      const { error: err } = await supabase.rpc("buy_freeze", { p_group_id: groupId });
      if (err) return setError(err.message);
      router.refresh();
    });
  }

  return (
    <>
      <button onClick={buy} disabled={pending || !canAfford} className="btn-secondary w-full">
        {canAfford ? "Bank a freeze — 40 tokens" : "Need 40 tokens for a freeze"}
      </button>
      {error && <p className="text-sm font-bold text-danger">{error}</p>}
    </>
  );
}
