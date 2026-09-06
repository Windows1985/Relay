import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ShopList } from "./shop-list";

export default async function ShopPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/join");

  const { data: cosmetics } = await supabase
    .from("cosmetics")
    .select("id, kind, price, streak_gate, css")
    .order("kind")
    .order("price", { nullsFirst: false });

  const { data: owned } = await supabase.from("owned_cosmetics").select("cosmetic_id").eq("user_id", user.id);
  const { data: profile } = await supabase
    .from("profiles")
    .select("username, equipped_colour, equipped_anim, is_admin")
    .eq("id", user.id)
    .single();
  const { data: bal } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).maybeSingle();

  return (
    <main className="page flex flex-col gap-5">
      <header className="flex items-center justify-between py-1">
        <h1 className="font-display text-2xl font-bold">Shop</h1>
        <span className="badge-sunset">
          <span className="num">{bal?.balance ?? 0}</span> tokens
        </span>
      </header>

      <ShopList
        cosmetics={cosmetics ?? []}
        ownedIds={(owned ?? []).map((o) => o.cosmetic_id)}
        equippedColour={profile?.equipped_colour ?? null}
        equippedAnim={profile?.equipped_anim ?? null}
        username={profile?.username ?? "you"}
        balance={bal?.balance ?? 0}
        isAdmin={!!profile?.is_admin}
      />
    </main>
  );
}
