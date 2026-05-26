"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Layers, Palette, Shirt, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Shirt,
    title: "Multi View",
    description: "Desain depan, belakang, kiri, dan kanan dalam satu proyek.",
  },
  {
    icon: Palette,
    title: "Editor Modern",
    description: "Canvas Fabric.js dengan tools lengkap seperti Canva & Figma.",
  },
  {
    icon: Layers,
    title: "Export & Import",
    description: "Simpan proyek, export PNG/JPG, dan bagikan file .wear.",
  },
];

export default function HomePage() {
  return (
    <div className="mesh-gradient relative overflow-hidden">
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-3xl text-center"
        >
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
            <Sparkles className="h-4 w-4" />
            Gratis — tanpa checkout
          </span>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-50 sm:text-6xl">
            Desain baju impianmu{" "}
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              dalam menit
            </span>
          </h1>
          <p className="mt-6 text-lg text-zinc-400">
            Editor 2D multi-view untuk kaos oversize & hoodie. Upload gambar,
            tambah teks, dan export desainmu — semuanya di browser.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 text-base font-medium text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
            >
              Mulai Desain
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button
              variant="secondary"
              size="lg"
              onClick={() =>
                toast.success("Selamat datang!", {
                  description: "Setup Phase 1 selesai. Lanjut ke auth & editor.",
                })
              }
            >
              Coba Notifikasi
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-20 grid gap-6 sm:grid-cols-3"
        >
          {features.map((feature) => (
            <Card key={feature.title} className="text-left">
              <feature.icon className="mb-4 h-8 w-8 text-violet-400" />
              <CardTitle>{feature.title}</CardTitle>
              <CardDescription className="mt-2">
                {feature.description}
              </CardDescription>
            </Card>
          ))}
        </motion.div>
      </section>
    </div>
  );
}
