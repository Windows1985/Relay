import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RevealView } from "@/components/RevealView";
import { getCosmeticsCssMap } from "@/lib/cosmetics";
import { InstallAndNotify } from "@/components/InstallAndNotify";
import { ChevronLeftIcon, LockIcon } from "@/components/icons";

export default async function RevealPage({
  params,
}: {
  params: Promise<{ roundId: string }>;
}) {
  const { roundId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: round } = await supabase
    .from("rounds")
    .select(
      "id, mode_id, reveal_at, votes_close_at, settled_at, winner_id, streak_survived, roster, freeze_used_by, profiles!rounds_freeze_used_by_fkey(username), modes(input_type, scoring, target, needs_vote)",
    )
    .eq("id", roundId)
    .single();
  if (!round) notFound();
  if (!round.reveal_at) redirect("/");

  const mode = round.modes as unknown as {
    input_type: string;
    scoring: string;
    target: number | null;
    needs_vote: boolean;
  };

  const { data: submissions } = await supabase
    .from("submissions")
    .select("user_id, payload, score, photo_path, submitted_at, hidden, profiles(username, equipped_colour, equipped_anim)")
    .eq("round_id", roundId)
    .order("submitted_at");

  const cosmeticsCss = await getCosmeticsCssMap(supabase);

  const header = (
    <header className="flex items-center gap-2 py-1">
      <Link href="/" className="-ml-2 p-2" aria-label="Back home">
        <ChevronLeftIcon size={24} />
      </Link>
      <span className="text-sm font-bold text-ink-2">Tonight&apos;s reveal</span>
    </header>
  );

  const hasOwnSubmission = (submissions ?? []).some((s) => s.user_id === user.id);
  if (!hasOwnSubmission) {
    return (
      <main className="page flex flex-col gap-4">
        {header}
        <section className="card flex flex-col items-center gap-4 p-6 text-center">
          <div className="ring ring-muted">
            <div className="ring-inner h-28 w-28">
              <LockIcon size={36} className="text-ink-2" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Locked</h1>
            <p className="text-sm text-ink-2">You didn&apos;t play tonight, so everyone&apos;s answers stay hidden from you. Tomorrow&apos;s a new game.</p>
          </div>
          <Link href="/" className="btn-secondary w-full">
            Back home
          </Link>
        </section>
      </main>
    );
  }

  const { data: votes } = await supabase.from("votes").select("voter_id, target_user_id").eq("round_id", roundId);
  const myVote = (votes ?? []).find((v) => v.voter_id === user.id);

  let signedUrls: Record<string, string> = {};
  if (mode.input_type === "photo") {
    const entries = await Promise.all(
      (submissions ?? [])
        .filter((s) => s.photo_path)
        .map(async (s) => {
          const { data } = await supabase.storage.from("photos").createSignedUrl(s.photo_path!, 3600);
          return [s.user_id, data?.signedUrl ?? ""] as const;
        }),
    );
    signedUrls = Object.fromEntries(entries);
  }

  const votingOpen = mode.needs_vote && round.votes_close_at && new Date(round.votes_close_at) > new Date();

  return (
    <main className="page flex flex-col gap-4">
      {header}
      <InstallAndNotify />
      <RevealView
        roundId={round.id}
        modeId={round.mode_id}
        currentUserId={user.id}
        inputType={mode.input_type}
        scoring={mode.scoring}
        target={mode.target}
        needsVote={mode.needs_vote}
        votingOpen={!!votingOpen}
        hasVoted={!!myVote}
        myVoteTarget={myVote?.target_user_id ?? null}
        settled={!!round.settled_at}
        winnerId={round.winner_id}
        streakSurvived={round.streak_survived}
        freezeUsedByUsername={(round.profiles as unknown as { username: string } | null)?.username ?? null}
        votesCloseAt={round.votes_close_at}
        cosmeticsCss={cosmeticsCss}
        submissions={(submissions ?? []).map((s) => {
          const profile = s.profiles as unknown as {
            username: string;
            equipped_colour: string | null;
            equipped_anim: string | null;
          } | null;
          return {
            userId: s.user_id,
            username: profile?.username ?? "?",
            equippedColour: profile?.equipped_colour ?? null,
            equippedAnim: profile?.equipped_anim ?? null,
            payload: s.payload as Record<string, unknown>,
            score: s.score,
            hidden: s.hidden,
            photoUrl: signedUrls[s.user_id] ?? null,
            voteCount: (votes ?? []).filter((v) => v.target_user_id === s.user_id).length,
          };
        })}
      />
    </main>
  );
}
