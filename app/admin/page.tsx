import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeftIcon } from "@/components/icons";
import { AdminPanel } from "./admin-panel";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) notFound();

  const { data: memberships } = await supabase
    .from("memberships")
    .select("groups(id, name, invite_code, tz)")
    .eq("user_id", user.id);
  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as { id: string; name: string; invite_code: string; tz: string } | null)
    .filter((g): g is NonNullable<typeof g> => g !== null);

  const { data: modes } = await supabase.from("modes").select("id, input_type, scoring, needs_vote, active").order("active", { ascending: false }).order("id");

  // Today's round per group, in each group's own local date.
  const rounds = await Promise.all(
    groups.map(async (g) => {
      const { data } = await supabase
        .from("rounds")
        .select("id, mode_id, reveal_at, votes_close_at, settled_at, local_date")
        .eq("group_id", g.id)
        .order("local_date", { ascending: false })
        .limit(1)
        .maybeSingle();
      return [g.id, data] as const;
    }),
  );

  const { data: cosmetics } = await supabase.from("cosmetics").select("id");
  const { data: owned } = await supabase.from("owned_cosmetics").select("cosmetic_id").eq("user_id", user.id);

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href="/me" className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Admin</h1>
          <p className="text-xs font-bold text-ink-2">Only you can see this.</p>
        </div>
      </header>

      <AdminPanel
        groups={groups}
        modes={modes ?? []}
        latestRounds={Object.fromEntries(rounds)}
        cosmeticIds={(cosmetics ?? []).map((c) => c.id)}
        ownedCount={owned?.length ?? 0}
      />
    </main>
  );
}
