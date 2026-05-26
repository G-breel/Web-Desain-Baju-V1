"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function safeTitle(input: unknown) {
  const t = String(input ?? "").trim();
  return t.length ? t.slice(0, 80) : "Untitled";
}

function safeProductType(input: unknown) {
  const t = String(input ?? "");
  return t === "hoodie" ? "hoodie" : "oversize-tshirt";
}

export async function createDesignAction(formData: FormData) {
  const productType = safeProductType(formData.get("product_type"));
  const title = safeTitle(formData.get("title"));

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/products");
  }

  const { data, error } = await supabase
    .from("designs")
    .insert({
      user_id: user.id,
      title,
      product_type: productType,
      canvas_data: {},
    })
    .select("id")
    .single();

  if (error || !data?.id) {
    throw new Error(error?.message ?? "Gagal membuat desain.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/designs");
  redirect(`/editor/${data.id}`);
}

export async function renameDesignAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const title = safeTitle(formData.get("title"));

  const supabase = await createClient();
  const { error } = await supabase
    .from("designs")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/designs");
}

export async function deleteDesignAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const { error } = await supabase.from("designs").delete().eq("id", id);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  revalidatePath("/designs");
}

export async function duplicateDesignAction(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: existing, error: readError } = await supabase
    .from("designs")
    .select("title, product_type, thumbnail_url, canvas_data")
    .eq("id", id)
    .single();

  if (readError || !existing) {
    throw new Error(readError?.message ?? "Gagal membaca desain.");
  }

  const { data: created, error: createError } = await supabase
    .from("designs")
    .insert({
      user_id: user.id,
      title: `${existing.title} (copy)`.slice(0, 80),
      product_type: existing.product_type,
      thumbnail_url: existing.thumbnail_url,
      canvas_data: existing.canvas_data ?? {},
    })
    .select("id")
    .single();

  if (createError || !created?.id) {
    throw new Error(createError?.message ?? "Gagal menduplikasi desain.");
  }

  revalidatePath("/dashboard");
  revalidatePath("/designs");
  redirect(`/editor/${created.id}`);
}

