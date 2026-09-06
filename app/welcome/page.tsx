import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WelcomeFlow } from "./welcome-flow";

export default async function WelcomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: profile } = await supabase.from("profiles").select("username").eq("id", user.id).single();
  if (!profile?.username) redirect("/pick-username");

  return <WelcomeFlow username={profile.username} />;
}
