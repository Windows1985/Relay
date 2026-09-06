import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { InviteShare } from "@/components/InviteShare";
import { ChevronLeftIcon, FlameIcon, SettingsIcon, TrophyIcon, UsersIcon } from "@/components/icons";
import { FreezeBuyButton } from "./freeze-buy-button";

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default async function GroupHomePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, streak, best_streak, freezes, window_start, window_end, tz")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  const { count: memberCount } = await supabase
    .from("memberships")
    .select("user_id", { count: "exact", head: true })
    .eq("group_id", group.id);

  let balance = 0;
  if (user) {
    const { data: bal } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).maybeSingle();
    balance = bal?.balance ?? 0;
  }

  const rows = [
    { href: `/g/${group.invite_code}/members`, Icon: UsersIcon, label: `Members`, meta: `${memberCount ?? 0}` },
    { href: `/g/${group.invite_code}/leaderboard`, Icon: TrophyIcon, label: "This week's board", meta: "" },
    { href: `/g/${group.invite_code}/settings`, Icon: SettingsIcon, label: "Settings", meta: `${fmt(group.window_start)}–${fmt(group.window_end)}` },
  ];

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href="/" className="-ml-2 p-2" aria-label="Back home">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="flex-1 font-display text-2xl font-bold">{group.name}</h1>
      </header>

      <section className="card flex flex-col items-center gap-4 p-6 text-center">
        <div className="flex gap-2">
          <span className="badge-sunset">
            <FlameIcon size={16} />
            {group.streak} day streak
          </span>
          <span className="chip">best {group.best_streak}</span>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-ink-2">Invite code</p>
          <p className="num text-4xl font-semibold tracking-[0.2em]">{group.invite_code}</p>
        </div>
        <InviteShare code={group.invite_code} groupName={group.name} />
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-semibold">Freezes</h2>
            <p className="text-sm text-ink-2">Saves the streak on a bad night. Max two banked.</p>
          </div>
          <span className="num text-2xl font-semibold">{group.freezes}/2</span>
        </div>
        {group.freezes < 2 && <FreezeBuyButton groupId={group.id} canAfford={balance >= 40} />}
      </section>

      <section className="card flex flex-col p-2">
        {rows.map(({ href, Icon, label, meta }) => (
          <Link key={href} href={href} className="flex min-h-14 items-center gap-3 rounded-2xl px-4 font-bold active:bg-paper-warm">
            <Icon size={22} className="text-g3" />
            <span className="flex-1">{label}</span>
            <span className="text-sm font-bold text-ink-2">{meta}</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
