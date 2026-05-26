import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Desain Saya" };

export default function DesignsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardTitle>Desain Saya</CardTitle>
        <CardDescription className="mt-2">Phase 14.</CardDescription>
      </Card>
    </div>
  );
}
