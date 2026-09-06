import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTodaysRound, getSubmittedCount } from "@/lib/rounds-data";
import { todayInZone, zonedTimeToUtc } from "@/lib/tz";
import { ChannelStatus } from "@/components/ChannelStatus";
import { EmailNudge } from "@/components/EmailNudge";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="text-2xl font-semibold">Relay</div>
      </main>
    );
  }

  const { data: memberships } = await supabase
    .from("memberships")
    .select("groups(id, invite_code, name, streak, tz, window_start, window_end)");

  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as {
      id: string;
      invite_code: string;
      name: string;
      streak: number;
      tz: string;
      window_start: string;
      window_end: string;
    } | null)
    .filter((g): g is NonNullable<typeof g> => g !== null);

  // Nudge for a real recovery email once there's a streak worth protecting.
  // Signup always uses a synthetic @id.relay.app address (see lib/username.ts).
  const hasRealEmail = !user.email?.endsWith("@id.relay.app");
  const streakWorthProtecting = groups.some((g) => g.streak >= 3);

  return (
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <h1 className="font-mono text-lg font-bold uppercase tracking-[0.3em] text-ink-dim">
        Relay
      </h1>

      {!hasRealEmail && streakWorthProtecting && <EmailNudge />}

      {groups.length === 0 && (
        <div className="bezel w-full max-w-sm px-6 py-8 text-center text-ink-dim">
          No channels yet.
        </div>
      )}

      <div className="flex w-full max-w-sm flex-col gap-6">
        {await Promise.all(
          groups.map(async (group) => {
            const round = await getTodaysRound(supabase, group.id, group.tz);
            let submittedCount = 0;
            let hasSubmitted = false;
            let hasVoted = false;
            if (round) {
              submittedCount = await getSubmittedCount(supabase, round.id);
              hasSubmitted = submittedCount > 0
                ? (await supabase.from("submissions").select("user_id").eq("round_id", round.id).eq("user_id", user.id).maybeSingle()).data !== null
                : false;
              if (round.needs_vote) {
                hasVoted = (
                  await supabase.from("votes").select("voter_id").eq("round_id", round.id).eq("voter_id", user.id).maybeSingle()
                ).data !== null;
              }
            }

            const today = todayInZone(group.tz);
            const estimatedOpensAt = zonedTimeToUtc(today, group.window_start.slice(0, 5), group.tz).toISOString();
            const estimatedWindowEnd = zonedTimeToUtc(today, group.window_end.slice(0, 5), group.tz).toISOString();

            return (
              <div key={group.invite_code} className="flex flex-col gap-2">
                <ChannelStatus
                  group={group}
                  round={round}
                  roundId={round?.id ?? null}
                  rosterSize={round?.roster.length ?? null}
                  estimatedOpensAt={estimatedOpensAt}
                  estimatedWindowEnd={estimatedWindowEnd}
                  hasSubmitted={hasSubmitted}
                  hasVoted={hasVoted}
                  submittedCount={submittedCount}
                />
                <Link
                  href={`/g/${group.invite_code}`}
                  className="text-center text-xs text-ink-dim underline"
                >
                  Group settings &amp; members
                </Link>
              </div>
            );
          }),
        )}
      </div>

      <div className="flex gap-4 text-sm text-ink-dim underline">
        <Link href="/g/new">Start a group</Link>
        <Link href="/g/join">Join a group</Link>
      </div>
    </main>
  );
}
