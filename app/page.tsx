import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Placeholder — Phase 4 replaces this with the real "tonight's state"
  // screen (opens-at countdown / live / revealed / settled), derived
  // from lib/round.ts, and a switcher across a user's groups.
  const { data: memberships } = user
    ? await supabase.from("memberships").select("groups(name, invite_code)")
    : { data: null };

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-2xl font-semibold">Relay</h1>
      {memberships?.length ? (
        <ul className="flex flex-col gap-2">
          {memberships.map((m, i) => {
            const group = m.groups as unknown as { name: string; invite_code: string } | null;
            if (!group) return null;
            return (
              <li key={i}>
                <Link href={`/g/${group.invite_code}`} className="underline">
                  {group.name}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-zinc-500">No groups yet.</p>
      )}
      <div className="flex gap-4 text-sm underline">
        <Link href="/g/new">Start a group</Link>
        <Link href="/g/join">Join a group</Link>
      </div>
    </main>
  );
}
