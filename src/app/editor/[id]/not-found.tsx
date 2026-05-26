import Link from "next/link";

export default function EditorNotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="text-2xl font-bold text-zinc-50">Desain tidak ditemukan</h1>
      <p className="mt-2 text-zinc-400">
        Proyek tidak ada atau bukan milik akun kamu.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-medium text-white hover:bg-violet-500"
      >
        Kembali ke Dashboard
      </Link>
    </div>
  );
}
