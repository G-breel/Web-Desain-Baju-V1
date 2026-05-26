import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ProfileClient } from "./profile-client";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("designs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  return <ProfileClient user={user} designCount={count ?? 0} />;
}
