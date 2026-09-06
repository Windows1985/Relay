"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function removeMember(
  groupId: string,
  userId: string,
  inviteCode: string,
  isSelf: boolean,
) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("remove_member", {
    p_group_id: groupId,
    p_target_user_id: userId,
  });
  if (error) return { error: error.message };

  if (isSelf) redirect("/");
  revalidatePath(`/g/${inviteCode}/members`);
  return { error: null };
}
