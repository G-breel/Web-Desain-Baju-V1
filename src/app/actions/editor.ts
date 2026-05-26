"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DesignView } from "@/types";

export async function saveCanvasAction(
  designId: string,
  canvasData: Record<DesignView, unknown>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("designs")
    .update({
      canvas_data: canvasData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", designId)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/designs");
  revalidatePath(`/editor/${designId}`);
  return { success: true };
}
