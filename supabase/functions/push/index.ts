import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Sends Relay's two push notifications. Lives here rather than in the Next.js
// app so push needs no deployment configuration at all: Supabase injects
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY into the edge runtime, and the
// VAPID keys come from app_settings (RLS on, no policies, client-unreadable).
//
// verify_jwt stays on, so callers must present a valid Supabase JWT — pg_net
// sends the anon key. That only proves the call came from somewhere with a
// public key, so real authorisation is the shared secret below.

type Body = { round_id: string; kind: "open" | "reminder" };

Deno.serve(async (req: Request) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: settingsRows } = await admin.from("app_settings").select("key, value");
  const settings = Object.fromEntries((settingsRows ?? []).map((r) => [r.key, r.value]));

  const provided = req.headers.get("x-relay-secret");
  if (!settings.webhook_secret || provided !== settings.webhook_secret) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Bad request" }, { status: 400 });
  }

  if (!settings.vapid_public || !settings.vapid_private || !settings.vapid_subject) {
    return Response.json({ error: "VAPID keys not configured" }, { status: 503 });
  }
  webpush.setVapidDetails(settings.vapid_subject, settings.vapid_public, settings.vapid_private);

  const { data: round } = await admin
    .from("rounds")
    .select("id, roster")
    .eq("id", body.round_id)
    .single();
  if (!round) return Response.json({ error: "Round not found" }, { status: 404 });

  let targets: string[] = round.roster;
  if (body.kind === "reminder") {
    // Only chase the people who still haven't played.
    const { data: submitted } = await admin
      .from("submissions")
      .select("user_id")
      .eq("round_id", body.round_id);
    const done = new Set((submitted ?? []).map((s) => s.user_id));
    targets = targets.filter((id) => !done.has(id));
  }
  if (targets.length === 0) return Response.json({ ok: true, sent: 0, pruned: 0 });

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, keys, user_id")
    .in("user_id", targets);

  const payload = JSON.stringify(
    body.kind === "open"
      ? { title: "Relay", body: "Tonight's game is live.", url: `/play/${body.round_id}` }
      : { title: "Relay", body: "2 hours left — you haven't played yet.", url: `/play/${body.round_id}` },
  );

  let sent = 0;
  let pruned = 0;
  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          payload,
        );
        sent++;
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        // 404/410 mean the subscription is permanently dead (uninstalled,
        // permission revoked) and will never work again.
        if (status === 404 || status === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
          pruned++;
        }
      }
    }),
  );

  return Response.json({ ok: true, sent, pruned, targeted: targets.length });
});
