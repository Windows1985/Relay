import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidWebhookRequest } from "@/lib/webhook-auth";
import { sendPushToUsers } from "@/lib/push";

export async function POST(request: Request) {
  if (!isValidWebhookRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { round_id } = (await request.json()) as { round_id: string };
  const admin = createAdminClient();
  const { data: round } = await admin.from("rounds").select("roster").eq("id", round_id).single();
  if (!round) return NextResponse.json({ error: "Round not found" }, { status: 404 });

  await sendPushToUsers(admin, round.roster, {
    title: "Relay",
    body: "Tonight's game is live.",
    url: `/play/${round_id}`,
  });

  return NextResponse.json({ ok: true });
}
