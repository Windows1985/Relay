import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Service-role client for the two webhook routes pg_net calls (push send,
// photo purge) — they act across every user/group, which RLS as any real
// user can't do. Never import this from client code.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
