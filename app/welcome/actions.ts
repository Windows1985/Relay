"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function finishOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
  redirect("/");
}
