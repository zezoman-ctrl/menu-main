import { createClient } from "@supabase/supabase-js";

// The anon key is safe to expose. Security comes from the RLS policies in schema.sql.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Loads one menu with its categories and items, sorted. Returns null if none found.
// No filter = the first menu. { slug } = a specific menu. { ownerId } = the admin's own menu.
export async function fetchMenu({ slug, ownerId } = {}) {
  let q = supabase.from("menus").select("*, categories(*, items(*))");
  if (slug) q = q.eq("slug", slug);
  if (ownerId) q = q.eq("owner_id", ownerId);
  const { data, error } = await q.order("created_at").limit(1).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const byPosition = (a, b) => a.position - b.position || a.id - b.id;
  data.categories.sort(byPosition).forEach((c) => c.items.sort(byPosition));
  return data;
}