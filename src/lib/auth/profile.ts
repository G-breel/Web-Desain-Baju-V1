import { createClient } from "@/lib/supabase/server";

export async function upsertProfile(
  userId: string,
  data: { username?: string; avatar_url?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      ...data,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  return { error: error?.message ?? null };
}

export async function ensureProfile(userId: string, email: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (existing) {
    return { error: null };
  }

  const username = email.split("@")[0];

  return upsertProfile(userId, { username });
}
