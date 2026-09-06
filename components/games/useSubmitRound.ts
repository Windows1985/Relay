"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// Shared by every game component: call submit_round, then send the player
// back to the channel tile (which now reads as "transmitted").
export function useSubmitRound(roundId: string) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(payload: Record<string, unknown>, photoPath?: string) {
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("submit_round", {
      p_round_id: roundId,
      p_payload: payload,
      p_photo_path: photoPath ?? null,
    });
    if (rpcError) {
      setError(rpcError.message);
      setSubmitting(false);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return { submit, submitting, error };
}
