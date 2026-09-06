"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function joinByCode(_prevState: unknown, formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { error: "Enter a code." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group", { p_invite_code: code });
  if (error) return { error: "That invite code doesn't match a group." };

  redirect(`/g/${(data as { invite_code: string }).invite_code}`);
}
