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
  const ownedIds = new Set((owned ?? []).map((o) => o.cosmetic_id));

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, equipped_colour, equipped_anim")
    .eq("id", user.id)
    .single();

  const { data: bal } = await supabase.from("token_balances").select("balance").eq("user_id", user.id).maybeSingle();

  return (
    <main className="flex flex-1 flex-col items-center gap-4 p-6">
      <div className="bezel flex w-full max-w-sm flex-col items-center gap-1 px-6 py-6">
        <h1 className="font-mono led-text text-xl font-bold uppercase tracking-widest">Shop</h1>
        <p className="font-mono text-2xl font-bold tabular-nums text-ink">{bal?.balance ?? 0}</p>
        <p className="text-xs text-ink-dim uppercase tracking-widest">tokens</p>
      </div>

      <ShopList
        cosmetics={cosmetics ?? []}
        ownedIds={[...ownedIds]}
        equippedColour={profile?.equipped_colour ?? null}
        equippedAnim={profile?.equipped_anim ?? null}
        username={profile?.username ?? "you"}
        balance={bal?.balance ?? 0}
      />
    </main>
  );
}
