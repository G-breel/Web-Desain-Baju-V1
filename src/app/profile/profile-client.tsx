"use client";

import { useState, useRef, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, Check, Pencil, X } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateProfileAction, uploadAvatarAction } from "@/app/actions/profile";
import type { UserProfile } from "@/types";

interface ProfileClientProps {
  user: UserProfile;
  designCount: number;
}

export function ProfileClient({ user, designCount }: ProfileClientProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user.username ?? "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatar_url ?? "");
  const [isPending, startTransition] = useTransition();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const displayName = user.username ?? user.email.split("@")[0];

  const handleSaveUsername = () => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("username", username);
      const result = await updateProfileAction({ }, fd);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Username berhasil diperbarui");
        setIsEditing(false);
      }
    });
  };

  const handleCancelEdit = () => {
    setUsername(user.username ?? "");
    setIsEditing(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview lokal
    const localUrl = URL.createObjectURL(file);
    setAvatarUrl(localUrl);

    const fd = new FormData();
    fd.append("avatar", file);
    const result = await uploadAvatarAction(fd);

    if (result.error) {
      toast.error(result.error);
      setAvatarUrl(user.avatar_url ?? "");
    } else if (result.avatarUrl) {
      setAvatarUrl(result.avatarUrl);
      toast.success("Avatar berhasil diperbarui");
    }

    URL.revokeObjectURL(localUrl);
    e.target.value = "";
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="mb-8 text-3xl font-bold text-zinc-50">Profil</h1>

      <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-6">
        {/* Avatar & Info */}
        <div className="flex items-start gap-5">
          <div className="relative">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt="Avatar"
                width={72}
                height={72}
                className="h-18 w-18 rounded-2xl object-cover"
              />
            ) : (
              <span className="flex h-[72px] w-[72px] items-center justify-center rounded-2xl bg-violet-600/20 text-2xl font-semibold text-violet-300">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
              title="Ganti avatar"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => void handleAvatarChange(e)}
            />
          </div>

          <div className="min-w-0 flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username baru"
                  className="h-9 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveUsername();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={isPending}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-zinc-400 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-zinc-100">{displayName}</h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="rounded-lg p-1 text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                  title="Edit username"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            <p className="mt-1 text-sm text-zinc-500">{user.email}</p>
            {user.username && !isEditing && (
              <p className="mt-0.5 text-xs text-zinc-600">@{user.username}</p>
            )}
          </div>
        </div>

        {/* Statistik */}
        <div className="mt-6 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-violet-400">{designCount}</p>
            <p className="text-xs text-zinc-500">Total Desain</p>
          </div>
          <div className="text-center">
            <Link
              href="/designs"
              className="text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Lihat semua →
            </Link>
          </div>
        </div>

        {/* Settings */}
        <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
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
      </div>
    </div>
  );
}
