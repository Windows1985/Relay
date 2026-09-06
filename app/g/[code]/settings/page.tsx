import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChevronLeftIcon } from "@/components/icons";
import { SettingsForm } from "./settings-form";

export default async function GroupSettingsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, tz, window_start, window_end")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href={`/g/${group.invite_code}`} className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Settings</h1>
      </header>
      <section className="card p-5">
        <SettingsForm group={group} />
      </section>
    </main>
  );
}
