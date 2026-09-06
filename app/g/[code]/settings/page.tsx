import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "./settings-form";

export default async function GroupSettingsPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, tz, window_start, window_end")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <div className="flex w-full max-w-sm flex-col gap-3">
        <h1 className="text-center text-2xl font-semibold">Group settings</h1>
        <SettingsForm group={group} />
      </div>
    </main>
  );
}
