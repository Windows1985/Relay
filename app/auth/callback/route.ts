import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumePendingInvite } from "@/lib/invite";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
  }

  // Join now so the invite is consumed even if proxy.ts sends this user to
  // /pick-username next (no username yet); that flow's own redirect just
  // lands on "/" in that case — group membership doesn't wait on a username.
  const joinedCode = await consumePendingInvite();
  return NextResponse.redirect(`${origin}${joinedCode ? `/g/${joinedCode}` : "/"}`);
}
