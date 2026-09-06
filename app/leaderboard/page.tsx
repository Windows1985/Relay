import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GlobalLeaderboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: rows } = await supabase.rpc("global_leaderboard");

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <div className="bezel flex w-full max-w-sm flex-col gap-3 px-6 py-10">
        <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
          Global streaks
        </h1>
        <ol className="flex flex-col gap-2">
          {(rows ?? []).map((r: { name: string; streak: number }, i: number) => (
            <li key={i} className="bezel-inset flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-3">
                <span className="font-mono text-ink-dim">{i + 1}</span>
                <span className="font-medium">{r.name}</span>
              </span>
              <span className="font-mono led-text tabular-nums">{r.streak}</span>
            </li>
          ))}
          {(rows ?? []).length === 0 && (
            <p className="text-center text-sm text-ink-dim">No streaks yet.</p>
          )}
        </ol>
      </div>
    </main>
  );
}
