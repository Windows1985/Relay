import webpush from "web-push";
import type { SupabaseClient } from "@supabase/supabase-js";

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  configured = true;
}

// Sends to every subscription for the given users, pruning any that the
// push service reports as gone (410) — the standard signal a subscription
// died (uninstalled, permission revoked) and will never work again.
export async function sendPushToUsers(
  admin: SupabaseClient,
  userIds: string[],
  payload: { title: string; body: string; url: string },
) {
  if (userIds.length === 0) return;
  ensureConfigured();

  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("endpoint, keys")
    .in("user_id", userIds);

  await Promise.all(
    (subs ?? []).map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys as { p256dh: string; auth: string } },
          JSON.stringify(payload),
        );
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
      }
    }),
  );
}
