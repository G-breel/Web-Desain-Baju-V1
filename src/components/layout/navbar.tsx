"use client";

import Link from "next/link";
import { Shirt } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/products", label: "Produk" },
  { href: "/designs", label: "Desain Saya" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-zinc-50 transition-opacity hover:opacity-80"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600/20 text-violet-400">
            <Shirt className="h-5 w-5" />
          </span>
          <span className="hidden sm:inline">Desain Baju</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="inline-flex h-8 items-center justify-center rounded-lg px-3 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Masuk
          </Link>
          <Link
            href="/register"
            className="inline-flex h-8 items-center justify-center rounded-lg bg-violet-600 px-4 text-sm font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
          >
            Daftar
          </Link>
        </div>
      </nav>
    </header>
  );
}
