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

export async function saveThumbnailAction(
  designId: string,
  dataUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { success: false, error: "Unauthorized" };

    // Konversi data URL ke Blob
    const base64 = dataUrl.split(",")[1];
    if (!base64) return { success: false, error: "Invalid data URL" };

    const binary = Buffer.from(base64, "base64");
    const path = `${user.id}/${designId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("thumbnails")
      .upload(path, binary, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (uploadError) return { success: false, error: uploadError.message };

    const { data: urlData } = supabase.storage
      .from("thumbnails")
      .getPublicUrl(path);

    await supabase
      .from("designs")
      .update({ thumbnail_url: urlData.publicUrl })
      .eq("id", designId)
      .eq("user_id", user.id);

    return { success: true };
  } catch {
    return { success: false, error: "Thumbnail upload failed" };
  }
}
