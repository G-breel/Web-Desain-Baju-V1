import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardTitle>Daftar</CardTitle>
        <CardDescription className="mt-2">
          Halaman register — Phase 2.
        </CardDescription>
      </Card>
    </div>
  );
}
