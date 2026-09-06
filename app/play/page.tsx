import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodaysRound } from "@/lib/rounds-data";
import { LockIcon } from "@/components/icons";

// The Play tab: jump straight into whatever's actionable tonight, or say
// plainly that nothing is yet.
export default async function PlayIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: memberships } = await supabase.from("memberships").select("groups(id, tz, window_start)");
  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as { id: string; tz: string; window_start: string } | null)
    .filter((g): g is NonNullable<typeof g> => g !== null);

  for (const group of groups) {
    const round = await getTodaysRound(supabase, group.id, group.tz);
    if (!round) continue;
    if (round.reveal_at) redirect(`/reveal/${round.id}`);
    const { data: mine } = await supabase
      .from("submissions")
      .select("user_id")
      .eq("round_id", round.id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!mine) redirect(`/play/${round.id}`);
  }

  return (
    <main className="page flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-4 p-6 text-center">
        <div className="ring ring-muted">
          <div className="ring-inner h-28 w-28">
            <LockIcon size={32} className="text-ink-2" />
          </div>
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold">Nothing to play right now</h2>
          <p className="text-sm text-ink-2">
            {groups.length === 0
              ? "Join a group first — games open nightly for the whole group at once."
              : "You've played tonight, or the window hasn't opened yet. The home tab has the countdown."}
          </p>
        </div>
        <Link href="/" className="btn-secondary w-full">
          Back home
        </Link>
      </section>
    </main>
  );
}
