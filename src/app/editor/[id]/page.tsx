import { redirect, notFound } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { DesignEditor } from "@/components/editor/design-editor";
import type { DesignProject } from "@/types";

export const metadata = { title: "Editor" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserProfile();
  if (!user) {
    redirect("/login?redirectTo=/editor");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: design, error } = await supabase
    .from("designs")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !design) {
    notFound();
  }

  return <DesignEditor design={design as DesignProject} />;
}
