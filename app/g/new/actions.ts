"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createGroup(_prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const tz = String(formData.get("tz") ?? "").trim();
  if (!name) return { error: "Name your group." };
  if (!tz) return { error: "Could not detect your time zone — try again." };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_group", { p_name: name, p_tz: tz });
  if (error) return { error: error.message };

  redirect(`/g/${(data as { invite_code: string }).invite_code}`);
}
