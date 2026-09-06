import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { FreezeBuyButton } from "./freeze-buy-button";

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, streak, freezes, window_start, window_end, tz")
    .eq("invite_code", code.toUpperCase())
    .single();

  if (!group) notFound();

  let balance = 0;
  if (user) {
    const { data: bal } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).maybeSingle();
    balance = bal?.balance ?? 0;
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="bezel flex w-full max-w-sm flex-col items-center gap-3 px-6 py-10">
        <h1 className="font-mono led-text text-xl font-bold uppercase tracking-widest">
          {group.name}
        </h1>
        <p className="text-sm text-ink-dim">
          Streak: {group.streak} &middot; {group.window_start.slice(0, 5)}–{group.window_end.slice(0, 5)}{" "}
          {group.tz}
        </p>
        <p className="text-sm text-ink-dim">
          Invite code: <span className="font-mono text-ink">{group.invite_code}</span>
        </p>

        <div className="bezel-inset flex w-full flex-col gap-2 px-4 py-3">
          <p className="text-xs text-ink-dim">
            Freezes: {group.freezes}/2 &middot; your balance: {balance} tokens
          </p>
          {group.freezes < 2 && <FreezeBuyButton groupId={group.id} canAfford={balance >= 40} />}
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm text-ink-dim underline">
          <Link href={`/g/${group.invite_code}/members`}>Members</Link>
          <Link href={`/g/${group.invite_code}/settings`}>Settings</Link>
          <Link href={`/g/${group.invite_code}/leaderboard`}>Leaderboard</Link>
          <Link href="/leaderboard">Global streaks</Link>
        </div>
      </div>
      <Link href="/" className="text-xs text-ink-dim underline">
        Back home
      </Link>
    </main>
  );
}
