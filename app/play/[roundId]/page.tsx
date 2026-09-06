import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MotionGame } from "@/components/games/MotionGame";
import { StopAtTargetGame } from "@/components/games/StopAtTargetGame";
import { TapFastGame } from "@/components/games/TapFastGame";
import { ReactionGame } from "@/components/games/ReactionGame";
import { PhotoGame } from "@/components/games/PhotoGame";
import { TextGame } from "@/components/games/TextGame";
import { NamePickGame } from "@/components/games/NamePickGame";

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
  const prompt = round.prompts as unknown as { text: string } | null;

  let rosterUsernames: { id: string; username: string }[] = [];
  if (mode.input_type === "name_pick") {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, username")
      .in("id", round.roster);
    rosterUsernames = (profiles ?? []).map((p) => ({ id: p.id, username: p.username ?? "?" }));
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6">
      {existing ? (
        <div className="bezel flex w-full max-w-sm flex-col items-center gap-2 px-6 py-10 text-center">
          <div className="font-mono led-text text-xl font-bold uppercase tracking-widest">
            Transmitted
          </div>
          <p className="text-sm text-ink-dim">You&apos;ve already played tonight. Reveal is next.</p>
        </div>
      ) : mode.input_type === "motion" ? (
        <MotionGame roundId={round.id} durationMs={mode.duration_ms ?? 15000} />
      ) : mode.input_type === "timing" && round.mode_id === "stop10" ? (
        <StopAtTargetGame roundId={round.id} targetMs={mode.target ?? 10000} />
      ) : mode.input_type === "timing" && round.mode_id === "tap_fast" ? (
        <TapFastGame roundId={round.id} durationMs={mode.duration_ms ?? 10000} />
      ) : mode.input_type === "timing" && round.mode_id === "reaction" ? (
        <ReactionGame roundId={round.id} />
      ) : mode.input_type === "photo" ? (
        <PhotoGame roundId={round.id} promptText={prompt?.text ?? "Snap it."} />
      ) : mode.input_type === "text" ? (
        <TextGame roundId={round.id} promptText={prompt?.text ?? "Answer honestly."} />
      ) : mode.input_type === "name_pick" ? (
        <NamePickGame
          roundId={round.id}
          promptText={prompt?.text ?? "Pick someone."}
          roster={rosterUsernames}
          currentUserId={user.id}
        />
      ) : (
        <div className="text-ink-dim">Unsupported game mode.</div>
      )}
    </main>
  );
}
