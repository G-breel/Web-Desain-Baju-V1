"use client";

import { useRef, type ChangeEvent } from "react";
import { toast } from "sonner";
import { Download, Upload, X } from "lucide-react";
import type { Canvas } from "fabric";
import { Button } from "@/components/ui/button";
import {
  exportCanvasImage,
  exportCanvasJson,
  exportWearFile,
  parseWearFile,
  downloadFile,
  type WearFileData,
} from "@/lib/editor/export-helpers";
import { getMockupSrc } from "@/lib/editor/mockup-helpers";
import { CANVAS_WIDTH, CANVAS_HEIGHT } from "@/lib/editor/constants";
import type { DesignView, ProductType } from "@/types";

interface ExportImportPanelProps {
  fabricRef: React.RefObject<Canvas | null>;
  viewData: Record<DesignView, unknown>;
  activeView: DesignView;
  productType: ProductType;
  shirtColor: string;
  title: string;
  onClose: () => void;
  onImport: (data: WearFileData) => void;
  onImportJson: (canvasJson: unknown) => void;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Gagal load: ${src}`));
    img.src = src;
  });
}

/**
 * Buat canvas export:
 *   Layer 1 — background putih
 *   Layer 2 — warna baju, dimask oleh siluet mockup
 *   Layer 3 — desain dari Fabric (normal)
 *
 * Fabric v7 toCanvasElement() hanya render objek (tanpa backgroundColor),
 * jadi kita composite manual di sini.
 */
async function buildExportCanvas(
  fabricEl: HTMLCanvasElement,
  shirtColor: string,
  mockupSrc: string,
  width: number,
  height: number
): Promise<HTMLCanvasElement> {
  const out = document.createElement("canvas");
  out.width = width;
  out.height = height;
  const ctx = out.getContext("2d")!;

  // Layer 1: background putih
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Layer 2: warna baju dimask oleh siluet mockup
  try {
    const mockup = await loadImg(mockupSrc);

    const shirtLayer = document.createElement("canvas");
    shirtLayer.width = width;
    shirtLayer.height = height;
    const shirtCtx = shirtLayer.getContext("2d")!;

    // Gambar siluet dari mockup dulu, lalu isi warna hanya pada area siluet.
    shirtCtx.drawImage(mockup, 0, 0, width, height);
    shirtCtx.globalCompositeOperation = "source-in";
    shirtCtx.fillStyle = shirtColor;
    shirtCtx.fillRect(0, 0, width, height);
    shirtCtx.globalCompositeOperation = "source-over";

    // Tambah shading halus agar tidak flat.
    const grad = shirtCtx.createLinearGradient(0, 0, width, height);
    grad.addColorStop(0, "rgba(255,255,255,0.16)");
    grad.addColorStop(1, "rgba(0,0,0,0.14)");
    shirtCtx.globalCompositeOperation = "source-atop";
    shirtCtx.fillStyle = grad;
    shirtCtx.fillRect(0, 0, width, height);

    ctx.drawImage(shirtLayer, 0, 0);
  } catch {
    // mockup gagal load — fallback warna penuh agar export tetap jalan
    ctx.fillStyle = shirtColor;
    ctx.fillRect(0, 0, width, height);
  }

  // Layer 3: desain Fabric
  ctx.globalCompositeOperation = "source-over";
  ctx.drawImage(fabricEl, 0, 0, width, height);

  return out;
}

async function exportSingleView(
  canvas: Canvas,
  shirtColor: string,
  productType: ProductType,
  view: DesignView,
  format: "png" | "jpeg",
  quality: number
): Promise<string> {
  const w = canvas.getWidth();
  const h = canvas.getHeight();
  const fabricEl = canvas.toCanvasElement(1);
  const mockupSrc = getMockupSrc(productType, view);
  const result = await buildExportCanvas(fabricEl, shirtColor, mockupSrc, w, h);
  return result.toDataURL(`image/${format}`, quality);
}

async function exportAllViews(
  viewData: Record<DesignView, unknown>,
  shirtColor: string,
  productType: ProductType,
  title: string
): Promise<void> {
  const views: DesignView[] = ["front", "back", "left", "right"];
  const labels: Record<DesignView, string> = {
    front: "Depan",
    back: "Belakang",
    left: "Kiri",
    right: "Kanan",
  };

  const fabric = await import("fabric");

  // Render tiap view
  const viewImages = await Promise.all(
    views.map(async (v) => {
      const el = document.createElement("canvas");
      el.width = CANVAS_WIDTH;
      el.height = CANVAS_HEIGHT;

      const tmp = new fabric.Canvas(el, {
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: "transparent",
        preserveObjectStacking: true,
        enableRetinaScaling: false,
      });

      const json = viewData[v];
      if (json && typeof json === "object" && Object.keys(json).length > 0) {
        await tmp.loadFromJSON(json as unknown as string);
        tmp.renderAll();
      }

      const fabricEl = tmp.toCanvasElement(1);
      tmp.dispose();

      const mockupSrc = getMockupSrc(productType, v);
      const result = await buildExportCanvas(fabricEl, shirtColor, mockupSrc, CANVAS_WIDTH, CANVAS_HEIGHT);
      return result.toDataURL("image/png");
    })
  );

  // Grid 2x2
  const pad = 32;
  const labelH = 36;
  const cellW = CANVAS_WIDTH + pad * 2;
  const cellH = CANVAS_HEIGHT + pad * 2 + labelH;
  const gridW = cellW * 2;
  const gridH = cellH * 2;

  const grid = document.createElement("canvas");
  grid.width = gridW;
  grid.height = gridH;
  const ctx = grid.getContext("2d")!;

  // Background grid
  ctx.fillStyle = "#3f3f46";
  ctx.fillRect(0, 0, gridW, gridH);

  for (let i = 0; i < views.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = col * cellW + pad;
    const y = row * cellH + pad;

    const img = await loadImg(viewImages[i]);
    ctx.drawImage(img, x, y, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Label
    ctx.fillStyle = "#e4e4e7";
    ctx.font = "bold 15px Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(labels[views[i]], x + CANVAS_WIDTH / 2, y + CANVAS_HEIGHT + labelH - 8);
  }

  const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "_");
  downloadFile(grid.toDataURL("image/png"), `${safeName}-all-views.png`);
}

export function ExportImportPanel({
  fabricRef,
  viewData,
  activeView,
  productType,
  shirtColor,
  title,
  onClose,
  onImport,
  onImportJson,
}: ExportImportPanelProps) {
  const wearInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const handleExportPng = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const dataUrl = await exportSingleView(canvas, shirtColor, productType, activeView, "png", 1);
      exportCanvasImage(dataUrl, "png", title, activeView);
    } catch (e) {
      console.error(e);
      toast.error("Gagal export PNG");
    }
  };

  const handleExportJpg = async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const dataUrl = await exportSingleView(canvas, shirtColor, productType, activeView, "jpeg", 0.9);
      exportCanvasImage(dataUrl, "jpg", title, activeView);
    } catch (e) {
      console.error(e);
      toast.error("Gagal export JPG");
    }
  };

  const handleExportAllViews = async () => {
    try {
      toast.info("Membuat export semua view...");
      await exportAllViews(viewData, shirtColor, productType, title);
      toast.success("Export semua view berhasil");
    } catch (e) {
      console.error(e);
      toast.error("Gagal export semua view");
    }
  };

  const handleExportJson = () => {
    try {
      exportCanvasJson(viewData, title);
    } catch {
      toast.error("Gagal export JSON");
    }
  };

  const handleExportWear = () => {
    try {
      exportWearFile(viewData, productType, shirtColor, title);
    } catch {
      toast.error("Gagal export .wear");
    }
  };

  const handleImportWear = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseWearFile(text);
      onImport(data);
      toast.success("Desain berhasil diimport");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal import file .wear");
    } finally {
      e.target.value = "";
    }
  };

  const handleImportJson = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data: unknown = JSON.parse(text);
      onImportJson(data);
      toast.success("Canvas berhasil diimport");
    } catch {
      toast.error("File JSON tidak valid atau rusak");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="absolute right-4 top-16 z-50 w-[19rem] rounded-3xl border border-white/10 bg-zinc-950/95 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-zinc-500">Toolkit</p>
          <h3 className="text-sm font-semibold text-zinc-100">Export / Import</h3>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-white/10 p-1.5 text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Export</p>
          <div className="grid gap-2">
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-violet-300 font-medium" onClick={() => void handleExportAllViews()}>
              <Download className="h-3.5 w-3.5" />
              Export semua view (PNG)
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => void handleExportPng()}>
              <Download className="h-3.5 w-3.5" />
              Export PNG (view aktif)
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={() => void handleExportJpg()}>
              <Download className="h-3.5 w-3.5" />
              Export JPG (view aktif)
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleExportJson}>
              <Download className="h-3.5 w-3.5" />
              Export JSON (semua view)
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleExportWear}>
              <Download className="h-3.5 w-3.5" />
              Export .wear (full project)
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Import</p>
          <div className="grid gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => wearInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Import .wear (full project)
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2"
              onClick={() => jsonInputRef.current?.click()}
            >
              <Upload className="h-3.5 w-3.5" />
              Import JSON (view aktif)
            </Button>
          </div>
        </div>

        <input
          ref={wearInputRef}
          type="file"
          accept=".wear,.json"
          className="hidden"
          onChange={(e) => void handleImportWear(e)}
        />
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={(e) => void handleImportJson(e)}
        />
      </div>
    </div>
  );
}
