import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Pilih Produk" };

export default function ProductsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-zinc-50">Pilih Produk</h1>
      <div className="grid gap-6 sm:grid-cols-2">
        <Card>
          <CardTitle>Oversize T-Shirt</CardTitle>
          <CardDescription className="mt-2">Phase 5</CardDescription>
        </Card>
        <Card>
          <CardTitle>Hoodie</CardTitle>
          <CardDescription className="mt-2">Phase 5</CardDescription>
        </Card>
      </div>
    </div>
  );
}
