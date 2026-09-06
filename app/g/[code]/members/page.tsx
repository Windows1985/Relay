import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RemoveMemberButton } from "./remove-member-button";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: group } = await supabase
    .from("groups")
    .select("id, invite_code, created_by")
    .eq("invite_code", code.toUpperCase())
    .single();
  if (!group) notFound();

  const { data: members } = await supabase
    .from("memberships")
    .select("user_id, joined_at, profiles(username)")
    .eq("group_id", group.id)
    .order("joined_at");

  const isCreator = user?.id === group.created_by;

  return (
    <main className="flex flex-1 flex-col items-center p-8">
      <div className="bezel flex w-full max-w-sm flex-col gap-3 px-6 py-10">
        <h1 className="text-center font-mono led-text text-xl font-bold uppercase tracking-widest">
          Members
        </h1>
        <ul className="flex flex-col gap-2">
          {members?.map((m) => (
            <li key={m.user_id} className="bezel-inset flex items-center justify-between px-3 py-2">
              <span>{(m.profiles as unknown as { username: string } | null)?.username}</span>
              {(isCreator || m.user_id === user?.id) && (
                <RemoveMemberButton
                  groupId={group.id}
                  userId={m.user_id}
                  inviteCode={group.invite_code}
                  isSelf={m.user_id === user?.id}
                />
              )}
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
