import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Masuk" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col justify-center px-4 py-16">
      <Card>
        <CardTitle>Masuk</CardTitle>
        <CardDescription className="mt-2">
          Halaman login — Phase 2.
        </CardDescription>
      </Card>
    </div>
  );
}
