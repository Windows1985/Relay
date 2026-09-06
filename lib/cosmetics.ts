import type { SupabaseClient } from "@supabase/supabase-js";

export const ANIM_CLASS: Record<string, string> = {
  anim_pop: "entry-pop",
  anim_fade_up: "entry-fade-up",
  anim_slide_in: "entry-slide-in",
  anim_shake: "entry-shake",
  anim_typewriter: "entry-typewriter",
};

export type CosmeticCss = {
  color?: string;
  gradient?: [string, string];
  rainbow?: boolean;
  chrome?: boolean;
  glitch?: boolean;
  glow?: boolean;
};

// Fetches the full cosmetics catalog and returns a lookup from cosmetic id
// to its css — shared by any screen that renders other people's names.
export async function getCosmeticsCssMap(
  supabase: SupabaseClient,
): Promise<Record<string, CosmeticCss>> {
  const { data } = await supabase.from("cosmetics").select("id, css");
  const map: Record<string, CosmeticCss> = {};
  for (const row of data ?? []) map[row.id as string] = row.css as CosmeticCss;
  return map;
}
