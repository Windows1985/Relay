import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GameShell } from "@/components/games/GameShell";
import { MotionGame } from "@/components/games/MotionGame";
import { StopAtTargetGame } from "@/components/games/StopAtTargetGame";
import { TapFastGame } from "@/components/games/TapFastGame";
import { ReactionGame } from "@/components/games/ReactionGame";
import { PhotoGame } from "@/components/games/PhotoGame";
import { TextGame } from "@/components/games/TextGame";
import { NamePickGame } from "@/components/games/NamePickGame";
import { CheckIcon, ChevronLeftIcon } from "@/components/icons";

export default async function PlayPage({
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
    .select("id, mode_id, reveal_at, roster, prompts(text), modes(input_type, target, duration_ms)")
    .eq("id", roundId)
    .single();
  if (!round) notFound();
  if (round.reveal_at) redirect(`/reveal/${roundId}`);

  const { data: existing } = await supabase
    .from("submissions")
    .select("user_id")
    .eq("round_id", roundId)
    .eq("user_id", user.id)
    .maybeSingle();

  const mode = round.modes as unknown as {
    input_type: string;
    target: number | null;
    duration_ms: number | null;
  };
  const prompt = (round.prompts as unknown as { text: string } | null)?.text ?? null;

  let rosterUsernames: { id: string; username: string }[] = [];
  if (mode.input_type === "name_pick") {
    const { data: profiles } = await supabase.from("profiles").select("id, username").in("id", round.roster);
    rosterUsernames = (profiles ?? []).map((p) => ({ id: p.id, username: p.username ?? "?" }));
  }

  let game: React.ReactNode;
  if (mode.input_type === "motion") game = <MotionGame roundId={round.id} durationMs={mode.duration_ms ?? 15000} />;
  else if (round.mode_id === "stop10") game = <StopAtTargetGame roundId={round.id} targetMs={mode.target ?? 10000} />;
  else if (round.mode_id === "tap_fast") game = <TapFastGame roundId={round.id} durationMs={mode.duration_ms ?? 10000} />;
  else if (round.mode_id === "reaction") game = <ReactionGame roundId={round.id} />;
  else if (mode.input_type === "photo") game = <PhotoGame roundId={round.id} />;
  else if (mode.input_type === "text") game = <TextGame roundId={round.id} />;
  else if (mode.input_type === "name_pick")
    game = <NamePickGame roundId={round.id} roster={rosterUsernames} currentUserId={user.id} />;
  else game = <p className="text-sm text-ink-2">This game isn&apos;t playable on this device.</p>;

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href="/" className="-ml-2 p-2" aria-label="Back home">
          <ChevronLeftIcon size={24} />
        </Link>
        <span className="text-sm font-bold text-ink-2">Tonight&apos;s game</span>
      </header>

      {existing ? (
        <section className="card flex flex-col items-center gap-4 p-6 text-center">
          <div className="ring">
            <div className="ring-inner h-28 w-28">
              <CheckIcon size={36} className="text-g3" />
            </div>
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">You&apos;re in</h1>
            <p className="text-sm text-ink-2">The reveal unlocks once everyone&apos;s played.</p>
          </div>
          <Link href="/" className="btn-primary w-full">
            Back home
          </Link>
        </section>
      ) : (
        <GameShell modeId={round.mode_id} promptText={prompt}>
          {game}
        </GameShell>
      )}
    </main>
  );
}
