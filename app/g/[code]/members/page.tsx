import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCosmeticsCssMap } from "@/lib/cosmetics";
import { Name } from "@/components/Name";
import { ChevronLeftIcon } from "@/components/icons";
import { RemoveMemberButton } from "./remove-member-button";

export default async function MembersPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, name, invite_code, created_by")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, joined_at, profiles(username, equipped_colour)")
    .eq("group_id", group.id)
    .order("joined_at");

  const cosmeticsCss = await getCosmeticsCssMap(supabase);
  const isCreator = user?.id === group.created_by;

  return (
    <main className="page flex flex-col gap-4">
      <header className="flex items-center gap-2 py-1">
        <Link href={`/g/${group.invite_code}`} className="-ml-2 p-2" aria-label="Back">
          <ChevronLeftIcon size={24} />
        </Link>
        <h1 className="font-display text-2xl font-bold">Members</h1>
      </header>

      <section className="card flex flex-col p-2">
        {members?.map((m) => {
          const profile = m.profiles as unknown as { username: string; equipped_colour: string | null } | null;
          const name = profile?.username ?? "?";
          return (
            <div key={m.user_id} className="flex min-h-14 items-center gap-3 px-3">
              <span className="avatar">{name.slice(0, 1).toUpperCase()}</span>
              <span className="flex-1 font-bold">
                <Name username={name} colourCss={profile?.equipped_colour ? cosmeticsCss[profile.equipped_colour] ?? null : null} animClass={null} />
                {m.user_id === group.created_by && <span className="ml-2 chip">creator</span>}
              </span>
              {(isCreator || m.user_id === user?.id) && (
                <RemoveMemberButton groupId={group.id} userId={m.user_id} inviteCode={group.invite_code} isSelf={m.user_id === user?.id} />
              )}
            </div>
          );
        })}
      </section>
      <p className="px-1 text-xs text-ink-2">Removals take effect at the next opening — nobody gets kicked to save tonight&apos;s streak.</p>
    </main>
  );
}
