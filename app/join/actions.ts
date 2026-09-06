"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail, validateUsername } from "@/lib/username";
import { consumePendingInvite } from "@/lib/invite";

export async function signUp(_prevState: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const usernameError = validateUsername(username);
  if (usernameError) return { error: usernameError };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: usernameToEmail(username),
    password,
    options: { data: { username } },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already registered")) {
      return { error: "That username is taken." };
    }
    return { error: error.message };
  }

  const joinedCode = await consumePendingInvite();
  redirect(joinedCode ? `/g/${joinedCode}` : "/");
}

export async function signIn(_prevState: unknown, formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(username),
    password,
  });

  if (error) return { error: "Wrong username or password." };

  const joinedCode = await consumePendingInvite();
  redirect(joinedCode ? `/g/${joinedCode}` : "/");
}

export async function signInWithGoogle() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback` },
  });

  if (error || !data.url) return { error: error?.message ?? "Could not start Google sign-in." };
  redirect(data.url);
}
