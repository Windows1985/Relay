import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GroupHomePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, streak, window_start, window_end, tz")
    .eq("invite_code", code.toUpperCase())
    .single();

  if (!group) notFound();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">{group.name}</h1>
      <p className="text-zinc-500">
        Streak: {group.streak} &middot; {group.window_start}–{group.window_end} {group.tz}
      </p>
      <p className="text-sm text-zinc-500">
        Invite code: <span className="font-mono">{group.invite_code}</span>
      </p>
      <p className="text-zinc-400">Round engine lands next phase.</p>
      <div className="flex gap-4 text-sm underline">
        <Link href={`/g/${group.invite_code}/members`}>Members</Link>
        <Link href={`/g/${group.invite_code}/settings`}>Settings</Link>
      </div>
    </main>
  );
}
