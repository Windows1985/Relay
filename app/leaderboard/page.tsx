import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FlameIcon } from "@/components/icons";

export default async function GlobalLeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: rows } = await supabase.rpc("global_leaderboard");
  const list = (rows ?? []) as { name: string; streak: number }[];

  return (
    <main className="page flex flex-col gap-4">
      <header className="py-1">
        <h1 className="font-display text-2xl font-bold">Longest streaks</h1>
        <p className="text-xs font-bold text-ink-2">Every group on Relay, ranked by nights in a row</p>
      </header>

      <section className="card flex flex-col p-2">
        {list.map((r, i) => (
          <div key={i} className="flex min-h-14 items-center gap-3 px-3">
            <span className={`avatar num text-sm ${i < 3 ? "text-ink" : "text-ink-2"}`}>{i + 1}</span>
            <span className="flex-1 font-bold">{r.name}</span>
            <span className={i === 0 ? "badge-sunset" : "chip num text-sm text-ink"}>
              <FlameIcon size={14} />
              {r.streak}
            </span>
          </div>
        ))}
        {list.length === 0 && <p className="p-4 text-center text-sm text-ink-2">No streaks yet. Be the first group to make it through a night.</p>}
      </section>
    </main>
  );
}
