import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { createDesignAction } from "@/app/actions/designs";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Pilih Produk" };

function ProductCard({
  title,
  description,
  productType,
}: {
  title: string;
  description: string;
  productType: "oversize-tshirt" | "hoodie";
}) {
  return (
    <Card className="flex flex-col">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mt-2">{description}</CardDescription>

      <form action={createDesignAction} className="mt-6">
        <input type="hidden" name="product_type" value={productType} />
        <input
          type="hidden"
          name="title"
          value={`${title} Design`}
        />
        <button
          type="submit"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
        >
          Mulai Desain
        </button>
      </form>
    </Card>
  );
}

export default async function ProductsPage() {
  const user = await getUserProfile();
  if (!user) {
    redirect("/login?redirectTo=/products");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-zinc-50">Pilih Produk</h1>
      <p className="mb-8 text-zinc-400">
        Pilih mockup, lalu mulai desain. Nanti bisa multi-view (front/back/left/right).
      </p>
      <div className="grid gap-6 sm:grid-cols-2">
        <ProductCard
          title="Oversize T-Shirt"
          description="Mockup kaos oversize modern. Cocok untuk streetwear."
          productType="oversize-tshirt"
        />
        <ProductCard
          title="Hoodie"
          description="Mockup hoodie cozy. Cocok untuk desain minimal & bold."
          productType="hoodie"
        />
      </div>
    </div>
  );
}
