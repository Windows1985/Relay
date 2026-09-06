import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getTodaysRound, getSubmittedCount } from "@/lib/rounds-data";
import { todayInZone, zonedTimeToUtc } from "@/lib/tz";
import { ChannelStatus } from "@/components/ChannelStatus";
import { EmailNudge } from "@/components/EmailNudge";
import { FlameIcon, UsersIcon } from "@/components/icons";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // proxy.ts redirects signed-out visitors to /join

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

  const bestStreak = groups.reduce((max, g) => Math.max(max, g.streak), 0);
  const hasRealEmail = !user.email?.endsWith("@id.relay.app");
  const streakWorthProtecting = bestStreak >= 3;

  return (
    <main className="page flex flex-col gap-5">
      <header className="flex items-center justify-between py-1">
        <h1 className="font-display text-2xl font-bold tracking-tight">Relay</h1>
        <span className="badge-sunset">
          <FlameIcon size={16} />
          {bestStreak}
        </span>
      </header>

      {!hasRealEmail && streakWorthProtecting && <EmailNudge />}

      {groups.length === 0 && (
        <section className="card flex flex-col items-center gap-4 p-6 text-center">
          <div className="ring ring-muted">
            <div className="ring-inner h-28 w-28">
              <UsersIcon size={32} className="text-ink-2" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold">Get your group in</h2>
            <p className="text-sm text-ink-2">One game a night. Nobody sees answers until they&apos;ve played.</p>
          </div>
          <Link href="/g/new" className="btn-primary w-full">
            Start a group
          </Link>
          <Link href="/g/join" className="btn-secondary w-full">
            I have an invite code
          </Link>
        </section>
      )}

      {await Promise.all(
        groups.map(async (group) => {
          const round = await getTodaysRound(supabase, group.id, group.tz);
          let submittedCount = 0;
          let hasSubmitted = false;
          let hasVoted = false;
          if (round) {
            submittedCount = await getSubmittedCount(supabase, round.id);
            hasSubmitted =
              submittedCount > 0
                ? (await supabase.from("submissions").select("user_id").eq("round_id", round.id).eq("user_id", user.id).maybeSingle()).data !== null
                : false;
            if (round.needs_vote) {
              hasVoted =
                (await supabase.from("votes").select("voter_id").eq("round_id", round.id).eq("voter_id", user.id).maybeSingle()).data !== null;
            }
          }

          const today = todayInZone(group.tz);
          const estimatedOpensAt = zonedTimeToUtc(today, group.window_start.slice(0, 5), group.tz).toISOString();
          const estimatedWindowEnd = zonedTimeToUtc(today, group.window_end.slice(0, 5), group.tz).toISOString();

          return (
            <ChannelStatus
              key={group.invite_code}
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
          );
        }),
      )}

      {groups.length > 0 && (
        <div className="flex gap-3">
          <Link href="/g/new" className="btn-secondary flex-1">
            New group
          </Link>
          <Link href="/g/join" className="btn-secondary flex-1">
            Join with code
          </Link>
        </div>
      )}
    </main>
  );
}
