"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function FreezeBuyButton({ groupId, canAfford }: { groupId: string; canAfford: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function buy() {
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase.rpc("buy_freeze", { p_group_id: groupId });
      if (!error) router.refresh();
    });
  }

  return (
    <button
      onClick={buy}
      disabled={pending || !canAfford}
      className="btn-ghost w-full py-2 text-xs uppercase tracking-wide disabled:opacity-40"
    >
      {canAfford ? "Buy freeze — 40 tokens" : "Need 40 tokens"}
    </button>
  );
}
