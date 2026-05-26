import { PageLoadingSkeleton } from "@/components/ui/loading-skeleton";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <Card className="mb-8">
        <CardTitle>Dashboard</CardTitle>
        <CardDescription className="mt-2">
          Proyek desain terbaru — Phase 4.
        </CardDescription>
      </Card>
      <PageLoadingSkeleton />
    </div>
  );
}
