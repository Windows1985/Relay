// Shared by every route pg_net calls from inside tick(): a shared secret in
// a header, since these run with no user session to check.
export function isValidWebhookRequest(request: Request): boolean {
  const secret = request.headers.get("x-relay-secret");
  return !!secret && secret === process.env.RELAY_WEBHOOK_SECRET;
}
