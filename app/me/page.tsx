import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCosmeticsCssMap, ANIM_CLASS } from "@/lib/cosmetics";
import { Name } from "@/components/Name";
import { BagIcon, BellIcon, FlameIcon, ShieldIcon, UsersIcon } from "@/components/icons";
import { signOut } from "./actions";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, equipped_colour, equipped_anim, is_admin")
    .eq("id", user.id)
    .single();

  const { data: bal } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).maybeSingle();
  const { data: memberships } = await supabase.from("memberships").select("groups(invite_code, name, streak)");
  const groups = (memberships ?? [])
    .map((m) => m.groups as unknown as { invite_code: string; name: string; streak: number } | null)
    .filter((g): g is NonNullable<typeof g> => g !== null);
  const cosmeticsCss = await getCosmeticsCssMap(supabase);

  const username = profile?.username ?? "you";
  const initial = username.slice(0, 1).toUpperCase();

  return (
    <main className="page flex flex-col gap-5">
      <section className="card flex flex-col items-center gap-3 p-6 text-center">
        <div className="ring">
          <div className="ring-inner h-24 w-24">
            <span className="font-display text-4xl font-semibold">{initial}</span>
          </div>
        </div>
        <div className="font-display text-2xl font-semibold">
          <Name
            username={username}
            colourCss={profile?.equipped_colour ? cosmeticsCss[profile.equipped_colour] ?? null : null}
            animClass={profile?.equipped_anim ? ANIM_CLASS[profile.equipped_anim] ?? null : null}
          />
        </div>
        <div className="flex gap-2">
          <span className="chip">
            <span className="num text-sm text-ink">{bal?.balance ?? 0}</span> tokens
          </span>
          <span className="chip">
            <FlameIcon size={14} />
            <span className="num text-sm text-ink">{groups.reduce((m, g) => Math.max(m, g.streak), 0)}</span> best streak
          </span>
        </div>
      </section>

      <section className="card flex flex-col gap-1 p-2">
        <Link href="/shop" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold active:bg-paper-warm">
          <BagIcon size={22} className="text-g3" />
          Shop
        </Link>
        <Link href="/install" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold active:bg-paper-warm">
          <BellIcon size={22} className="text-g3" />
          Install & notifications
        </Link>
        {profile?.is_admin && (
          <Link href="/admin" className="flex items-center gap-3 rounded-2xl px-4 py-3 font-bold active:bg-paper-warm">
            <ShieldIcon size={22} className="text-g3" />
            Admin panel
          </Link>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="px-1 font-display text-lg font-semibold">Your groups</h2>
        {groups.length === 0 && <p className="px-1 text-sm text-ink-2">None yet.</p>}
        {groups.map((g) => (
          <Link key={g.invite_code} href={`/g/${g.invite_code}`} className="card flex items-center gap-3 px-4 py-3 active:bg-paper-warm">
            <UsersIcon size={22} className="text-ink-2" />
            <span className="flex-1 font-bold">{g.name}</span>
            <span className="chip">
              <FlameIcon size={12} />
              {g.streak}
            </span>
          </Link>
        ))}
      </section>

      <form action={signOut}>
        <button type="submit" className="btn-secondary w-full">
          Sign out
        </button>
      </form>
    </main>
  );
}
