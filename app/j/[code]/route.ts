import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { setPendingInvite, consumePendingInvite } from "@/lib/invite";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const { origin } = new URL(request.url);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    await setPendingInvite(code);
    return NextResponse.redirect(`${origin}/join`);
  }

  await setPendingInvite(code);
  const joinedCode = await consumePendingInvite();
  return NextResponse.redirect(
    `${origin}${joinedCode ? `/g/${joinedCode}` : "/g/join?error=invalid"}`,
  );
}
