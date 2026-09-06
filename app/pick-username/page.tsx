import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PickUsernameForm } from "./pick-username-form";

export default async function PickUsernamePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  if (profile?.username) redirect("/");

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="bezel flex w-full max-w-sm flex-col gap-4 px-6 py-10">
        <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
          Pick a username
        </h1>
        <p className="text-center text-sm text-ink-dim">
          This is what your group sees. Google doesn&apos;t give us one for you.
        </p>
        <PickUsernameForm />
      </div>
    </main>
  );
}
