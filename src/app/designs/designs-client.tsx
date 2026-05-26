"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Search, Trash2, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { deleteDesignAction, duplicateDesignAction } from "@/app/actions/designs";
import { filterDesigns, sortDesigns } from "@/lib/utils/validation";
import { DesignCardSkeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

type Design = {
  id: string;
  title: string;
  product_type: string;
  thumbnail_url?: string | null;
  updated_at?: string | null;
  created_at: string;
};

type SortOption = "newest" | "oldest" | "name-asc" | "name-desc";

export function DesignsClient({ designs: initialDesigns }: { designs: Design[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("newest");
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = sortDesigns(filterDesigns(initialDesigns, query), sort);

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      try {
        await deleteDesignAction(fd);
        toast.success("Desain dihapus");
      } catch {
        toast.error("Gagal menghapus desain");
      }
      setDeleteConfirmId(null);
    });
  };

  const handleDuplicate = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      try {
        await duplicateDesignAction(fd);
        toast.success("Desain diduplikasi");
      } catch {
        toast.error("Gagal menduplikasi desain");
      }
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-50">Desain Saya</h1>
          <p className="mt-2 text-zinc-400">
            {initialDesigns.length} desain tersimpan
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
        >
          <Plus className="h-4 w-4" />
          Desain Baru
        </Link>
      </div>

      {/* Search & Sort */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            placeholder="Cari desain..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortOption)}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="name-asc">Nama A–Z</option>
          <option value="name-desc">Nama Z–A</option>
        </select>
      </div>

      {/* Loading skeleton */}
      {isPending && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => <DesignCardSkeleton key={i} />)}
        </div>
      )}

      {/* Empty state */}
      {!isPending && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 text-center">
          <div className="mb-4 text-5xl">🎨</div>
          <h3 className="text-lg font-semibold text-zinc-200">
            {query ? "Tidak ada hasil" : "Belum ada desain"}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            {query
              ? "Coba kata kunci lain."
              : "Mulai buat desain pertama kamu sekarang."}
          </p>
          {!query && (
            <Link
              href="/products"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-500"
            >
              <Plus className="h-4 w-4" />
              Buat Desain
            </Link>
          )}
        </div>
      )}

      {/* Grid */}
      {!isPending && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((d) => (
            <div
              key={d.id}
              className="group flex flex-col rounded-2xl border border-white/10 bg-zinc-900/50 p-4 transition-all duration-200 hover:scale-[1.01] hover:border-white/20 hover:shadow-xl"
            >
              {/* Thumbnail */}
              <div className="mb-3 overflow-hidden rounded-xl bg-zinc-800">
                {d.thumbnail_url ? (
                  <Image
                    src={d.thumbnail_url}
                    alt={d.title}
                    width={400}
                    height={240}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-40 items-center justify-center text-4xl text-zinc-600">
                    👕
                  </div>
                )}
              </div>

              {/* Info */}
              <h3 className="line-clamp-2 font-semibold text-zinc-100">{d.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {d.product_type === "hoodie" ? "Hoodie" : "Oversize T-Shirt"} ·{" "}
                {new Date(d.updated_at ?? d.created_at).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/editor/${d.id}`}
                  className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-3 text-sm font-medium text-white hover:bg-violet-500"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Buka
                </Link>
                <button
                  type="button"
                  onClick={() => handleDuplicate(d.id)}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 hover:bg-white/10"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                {deleteConfirmId === d.id ? (
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(d.id)}
                      className="inline-flex h-9 items-center rounded-xl bg-red-600 px-3 text-xs font-medium text-white hover:bg-red-500"
                    >
                      Hapus?
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="inline-flex h-9 items-center rounded-xl border border-white/10 px-2 text-xs text-zinc-400 hover:bg-white/5"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(d.id)}
                    className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
