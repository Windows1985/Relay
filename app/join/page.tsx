import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { JoinForm } from "./join-form";

export default async function JoinPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    redirect(profile?.username ? "/" : "/pick-username");
  }

  // Null until 0029_player_count.sql is applied — the counter just stays hidden.
  const { data: players } = await supabase.rpc("player_count");

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-5">
      <div className="w-full max-w-sm">
        <JoinForm />
        {players > 0 && (
          <p className="mt-4 text-center text-sm font-bold text-ink-2">
            {players.toLocaleString()} {players === 1 ? "player" : "players"} so far
          </p>
        )}
        <p className="mt-4 text-center text-xs text-ink-2">
          One game a night for your group chat. Nobody sees answers until they&apos;ve played.
        </p>
      </div>
    </main>
  );
}
