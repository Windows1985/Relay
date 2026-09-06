"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
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
  // Derived from the incoming request rather than an env var: this works on
  // any deployment URL, and a missing NEXT_PUBLIC_APP_URL used to send
  // Supabase "undefined/auth/callback", which it rejects as a validation
  // failure.
  const h = await headers();
  const origin = h.get("origin") ?? `https://${h.get("host")}`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/auth/callback` },
  });

  if (error || !data.url) {
    // The provider being switched off in the Supabase dashboard is the
    // common case; say that in words a player can act on.
    const message = /provider is not enabled|unsupported provider/i.test(error?.message ?? "")
      ? "Google sign-in isn't set up yet. Use a username and password for now."
      : (error?.message ?? "Could not start Google sign-in.");
    return { error: message };
  }
  redirect(data.url);
}
