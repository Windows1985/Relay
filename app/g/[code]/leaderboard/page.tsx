import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCosmeticsCssMap } from "@/lib/cosmetics";
import { startOfWeekInZone } from "@/lib/tz";
import { Name } from "@/components/Name";
import { ChevronLeftIcon } from "@/components/icons";

type Row = { user_id: string; username: string; equipped_colour: string | null; total: number };

export default async function GroupLeaderboardPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();

  const { data: group } = await supabase.from("groups").select("id, name, invite_code, tz").eq("invite_code", code.toUpperCase()).single();
  if (!group) notFound();

  const since = startOfWeekInZone(group.tz).toISOString();
  const { data: rows } = await supabase.rpc("group_weekly_leaderboard", { p_group_id: group.id, p_since: since });
  const cosmeticsCss = await getCosmeticsCssMap(supabase);

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href={`/g/${group.invite_code}`} className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">This week</h1>
          <p className="text-xs font-bold text-ink-2">{group.name} · resets Monday</p>
        </div>
      </header>

      <section className="card flex flex-col p-2">
        {((rows ?? []) as Row[]).map((r, i) => (
          <div key={r.user_id} className="flex min-h-14 items-center gap-3 px-3">
            {i === 0 ? (
              <span className="ring p-[3px]">
                <span className="avatar h-9 w-9 border-0">{r.username.slice(0, 1).toUpperCase()}</span>
              </span>
            ) : (
              <span className="avatar num text-sm text-ink-2">{i + 1}</span>
            )}
            <span className="flex-1 font-bold">
              <Name username={r.username} colourCss={r.equipped_colour ? cosmeticsCss[r.equipped_colour] ?? null : null} animClass={null} />
            </span>
            <span className="num text-lg font-semibold">{r.total}</span>
          </div>
        ))}
      </section>
    </main>
  );
}
