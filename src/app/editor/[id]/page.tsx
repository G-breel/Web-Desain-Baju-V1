import { redirect } from "next/navigation";
import Link from "next/link";
import { getUserProfile } from "@/lib/auth/session";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Editor" };

export default async function EditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUserProfile();
  if (!user) {
    redirect("/login?redirectTo=/editor");
  }

  const { id } = await params;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Card>
        <CardTitle>Editor</CardTitle>
        <CardDescription className="mt-2">
          Project ID: <span className="font-mono">{id}</span>
        </CardDescription>
        <p className="mt-6 text-sm text-zinc-400">
          Editor Fabric.js + multi-view akan dibangun di Milestone 2 (Phase 6–7).
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-zinc-200 hover:bg-white/10"
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </Card>
    </div>
  );
}

