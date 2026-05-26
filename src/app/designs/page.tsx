import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DesignsClient } from "./designs-client";

export const metadata = { title: "Desain Saya" };

export default async function DesignsPage() {
  const user = await getUserProfile();
  if (!user) {
    redirect("/login?redirectTo=/designs");
  }

  const supabase = await createClient();
  const { data: designs } = await supabase
    .from("designs")
    .select("id, title, product_type, thumbnail_url, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(96);

  return <DesignsClient designs={designs ?? []} />;
}
