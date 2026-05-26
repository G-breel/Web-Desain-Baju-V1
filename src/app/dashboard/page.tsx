import { redirect } from "next/navigation";
import { Plus } from "lucide-react";
import { getUserProfile } from "@/lib/auth/session";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  deleteDesignAction,
  duplicateDesignAction,
} from "@/app/actions/designs";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
        <Link href="/products" className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500">
            <Plus className="h-4 w-4" />
            Desain Baru
          </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <CardTitle>Proyek Terbaru</CardTitle>
              <CardDescription className="mt-2">
                Buat, duplikasi, atau hapus proyek desainmu.
              </CardDescription>
            </div>
            <form action="/dashboard" className="w-full sm:w-80">
              <Input
                name="q"
                defaultValue={query}
                placeholder="Cari proyek..."
              />
            </form>
          </div>
        </Card>
      </div>

      {!designs?.length ? (
        <Card className="border-dashed">
          <CardTitle>
            {query ? "Tidak ada hasil" : "Belum ada proyek"}
          </CardTitle>
          <CardDescription className="mt-2">
            {query
              ? "Coba kata kunci lain."
              : "Pilih produk dan mulai desain pertama kamu."}
          </CardDescription>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Pilih produk →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <Card key={d.id} className="flex flex-col">
              <CardTitle className="line-clamp-2">{d.title}</CardTitle>
              <CardDescription className="mt-2">
                {d.product_type === "hoodie" ? "Hoodie" : "Oversize T-Shirt"} ·{" "}
                Update: {new Date(d.updated_at ?? d.created_at).toLocaleString()}
              </CardDescription>

              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href={`/editor/${d.id}`}
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
                >
                  Buka
                </Link>
                <form action={duplicateDesignAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-zinc-200 hover:bg-white/10"
                  >
                    Duplikat
                  </button>
                </form>
                <form action={deleteDesignAction}>
                  <input type="hidden" name="id" value={d.id} />
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm text-red-300 hover:bg-red-500/10 hover:text-red-200"
                  >
                    Hapus
                  </button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
