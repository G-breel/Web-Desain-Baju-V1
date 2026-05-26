import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/types";

export async function getAuthUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getUserProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? "",
    username: profile?.username ?? user.user_metadata?.username ?? undefined,
    avatar_url: profile?.avatar_url ?? user.user_metadata?.avatar_url ?? undefined,
  };
}
