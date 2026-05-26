import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Desain Saya" };

export default async function DesignsPage() {
  const user = await getUserProfile();
  if (!user) {
    redirect("/login?redirectTo=/designs");
  }

  const supabase = await createClient();
  const { data: designs } = await supabase
    .from("designs")
    .select("id, title, product_type, updated_at, created_at")
    .order("updated_at", { ascending: false })
    .limit(48);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-50">Desain Saya</h1>
        <p className="mt-2 text-zinc-400">Daftar semua proyek desainmu.</p>
      </div>

      {!designs?.length ? (
        <Card className="border-dashed">
          <CardTitle>Belum ada desain</CardTitle>
          <CardDescription className="mt-2">
            Buat desain pertama dari halaman produk.
          </CardDescription>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-violet-400 hover:text-violet-300"
          >
            Mulai dari produk →
          </Link>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {designs.map((d) => (
            <Card key={d.id}>
              <CardTitle className="line-clamp-2">{d.title}</CardTitle>
              <CardDescription className="mt-2">
                {d.product_type === "hoodie" ? "Hoodie" : "Oversize T-Shirt"} ·{" "}
                Update: {new Date(d.updated_at ?? d.created_at).toLocaleString()}
              </CardDescription>
              <Link
                href={`/editor/${d.id}`}
                className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-xl bg-violet-600 px-4 text-sm font-medium text-white hover:bg-violet-500"
              >
                Buka editor
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
