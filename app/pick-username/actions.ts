"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateUsername } from "@/lib/username";
import { consumePendingInvite } from "@/lib/invite";

export async function pickUsername(_prevState: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", user.id);

  if (error) {
    return { error: error.code === "23505" ? "That username is taken." : error.message };
  }

  const joinedCode = await consumePendingInvite();
  redirect(joinedCode ? `/g/${joinedCode}` : "/");
}
