import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RevealView } from "@/components/RevealView";

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
      "id, mode_id, reveal_at, votes_close_at, settled_at, winner_id, streak_survived, roster, modes(input_type, scoring, target, needs_vote)",
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
    .select("user_id, payload, score, photo_path, submitted_at, hidden, profiles(username)")
    .eq("round_id", roundId)
    .order("submitted_at");

  const hasOwnSubmission = (submissions ?? []).some((s) => s.user_id === user.id);
  if (!hasOwnSubmission) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
        <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">Locked</div>
        <p className="text-sm text-ink-dim">You didn&apos;t play tonight, so the reveal stays locked for you.</p>
      </main>
    );
  }

  const { data: votes } = await supabase.from("votes").select("voter_id, target_user_id").eq("round_id", roundId);
  const hasVoted = (votes ?? []).some((v) => v.voter_id === user.id);

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
    <main className="flex flex-1 flex-col items-center gap-6 p-6">
      <RevealView
        roundId={round.id}
        currentUserId={user.id}
        inputType={mode.input_type}
        scoring={mode.scoring}
        target={mode.target}
        needsVote={mode.needs_vote}
        votingOpen={!!votingOpen}
        hasVoted={hasVoted}
        settled={!!round.settled_at}
        winnerId={round.winner_id}
        streakSurvived={round.streak_survived}
        votesCloseAt={round.votes_close_at}
        submissions={(submissions ?? []).map((s) => ({
          userId: s.user_id,
          username: (s.profiles as unknown as { username: string } | null)?.username ?? "?",
          payload: s.payload as Record<string, unknown>,
          score: s.score,
          hidden: s.hidden,
          photoUrl: signedUrls[s.user_id] ?? null,
          voteCount: (votes ?? []).filter((v) => v.target_user_id === s.user_id).length,
        }))}
      />
    </main>
  );
}
