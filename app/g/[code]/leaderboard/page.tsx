import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCosmeticsCssMap } from "@/lib/cosmetics";
import { startOfWeekInZone } from "@/lib/tz";
import { Name } from "@/components/Name";

export default async function GroupLeaderboardPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, tz")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  const since = startOfWeekInZone(group.tz).toISOString();
  const { data: rows } = await supabase.rpc("group_weekly_leaderboard", {
    p_group_id: group.id,
    p_since: since,
  });
  const cosmeticsCss = await getCosmeticsCssMap(supabase);

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <div className="bezel flex w-full max-w-sm flex-col gap-3 px-6 py-10">
        <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
          {group.name}
        </h1>
        <p className="text-center text-xs text-ink-dim uppercase tracking-widest">
          This week&apos;s tokens
        </p>
        <ol className="flex flex-col gap-2">
          {(rows ?? []).map((r: { user_id: string; username: string; equipped_colour: string | null; total: number }, i: number) => (
            <li key={r.user_id} className="bezel-inset flex items-center justify-between px-3 py-2">
              <span className="flex items-center gap-3">
                <span className="font-mono text-ink-dim">{i + 1}</span>
                <Name
                  username={r.username}
                  colourCss={r.equipped_colour ? cosmeticsCss[r.equipped_colour] ?? null : null}
                  animClass={null}
                />
              </span>
              <span className="font-mono tabular-nums text-ink">{r.total}</span>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}
