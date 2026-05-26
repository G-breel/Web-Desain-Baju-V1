"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Pencil, Trash2, X } from "lucide-react";
import {
  deleteDesignAction,
  duplicateDesignAction,
  renameDesignAction,
} from "@/app/actions/designs";
import { Input } from "@/components/ui/input";
import { DesignCardSkeleton } from "@/components/ui/skeleton";
import { validateTitle } from "@/lib/utils/validation";

type Design = {
  id: string;
  title: string;
  product_type: string;
  thumbnail_url?: string | null;
  updated_at?: string | null;
  created_at: string;
};

export function DashboardClient({
  designs: initialDesigns,
  initialQuery,
}: {
  designs: Design[];
  initialQuery: string;
}) {
  const [designs, setDesigns] = useState(initialDesigns);
  const [query, setQuery] = useState(initialQuery);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const renameInputRef = useRef<HTMLInputElement>(null);

  const filtered = query
    ? designs.filter((d) => d.title.toLowerCase().includes(query.toLowerCase()))
    : designs;

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      try {
        await deleteDesignAction(fd);
        setDesigns((prev) => prev.filter((d) => d.id !== id));
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

  const startRename = (design: Design) => {
    setRenamingId(design.id);
    setRenameValue(design.title);
    setTimeout(() => renameInputRef.current?.focus(), 50);
  };

  const commitRename = (id: string) => {
    if (!validateTitle(renameValue)) {
      // Batalkan jika kosong
      setRenamingId(null);
      return;
    }
    startTransition(async () => {
      const fd = new FormData();
      fd.append("id", id);
      fd.append("title", renameValue.trim());
      try {
        await renameDesignAction(fd);
        setDesigns((prev) =>
          prev.map((d) => (d.id === id ? { ...d, title: renameValue.trim() } : d))
        );
        toast.success("Nama diperbarui");
      } catch {
        toast.error("Gagal mengubah nama");
      }
      setRenamingId(null);
    });
  };

  return (
    <>
      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Cari proyek..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </div>

      {/* Loading */}
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
            {query ? "Tidak ada hasil" : "Belum ada proyek"}
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            {query ? "Coba kata kunci lain." : "Pilih produk dan mulai desain pertama kamu."}
          </p>
          {!query && (
            <Link
              href="/products"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-500"
            >
              Pilih produk →
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
                    height={160}
                    className="h-36 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-36 items-center justify-center text-4xl text-zinc-600">
                    👕
                  </div>
                )}
              </div>

              {/* Title — rename inline */}
              {renamingId === d.id ? (
                <div className="mb-1 flex items-center gap-1.5">
                  <input
                    ref={renameInputRef}
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(d.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onBlur={() => commitRename(d.id)}
                    className="flex-1 rounded-lg border border-violet-500 bg-zinc-800 px-2 py-1 text-sm text-zinc-100 focus:outline-none"
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); commitRename(d.id); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 text-white"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setRenamingId(null); }}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-zinc-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mb-1 flex items-center gap-1.5">
                  <h3 className="line-clamp-1 flex-1 font-semibold text-zinc-100">{d.title}</h3>
                  <button
                    type="button"
                    onClick={() => startRename(d)}
                    className="rounded-lg p-1 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:text-zinc-300"
                    title="Rename"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              <p className="text-xs text-zinc-500">
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
                  title="Duplikat"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-zinc-200 hover:bg-white/10"
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
                    title="Hapus"
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
    </>
  );
}
