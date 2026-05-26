import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserProfile } from "@/lib/auth/session";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export const metadata = { title: "Profil" };

export default async function ProfilePage() {
  const user = await getUserProfile();

  if (!user) {
    redirect("/login?redirectTo=/profile");
  }

  const displayName = user.username ?? user.email.split("@")[0];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-zinc-50">Profil</h1>

      <Card>
        <div className="flex items-start gap-4">
          {user.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatar_url}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600/20 text-2xl font-semibold text-violet-300">
              {displayName.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <CardTitle>{displayName}</CardTitle>
            <CardDescription className="mt-1">{user.email}</CardDescription>
            {user.username && (
              <p className="mt-2 text-sm text-zinc-500">@{user.username}</p>
            )}
          </div>
        </div>

        <div className="mt-8 space-y-4 border-t border-white/10 pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Tema</p>
              <p className="text-xs text-zinc-500">Ubah light / dark mode</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-200">Dashboard</p>
              <p className="text-xs text-zinc-500">Kelola proyek desain</p>
            </div>
            <Link
              href="/dashboard"
              className="text-sm text-violet-400 hover:text-violet-300"
            >
              Buka →
            </Link>
          </div>

          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>
      </Card>
    </div>
  );
}
