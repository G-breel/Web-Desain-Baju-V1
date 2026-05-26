import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getUserProfile } from "@/lib/auth/session";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await getUserProfile();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const displayName = user.username ?? user.email.split("@")[0];
  const { q } = await searchParams;
  const query = (q ?? "").trim();

  const supabase = await createClient();
  const designsQuery = supabase
    .from("designs")
    .select("id, title, product_type, thumbnail_url, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(24);

  const { data: designs } = query
    ? await designsQuery.ilike("title", `%${query}%`)
    : await designsQuery;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">
            Halo, {displayName} 👋
          </h1>
          <p className="mt-2 text-zinc-400">
            Kelola proyek desain baju kamu di sini.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Desain Baru
        </Link>
      </div>

      <DashboardClient designs={designs ?? []} initialQuery={query} />
    </div>
  );
}
