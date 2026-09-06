"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateGroupSettings(_prevState: unknown, formData: FormData) {
  const groupId = String(formData.get("groupId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const tz = String(formData.get("tz") ?? "").trim();
  const windowStart = String(formData.get("windowStart") ?? "");
  const windowEnd = String(formData.get("windowEnd") ?? "");

  if (!name || !tz || !windowStart || !windowEnd) {
    return { error: "All fields are required.", saved: false };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("groups")
    .update({ name, tz, window_start: windowStart, window_end: windowEnd })
    .eq("id", groupId);

  if (error) return { error: error.message, saved: false };
  return { error: null, saved: true };
}
