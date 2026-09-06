import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const COOKIE = "pending_invite";

export async function setPendingInvite(code: string) {
  const store = await cookies();
  store.set(COOKIE, code.toUpperCase(), { maxAge: 600, path: "/" });
}

// Called after any successful sign-in/sign-up/OAuth-callback/username-pick.
// Joins whatever invite the user arrived through, if any, and returns the
// group's invite code to redirect into — or null if there was none.
export async function consumePendingInvite(): Promise<string | null> {
  const store = await cookies();
  const code = store.get(COOKIE)?.value;
  if (!code) return null;
  store.delete(COOKIE);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("join_group", { p_invite_code: code });
  if (error || !data) return null;
  return (data as { invite_code: string }).invite_code;
}
