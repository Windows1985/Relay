import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidWebhookRequest } from "@/lib/webhook-auth";

// Called by pg_net at settle (every photo round) and by the reports insert
// trigger (immediate purge on a report). Deleting the submissions.photo_path
// row is not enough — the blob has to be removed from Storage separately,
// which SQL can't do.
export async function POST(request: Request) {
  if (!isValidWebhookRequest(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { round_id, user_id } = (await request.json()) as { round_id: string; user_id?: string };
  const admin = createAdminClient();

  // Reported photo (single user_id): purge just that one submission, since
  // the round may still be open for voting and everyone else's photo is
  // still needed. Round settle (no user_id): purge every photo at once.
  let query = admin.from("submissions").select("photo_path").eq("round_id", round_id).not("photo_path", "is", null);
  if (user_id) query = query.eq("user_id", user_id);
  const { data: submissions } = await query;

  const paths = (submissions ?? []).map((s) => s.photo_path as string);
  if (paths.length > 0) {
    await admin.storage.from("photos").remove(paths);
  }

  return NextResponse.json({ ok: true, purged: paths.length });
}
