"use client";

import Link from "next/link";
import { User } from "lucide-react";
import type { UserProfile } from "@/types";
import { LogoutButton } from "@/components/auth/logout-button";

export function UserMenu({ user }: { user: UserProfile }) {
  const displayName = user.username ?? user.email.split("@")[0];

  return (
    <div className="group relative">
      <button
        type="button"
        className="flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm text-zinc-200 transition-colors hover:bg-white/10"
        aria-haspopup="true"
      >
        {user.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatar_url}
            alt=""
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600/30 text-xs font-medium text-violet-300">
            {displayName.charAt(0).toUpperCase()}
          </span>
        )}
        <span className="hidden max-w-[100px] truncate sm:inline">
          {displayName}
        </span>
      </button>

      <div className="invisible absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-white/10 bg-zinc-900/95 p-2 opacity-0 shadow-xl backdrop-blur-xl transition-all group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
        <p className="truncate px-3 py-2 text-xs text-zinc-500">{user.email}</p>
        <Link
          href="/profile"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 hover:bg-white/5 hover:text-white"
        >
          <User className="h-4 w-4" />
          Profil
        </Link>
        <LogoutButton />
      </div>
    </div>
  );
}
