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
    <main className="flex flex-1 flex-col items-center justify-center p-5">
      <div className="card flex w-full max-w-sm flex-col gap-4 p-6">
        <div className="text-center">
          <h1 className="font-display text-2xl font-bold">Pick a username</h1>
          <p className="mt-1 text-sm text-ink-2">This is what your group sees. Google doesn&apos;t give us one.</p>
        </div>
        <PickUsernameForm />
      </div>
    </main>
  );
}
