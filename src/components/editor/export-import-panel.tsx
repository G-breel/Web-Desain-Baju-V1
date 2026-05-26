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
  type WearFileData,
} from "@/lib/editor/export-helpers";
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

  const handleExportPng = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({ format: "png", multiplier: 1 });
      exportCanvasImage(dataUrl, "png", title, activeView);
    } catch {
      toast.error("Gagal export PNG");
    }
  };

  const handleExportJpg = () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL({ format: "jpeg", quality: 0.9, multiplier: 1 });
      exportCanvasImage(dataUrl, "jpg", title, activeView);
    } catch {
      toast.error("Gagal export JPG");
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
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleExportPng}>
          <Download className="h-3.5 w-3.5" />
          Export PNG (view aktif)
            </Button>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-2" onClick={handleExportJpg}>
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
