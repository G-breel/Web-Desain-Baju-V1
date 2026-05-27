"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Download,
  ImagePlus,
  Lock,
  Redo2,
  Ruler,
  Save,
  Trash2,
  Type,
  Undo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import type { Canvas, FabricImage } from "fabric";
import { saveCanvasAction, saveThumbnailAction } from "@/app/actions/editor";
import {
  PropertiesPanel,
  readObjectProps,
  type ObjectProps,
} from "@/components/editor/properties-panel";
import { ViewTabs } from "@/components/editor/view-tabs";
import { ViewThumbnails } from "@/components/editor/view-thumbnails";
import { ExportImportPanel } from "@/components/editor/export-import-panel";
import { EditorStage } from "@/components/editor/editor-stage";
import { LayersPanel } from "@/components/editor/layers-panel";
import {
  applyFabricEditorDefaults,
  ensureAllObjectsInteractive,
  FABRIC_CANVAS_OPTIONS,
  refreshCanvasLayout,
} from "@/lib/editor/fabric-canvas-setup";
import type { WearFileData } from "@/lib/editor/export-helpers";
import { Button } from "@/components/ui/button";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  DEFAULT_SHIRT_COLOR,
  SHIRT_COLOR_PRESETS,
} from "@/lib/editor/constants";
import { snapObjectToGuides, constrainToPrintArea, snapToCenter } from "@/lib/editor/fabric-helpers";
import {
  applyImageCrop,
  cancelImageCrop,
  startImageCrop,
  type CropSession,
} from "@/lib/editor/image-crop";
import { getPrintArea } from "@/lib/editor/mockup-helpers";
import type { DesignProject, DesignView } from "@/types";

type CanvasJson = Record<string, unknown>;

function parseCanvasData(
  raw: DesignProject["canvas_data"]
): Record<DesignView, CanvasJson | null> {
  const views: DesignView[] = ["front", "back", "left", "right"];
  const result = {} as Record<DesignView, CanvasJson | null>;
  const data = (raw ?? {}) as Record<string, CanvasJson | null>;
  for (const v of views) {
    result[v] = data[v] ?? null;
  }
  return result;
}

function extractShirtColor(raw: DesignProject["canvas_data"]): string {
  const data = (raw ?? {}) as Record<string, unknown>;
  const meta = data._meta as Record<string, unknown> | undefined;
  return typeof meta?.shirtColor === "string" ? meta.shirtColor : DEFAULT_SHIRT_COLOR;
}

export function DesignEditor({ design }: { design: DesignProject }) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const viewDataRef = useRef(parseCanvasData(design.canvas_data));
  const historyRef = useRef<Record<DesignView, CanvasJson[]>>({
    front: [],
    back: [],
    left: [],
    right: [],
  });
  const historyIndexRef = useRef<Record<DesignView, number>>({
    front: -1,
    back: -1,
    left: -1,
    right: -1,
  });
  const switchingRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thumbTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panningRef = useRef(false);
  const panLastRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  const cropSessionRef = useRef<CropSession | null>(null);
  // Ref untuk activeView agar event listener canvas selalu dapat nilai terbaru
  const activeViewRef = useRef<DesignView>("front");

  const [activeView, setActiveView] = useState<DesignView>("front");
  // Selalu sync ref dengan state agar event listener canvas dapat nilai terbaru
  activeViewRef.current = activeView;
  const [shirtColor, setShirtColor] = useState(extractShirtColor(design.canvas_data));
  const shirtColorRef = useRef(shirtColor);
  shirtColorRef.current = shirtColor; // selalu sync
  const [viewThumbnails, setViewThumbnails] = useState<Partial<Record<DesignView, string>>>({});
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">(
    "saved"
  );
  const [zoom, setZoom] = useState(1);
  const [objectProps, setObjectProps] = useState<ObjectProps>({ kind: "none" });
  const [showPrintArea, setShowPrintArea] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [cropActive, setCropActive] = useState(false);
  const [isOutside, setIsOutside] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [snapGuides, setSnapGuides] = useState<{ x: boolean; y: boolean; nearX: boolean; nearY: boolean }>({ x: false, y: false, nearX: false, nearY: false });

  const productLabel =
    design.product_type === "hoodie" ? "Hoodie" : "Oversize T-Shirt";
  const activeViewLabel: Record<DesignView, string> = {
    front: "Depan",
    back: "Belakang",
    left: "Kiri",
    right: "Kanan",
  };

  const syncSelection = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject() ?? null;
    setObjectProps(readObjectProps(obj));
  }, []);

  // Helper function to check if object is outside print area
  const checkCollision = useCallback((canvas: Canvas, view: DesignView): boolean => {
    const obj = canvas.getActiveObject();
    if (!obj) return false;
    
    const printArea = getPrintArea(view);
    const objBounds = obj.getBoundingRect();
    
    // Check if object is completely or partially outside print area
    const isOutside = 
      objBounds.left < printArea.left ||
      objBounds.top < printArea.top ||
      objBounds.left + objBounds.width > printArea.left + printArea.width ||
      objBounds.top + objBounds.height > printArea.top + printArea.height;
    
    return isOutside;
  }, []);

  const persistCurrentView = useCallback((viewOverride?: DesignView) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    // Gunakan activeViewRef.current agar selalu dapat nilai terbaru tanpa stale closure
    const view = viewOverride ?? activeViewRef.current;
    viewDataRef.current[view] = canvas.toJSON() as CanvasJson;
  }, []); // tidak perlu activeView di deps karena pakai ref

  const pushHistory = useCallback((view: DesignView) => {
    const canvas = fabricRef.current;
    if (!canvas || switchingRef.current) return;
    const json = canvas.toJSON() as CanvasJson;
    const stack = historyRef.current[view];
    const idx = historyIndexRef.current[view];
    const trimmed = stack.slice(0, idx + 1);
    trimmed.push(json);
    if (trimmed.length > 50) trimmed.shift();
    historyRef.current[view] = trimmed;
    historyIndexRef.current[view] = trimmed.length - 1;
    setSaveStatus("unsaved");
  }, []);

  const handleSave = useCallback(
    async (silent = false, nextShirtColor?: string) => {
      // Gunakan ref agar selalu dapat nilai terbaru tanpa stale closure
      const colorToSave = nextShirtColor ?? shirtColorRef.current;
      persistCurrentView();
      setSaving(true);
      setSaveStatus("saving");
      // Simpan shirtColor di _meta
      const dataWithMeta = {
        ...viewDataRef.current,
        _meta: { shirtColor: colorToSave },
      } as Record<DesignView, unknown> & { _meta: { shirtColor: string } };
      const result = await saveCanvasAction(
        design.id,
        dataWithMeta as Record<DesignView, unknown>
      );
      setSaving(false);
      if (result?.error) {
        if (!silent) toast.error(result.error);
        setSaveStatus("unsaved");
        return;
      }
      setSaveStatus("saved");
      // Update timestamp saat berhasil save
      const now = new Date();
      const timeStr = now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
      setLastSavedTime(timeStr);
      if (!silent) toast.success("Desain tersimpan");

      // Generate dan upload thumbnail secara fire-and-forget
      const canvas = fabricRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL({ multiplier: 1, format: "jpeg", quality: 0.8 });
        void saveThumbnailAction(design.id, dataUrl);
      }
    },
    [design.id, persistCurrentView] // tidak perlu shirtColor karena pakai ref
  );

  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void handleSave(true), 2500);
  }, [handleSave]);

  const saveDraftToLocal = useCallback(() => {
    try {
      const draft = {
        views: viewDataRef.current,
        shirtColor,
        savedAt: Date.now(),
      };
      localStorage.setItem(`design-draft-${design.id}`, JSON.stringify(draft));
    } catch {
      // ignore quota errors
    }
  }, [design.id, shirtColor]);

  const restoreDraftFromLocal = useCallback(async () => {
    try {
      const raw = localStorage.getItem(`design-draft-${design.id}`);
      if (!raw) return false;
      const data = JSON.parse(raw) as {
        views?: Record<string, unknown>;
        shirtColor?: string;
        savedAt?: number;
      };
      if (!data.views) return false;

      // Jangan restore draft yang lebih dari 24 jam
      if (data.savedAt && Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
        localStorage.removeItem(`design-draft-${design.id}`);
        return false;
      }

      viewDataRef.current = {
        front: (data.views.front as CanvasJson) ?? null,
        back: (data.views.back as CanvasJson) ?? null,
        left: (data.views.left as CanvasJson) ?? null,
        right: (data.views.right as CanvasJson) ?? null,
      } as Record<DesignView, CanvasJson | null>;
      if (typeof data.shirtColor === "string") setShirtColor(data.shirtColor);
      return true;
    } catch {
      return false;
    }
  }, [design.id]);

  const handleShirtColorChange = useCallback(
    (c: string) => {
      setShirtColor(c);
      try {
        // store in draft meta
        (viewDataRef.current as any)._meta = { shirtColor: c };
      } catch {
        // ignore
      }
      saveDraftToLocal();
      scheduleAutosave();
    },
    [scheduleAutosave, saveDraftToLocal]
  );

  const loadViewToCanvas = useCallback(
    async (view: DesignView) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      switchingRef.current = true;
      const data = viewDataRef.current[view];
      canvas.clear();
      canvas.backgroundColor = "transparent";
      if (data && Object.keys(data).length > 0) {
        await canvas.loadFromJSON(data);
        ensureAllObjectsInteractive(canvas);
      }
      canvas.renderAll();
      refreshCanvasLayout(canvas, zoom);
      switchingRef.current = false;
      if (historyRef.current[view].length === 0) {
        historyRef.current[view] = [canvas.toJSON() as CanvasJson];
        historyIndexRef.current[view] = 0;
      }
      syncSelection();
    },
    [syncSelection, zoom]
  );

  const switchView = useCallback(
    async (next: DesignView) => {
      if (next === activeView) return;
      const canvas = fabricRef.current;
      if (canvas && cropSessionRef.current) {
        cancelImageCrop(canvas);
        cropSessionRef.current = null;
        setCropActive(false);
      }
      // Capture thumbnail view saat ini sebelum switch
      if (canvas && !switchingRef.current) {
        const dataUrl = canvas.toDataURL({ format: "png", multiplier: 0.5 });
        setViewThumbnails((prev) => ({ ...prev, [activeView]: dataUrl }));
      }
      // Simpan state view saat ini secara eksplisit sebelum switch
      persistCurrentView(activeView);
      saveDraftToLocal();
      setReady(false);
      setActiveView(next);
      await loadViewToCanvas(next);
      setReady(true);
      // Capture thumbnail view baru setelah load
      if (canvas && !switchingRef.current) {
        const dataUrl = canvas.toDataURL({ format: "png", multiplier: 0.5 });
        setViewThumbnails((prev) => ({ ...prev, [next]: dataUrl }));
      }
    },
    [activeView, loadViewToCanvas, persistCurrentView, saveDraftToLocal]
  );

  const handleUndo = useCallback(async () => {
    const view = activeView;
    const idx = historyIndexRef.current[view];
    if (idx <= 0) return;
    historyIndexRef.current[view] = idx - 1;
    const json = historyRef.current[view][idx - 1];
    const canvas = fabricRef.current;
    if (!canvas) return;
    switchingRef.current = true;
    await canvas.loadFromJSON(json);
    ensureAllObjectsInteractive(canvas);
    canvas.renderAll();
    switchingRef.current = false;
    viewDataRef.current[view] = json;
    syncSelection();
    scheduleAutosave();
  }, [activeView, scheduleAutosave, syncSelection]);

  const handleRedo = useCallback(async () => {
    const view = activeView;
    const stack = historyRef.current[view];
    const idx = historyIndexRef.current[view];
    if (idx >= stack.length - 1) return;
    historyIndexRef.current[view] = idx + 1;
    const json = stack[idx + 1];
    const canvas = fabricRef.current;
    if (!canvas) return;
    switchingRef.current = true;
    await canvas.loadFromJSON(json);
    ensureAllObjectsInteractive(canvas);
    canvas.renderAll();
    switchingRef.current = false;
    viewDataRef.current[view] = json;
    syncSelection();
    scheduleAutosave();
  }, [activeView, scheduleAutosave, syncSelection]);

  const afterChange = useCallback(() => {
    // Simpan state canvas ke viewDataRef SEKARANG sebelum apapun
    const canvas = fabricRef.current;
    if (canvas) {
      viewDataRef.current[activeViewRef.current] = canvas.toJSON() as CanvasJson;
    }
    pushHistory(activeView);
    syncSelection();
    scheduleAutosave();
    // Simpan ke localStorage segera setiap ada perubahan (tidak debounce)
    // agar data tidak hilang saat refresh
    try {
      const draft = {
        views: viewDataRef.current,
        shirtColor: (viewDataRef.current as any)._meta?.shirtColor,
        savedAt: Date.now(),
      };
      localStorage.setItem(`design-draft-${design.id}`, JSON.stringify(draft));
    } catch {
      // ignore quota errors
    }
    // Update thumbnail view aktif — debounce 400ms agar tidak berat
    if (thumbTimerRef.current) clearTimeout(thumbTimerRef.current);
    thumbTimerRef.current = setTimeout(() => {
      const c = fabricRef.current;
      if (!c || switchingRef.current) return;
      const dataUrl = c.toDataURL({ format: "png", multiplier: 0.5 });
      setViewThumbnails((prev) => ({ ...prev, [activeViewRef.current]: dataUrl }));
    }, 400);
  }, [activeView, design.id, pushHistory, scheduleAutosave, syncSelection]);
  const addText = useCallback(async () => {
    const fabric = await import("fabric");
    const canvas = fabricRef.current;
    if (!canvas) return;
    const text = new fabric.IText("Ketik teks kamu", {
      left: CANVAS_WIDTH / 2 - 90,
      top: CANVAS_HEIGHT / 2 - 16,
      fontSize: 32,
      fill: "#18181b",
      fontFamily: "Arial",
      editable: true,
      originX: "left",
      originY: "top",
    });
    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    afterChange();
  }, [afterChange]);

  const handleImageUpload = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
      const maxSize = 10 * 1024 * 1024;
      if (!allowed.includes(file.type)) {
        toast.error("Format gambar tidak didukung (PNG, JPG, WebP, SVG saja)");
        e.target.value = "";
        return;
      }
      if (file.size > maxSize) {
        toast.error("Ukuran file melebihi batas 10MB");
        e.target.value = "";
        return;
      }

      // Konversi ke base64 data URL agar tetap valid saat canvas di-serialize/load ulang
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const fabric = await import("fabric");
      const canvas = fabricRef.current;
      if (!canvas) return;
      try {
        const img = await fabric.FabricImage.fromURL(dataUrl, {
          crossOrigin: "anonymous",
        });

        const area = getPrintArea(activeView);

        // Ambil dimensi asli gambar — fallback ke area cetak jika tidak tersedia
        const iw = (img.width && img.width > 0) ? img.width : area.width;
        const ih = (img.height && img.height > 0) ? img.height : area.height;

        // Target max 90% dari area cetak, selalu scale down jika lebih besar
        // Juga scale up jika gambar terlalu kecil (min 20% area cetak)
        const maxW = area.width * 0.9;
        const maxH = area.height * 0.9;
        const minW = area.width * 0.2;

        let scale = Math.min(maxW / iw, maxH / ih);
        // Jika gambar sangat kecil, scale up sampai minimal minW
        if (iw * scale < minW) {
          scale = minW / iw;
          // Tapi tetap jangan melebihi area cetak
          scale = Math.min(scale, maxW / iw, maxH / ih);
        }

        img.scale(scale);

        // Hitung dimensi setelah scale
        const scaledW = iw * scale;
        const scaledH = ih * scale;

        // Posisikan di tengah area cetak
        img.set({
          left: area.left + (area.width - scaledW) / 2,
          top: area.top + (area.height - scaledH) / 2,
          originX: "left",
          originY: "top",
        });
        img.setCoords();

        // Pastikan tidak keluar batas area cetak
        constrainToPrintArea(img, activeView);

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        afterChange();
        toast.success("Gambar berhasil ditambahkan");
      } catch {
        toast.error("Gagal memuat gambar");
      } finally {
        e.target.value = "";
      }
    },
    [afterChange, activeView]
  );

  const deleteSelected = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObjects();
    if (!active.length) return;
    active.forEach((obj) => canvas.remove(obj));
    canvas.discardActiveObject();
    canvas.renderAll();
    afterChange();
  }, [afterChange]);

  const duplicateSelected = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const active = canvas.getActiveObject();
    if (!active) return;
    const cloned = await active.clone();
    cloned.set({
      left: (active.left ?? 0) + 20,
      top: (active.top ?? 0) + 20,
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.renderAll();
    afterChange();
  }, [afterChange]);

  const applyLayer = useCallback(
    (dir: "up" | "down" | "top" | "bottom") => {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return;
      if (dir === "up") canvas.bringObjectForward(obj);
      if (dir === "down") canvas.sendObjectBackwards(obj);
      if (dir === "top") canvas.bringObjectToFront(obj);
      if (dir === "bottom") canvas.sendObjectToBack(obj);
      canvas.renderAll();
      afterChange();
    },
    [afterChange]
  );

  const centerSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const area = getPrintArea(activeView);
    const rect = obj.getBoundingRect();
    const targetX = area.left + area.width / 2;
    const targetY = area.top + area.height / 2;
    const deltaX = targetX - (rect.left + rect.width / 2);
    const deltaY = targetY - (rect.top + rect.height / 2);
    obj.set({ left: (obj.left ?? 0) + deltaX, top: (obj.top ?? 0) + deltaY });
    obj.setCoords();
    canvas.renderAll();
    afterChange();
  }, [activeView, afterChange]);

  const fitSelected = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!canvas || !obj) return;
    const area = getPrintArea(activeView);
    const rect = obj.getBoundingRect();
    if (!rect.width || !rect.height) return;
    const scale = Math.min(area.width / rect.width, area.height / rect.height, 1);
    if (scale < 1) {
      obj.set({
        scaleX: (obj.scaleX ?? 1) * scale,
        scaleY: (obj.scaleY ?? 1) * scale,
      });
    }
    obj.setCoords();
    const fittedRect = obj.getBoundingRect();
    const targetX = area.left + area.width / 2;
    const targetY = area.top + area.height / 2;
    const deltaX = targetX - (fittedRect.left + fittedRect.width / 2);
    const deltaY = targetY - (fittedRect.top + fittedRect.height / 2);
    obj.set({ left: (obj.left ?? 0) + deltaX, top: (obj.top ?? 0) + deltaY });
    obj.setCoords();
    canvas.renderAll();
    afterChange();
  }, [activeView, afterChange]);

  const toggleLock = useCallback(() => {
    const canvas = fabricRef.current;
    const obj = canvas?.getActiveObject();
    if (!obj) return;
    const locked = !obj.lockMovementX;
    obj.set({
      lockMovementX: locked,
      lockMovementY: locked,
      lockScalingX: locked,
      lockScalingY: locked,
      lockRotation: locked,
    });
    canvas?.renderAll();
    syncSelection();
    afterChange();
  }, [afterChange, syncSelection]);

  const applyObjectUpdate = useCallback(
    async (patch: Partial<ObjectProps>) => {
      const canvas = fabricRef.current;
      const obj = canvas?.getActiveObject();
      if (!canvas || !obj) return;

      const fabric = await import("fabric");
      const updates: Record<string, unknown> = {};

      if (patch.opacity !== undefined) updates.opacity = patch.opacity;
      if (patch.flipX !== undefined) updates.flipX = patch.flipX;
      if (patch.flipY !== undefined) updates.flipY = patch.flipY;
      if (patch.fontFamily) updates.fontFamily = patch.fontFamily;
      if (patch.fontSize) updates.fontSize = patch.fontSize;
      if (patch.fill) updates.fill = patch.fill;
      if (patch.fontWeight) updates.fontWeight = patch.fontWeight;
      if (patch.fontStyle) updates.fontStyle = patch.fontStyle;
      if (patch.textAlign) updates.textAlign = patch.textAlign;
      if (patch.charSpacing !== undefined) updates.charSpacing = patch.charSpacing;

      if (patch.stroke !== undefined) updates.stroke = patch.stroke;
      if (patch.strokeWidth !== undefined) updates.strokeWidth = patch.strokeWidth;

      if (patch.hasShadow !== undefined) {
        updates.shadow = patch.hasShadow
          ? new fabric.Shadow({
            color: "rgba(0,0,0,0.35)",
            blur: 10,
            offsetX: 3,
            offsetY: 3,
          })
          : null;
      }

      obj.set(updates);
      obj.setCoords();
      canvas.renderAll();
      syncSelection();
      scheduleAutosave();
    },
    [scheduleAutosave, syncSelection]
  );

  const startCropMode = useCallback(async () => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getActiveObject();
    if (!obj?.isType("image")) {
      toast.error("Pilih objek gambar terlebih dahulu");
      return;
    }
    try {
      const session = await startImageCrop(canvas, obj as FabricImage);
      cropSessionRef.current = session;
      setCropActive(true);
      toast.info("Atur kotak ungu, lalu klik Terapkan crop");
    } catch {
      toast.error("Gagal memulai mode crop");
    }
  }, []);

  const applyCropMode = useCallback(() => {
    const canvas = fabricRef.current;
    const session = cropSessionRef.current;
    if (!canvas || !session) return;
    try {
      applyImageCrop(canvas, session);
      cropSessionRef.current = null;
      setCropActive(false);
      afterChange();
      toast.success("Crop diterapkan");
    } catch {
      toast.error("Area crop tidak valid");
    }
  }, [afterChange]);

  const cancelCropMode = useCallback(() => {
    const canvas = fabricRef.current;
    if (canvas) cancelImageCrop(canvas);
    cropSessionRef.current = null;
    setCropActive(false);
  }, []);

  const applyZoom = useCallback((next: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const z = Math.min(2, Math.max(0.5, next));
    refreshCanvasLayout(canvas, z);
    setZoom(z);
  }, []);

  const handleImportWear = useCallback(
    async (data: WearFileData) => {
      viewDataRef.current = {
        front: data.views.front ?? null,
        back: data.views.back ?? null,
        left: data.views.left ?? null,
        right: data.views.right ?? null,
      } as Record<DesignView, CanvasJson | null>;
      setShirtColor(data.shirtColor);
      await loadViewToCanvas(activeView);
      void handleSave(true, data.shirtColor);
      setShowExportPanel(false);
    },
    [activeView, handleSave, loadViewToCanvas]
  );

  const handleImportJson = useCallback(
    async (canvasJson: unknown) => {
      const canvas = fabricRef.current;
      if (!canvas) return;
      switchingRef.current = true;
      await canvas.loadFromJSON(canvasJson as string | Record<string, unknown>);
      ensureAllObjectsInteractive(canvas);
      canvas.renderAll();
      switchingRef.current = false;
      viewDataRef.current[activeView] = canvas.toJSON() as CanvasJson;
      pushHistory(activeView);
      void handleSave(true);
      setShowExportPanel(false);
    },
    [activeView, handleSave, pushHistory]
  );

  useEffect(() => {
    let disposed = false;
    const canvasEl = canvasElRef.current;
    if (!canvasEl) return;

    void (async () => {
      const fabric = await import("fabric");
      const restored = await restoreDraftFromLocal();
      if (restored) {
        try {
          toast.info("Draft desain ditemukan dan dipulihkan");
        } catch {}
      }
      if (disposed) return;

      applyFabricEditorDefaults(fabric.InteractiveFabricObject);
      const canvas = new fabric.Canvas(canvasEl, FABRIC_CANVAS_OPTIONS);
      fabricRef.current = canvas;
      refreshCanvasLayout(canvas, 1);

      const handleCollisionCheck = () => {
        if (switchingRef.current) return;
        setIsOutside(checkCollision(canvas, activeViewRef.current));
      };

      canvas.on("selection:created", () => {
        syncSelection();
        handleCollisionCheck();
      });
      canvas.on("selection:updated", () => {
        syncSelection();
        handleCollisionCheck();
      });
      canvas.on("selection:cleared", () => {
        setObjectProps({ kind: "none" });
        setIsOutside(false);
      });

      canvas.on("object:modified", () => {
        if (switchingRef.current) return;
        viewDataRef.current[activeViewRef.current] = canvas.toJSON() as CanvasJson;
        pushHistory(activeViewRef.current);
        syncSelection();
        scheduleAutosave();
      });

      canvas.on("object:added", (e: any) => {
        const obj = e.target;
        if (obj && !obj.__uid) {
          obj.__uid = "obj_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
        }
        if (switchingRef.current) return;
        viewDataRef.current[activeViewRef.current] = canvas.toJSON() as CanvasJson;
        pushHistory(activeViewRef.current);
        scheduleAutosave();
      });

      canvas.on("object:removed", () => {
        if (switchingRef.current) return;
        viewDataRef.current[activeViewRef.current] = canvas.toJSON() as CanvasJson;
        pushHistory(activeViewRef.current);
        scheduleAutosave();
      });

      canvas.on("object:moving", (e) => {
        const target = e.target;
        if (!target) return;
        
        // Constrain to print area — objek tidak bisa keluar batas
        constrainToPrintArea(target, activeViewRef.current);
        
        // Snap to center guides + detect near
        const snap = snapToCenter(target, activeViewRef.current);
        setSnapGuides(snap);
        
        // Check collision (setelah constrain, seharusnya selalu false)
        handleCollisionCheck();
      });

      canvas.on("object:scaling", (e) => {
        const target = e.target;
        if (!target) return;
        const printArea = getPrintArea(activeViewRef.current);
        const bound = target.getBoundingRect();
        // Jika hasil scaling melebihi area cetak, batalkan scaling
        if (
          bound.width > printArea.width ||
          bound.height > printArea.height ||
          bound.left < printArea.left ||
          bound.top < printArea.top ||
          bound.left + bound.width > printArea.left + printArea.width ||
          bound.top + bound.height > printArea.top + printArea.height
        ) {
          constrainToPrintArea(target, activeViewRef.current);
        }
        handleCollisionCheck();
      });

      canvas.on("object:rotating", (e) => {
        const target = e.target;
        if (target) {
          constrainToPrintArea(target, activeViewRef.current);
        }
        handleCollisionCheck();
      });

      canvas.on("mouse:up", () => {
        panningRef.current = false;
        canvas.selection = true;
        // Clear snap guides when mouse up
        setSnapGuides({ x: false, y: false, nearX: false, nearY: false });
      });

      const onPanMove = (opt: { e: MouseEvent | TouchEvent }) => {
        if (!panningRef.current || !spaceHeldRef.current) return;
        const ev = opt.e as MouseEvent;
        const vpt = canvas.viewportTransform;
        if (!vpt) return;
        vpt[4] += ev.clientX - panLastRef.current.x;
        vpt[5] += ev.clientY - panLastRef.current.y;
        panLastRef.current = { x: ev.clientX, y: ev.clientY };
        canvas.setViewportTransform(vpt);
        canvas.requestRenderAll();
      };

      canvas.on("mouse:down", (opt) => {
        if (!spaceHeldRef.current) return;
        panningRef.current = true;
        canvas.selection = false;
        canvas.discardActiveObject();
        const ev = opt.e as MouseEvent;
        panLastRef.current = { x: ev.clientX, y: ev.clientY };
      });

      canvas.on("mouse:move", onPanMove);

      await loadViewToCanvas("front");
      refreshCanvasLayout(canvas, 1);
      setReady(true);
    })();

    return () => {
      disposed = true;
      fabricRef.current?.dispose();
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || !ready) return;
    canvas.backgroundColor = "transparent";
    refreshCanvasLayout(canvas, zoom);
  }, [shirtColor, ready, zoom]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Helper: cek apakah user sedang mengetik di input/textarea/fabric text editor
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      const isFabricEditing = !!(fabricRef.current?.getActiveObject() as { isEditing?: boolean } | null)?.isEditing;
      const isUserTyping =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable ||
        isFabricEditing;

      // Space — hanya aktifkan panning jika TIDAK sedang mengetik
      if (e.code === "Space" && !isUserTyping) {
        spaceHeldRef.current = true;
        e.preventDefault();
        return;
      }

      // Ctrl+S — simpan (aktif di mana saja kecuali fabric text editing)
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && !isFabricEditing) {
        e.preventDefault();
        void handleSave();
        return;
      }

      // Ctrl+Z — undo (tidak aktif saat mengetik di input biasa)
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey && !isUserTyping) {
        e.preventDefault();
        void handleUndo();
        return;
      }

      // Ctrl+Y / Ctrl+Shift+Z — redo
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey)) && !isUserTyping) {
        e.preventDefault();
        void handleRedo();
        return;
      }

      // Ctrl+D — duplikasi
      if ((e.ctrlKey || e.metaKey) && e.key === "d" && !isUserTyping) {
        e.preventDefault();
        void duplicateSelected();
        return;
      }

      // Delete / Backspace — hapus objek terpilih
      if ((e.key === "Delete" || e.key === "Backspace") && !isUserTyping) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      // Escape — batalkan seleksi canvas ATAU tutup modal
      if (e.key === "Escape") {
        if (showHelpModal) {
          e.preventDefault();
          setShowHelpModal(false);
          return;
        }
        // Batalkan seleksi canvas
        const canvas = fabricRef.current;
        if (canvas && canvas.getActiveObject()) {
          e.preventDefault();
          canvas.discardActiveObject();
          canvas.requestRenderAll();
          setObjectProps({ kind: "none" });
          setIsOutside(false);
          return;
        }
      }

      // Semua shortcut di bawah ini tidak aktif saat user sedang mengetik
      if (isUserTyping) return;

      // Switch view numeric keys 1-4
      const map: Record<string, DesignView> = { "1": "front", "2": "back", "3": "left", "4": "right" };
      if (map[e.key] && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        void switchView(map[e.key]);
        return;
      }

      // Ctrl+A — pilih semua objek
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        e.preventDefault();
        void (async () => {
          const canvas = fabricRef.current;
          if (!canvas) return;
          const fabric = await import("fabric");
          const objs = canvas.getObjects();
          if (!objs.length) return;
          const sel = new fabric.ActiveSelection(objs, { canvas });
          canvas.setActiveObject(sel);
          canvas.requestRenderAll();
          syncSelection();
        })();
        return;
      }

      // Arrow keys — pindah objek terpilih (1px atau 10px dengan Shift)
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!obj) return;
        e.preventDefault();
        const delta = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") obj.left = (obj.left ?? 0) - delta;
        if (e.key === "ArrowRight") obj.left = (obj.left ?? 0) + delta;
        if (e.key === "ArrowUp") obj.top = (obj.top ?? 0) - delta;
        if (e.key === "ArrowDown") obj.top = (obj.top ?? 0) + delta;
        obj.setCoords();
        // Constrain ke print area setelah dipindah
        constrainToPrintArea(obj, activeViewRef.current);
        canvas?.requestRenderAll();
        scheduleAutosave();
        return;
      }

      // [ / ] — layer ke bawah / ke atas
      if (e.key === "[") {
        e.preventDefault();
        applyLayer("down");
        return;
      }
      if (e.key === "]") {
        e.preventDefault();
        applyLayer("up");
        return;
      }

      // ? — buka modal bantuan shortcut
      if (e.key === "?") {
        e.preventDefault();
        setShowHelpModal(true);
        return;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spaceHeldRef.current = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [handleSave, handleUndo, handleRedo, deleteSelected, duplicateSelected, switchView, applyLayer, scheduleAutosave, syncSelection]);

  // Simpan ke localStorage saat user mau refresh/tutup tab
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Persist canvas terbaru ke viewDataRef
      const canvas = fabricRef.current;
      if (canvas && !switchingRef.current) {
        viewDataRef.current[activeViewRef.current] = canvas.toJSON() as CanvasJson;
      }
      // Simpan ke localStorage sebagai emergency draft
      try {
        const draft = {
          views: viewDataRef.current,
          shirtColor,
          savedAt: Date.now(),
        };
        localStorage.setItem(`design-draft-${design.id}`, JSON.stringify(draft));
      } catch {
        // ignore
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [design.id, shirtColor]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      <header className="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-zinc-950/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-zinc-300 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 sm:text-base">
              {design.title}
            </h1>
            <p className="text-xs text-zinc-500">
              {productLabel} ·{" "}
              {saveStatus === "saving"
                ? "Menyimpan..."
                : saveStatus === "unsaved"
                  ? "Belum disimpan"
                  : lastSavedTime
                    ? `Tersimpan ✓ — ${lastSavedTime}`
                    : "Tersimpan ✓"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-zinc-400 lg:flex">
            <span className="uppercase tracking-[0.18em] text-zinc-500">Sisi aktif</span>
            <span className="rounded-full bg-violet-600/20 px-2 py-0.5 text-violet-200">
              {activeViewLabel[activeView]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ViewTabs active={activeView} onChange={(v: DesignView) => void switchView(v)} />
            <ViewThumbnails
              productType={design.product_type}
              active={activeView}
              onChange={(v: DesignView) => void switchView(v)}
              shirtColor={shirtColor}
              viewThumbnails={viewThumbnails}
            />
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExportPanel((prev: boolean) => !prev)}
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={saving}
            onClick={() => void handleSave()}
            title="Simpan (Ctrl+S)"
          >
            <Save className="h-4 w-4" />
            Simpan
          </Button>
        </div>
      </header>

      <div className="border-b border-white/10 bg-zinc-950/70 px-4 py-2.5 text-[11px] text-zinc-400 backdrop-blur sm:text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">1-4 ganti view</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Ctrl+S simpan</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Ctrl+D duplikat</span>
          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Space + drag geser kanvas</span>
          <span className="ml-auto hidden text-zinc-500 lg:inline">Gunakan panel kiri untuk tambah objek, panel kanan untuk atur detail.</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col lg:flex-row">
        {showExportPanel && (
          <ExportImportPanel
            fabricRef={fabricRef}
            viewData={viewDataRef.current}
            activeView={activeView}
            productType={design.product_type}
            shirtColor={shirtColor}
            title={design.title}
            onClose={() => setShowExportPanel(false)}
            onImport={(data) => void handleImportWear(data)}
            onImportJson={(json) => void handleImportJson(json)}
          />
        )}
        <aside className="border-b border-white/10 bg-zinc-950/70 p-2 lg:sticky lg:top-16 lg:w-64 lg:shrink-0 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-3">
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Tambah</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => void addText()} title="Tambah Teks">
                  <Type className="h-4 w-4" />
                  <span>Teks</span>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => fileInputRef.current?.click()} title="Upload Gambar">
                  <ImagePlus className="h-4 w-4" />
                  <span>Gambar</span>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Edit</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => void duplicateSelected()} title="Duplikat (Ctrl+D)">
                  <Copy className="h-4 w-4" />
                  <span>Duplikat</span>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={deleteSelected} title="Hapus (Delete)">
                  <Trash2 className="h-4 w-4" />
                  <span>Hapus</span>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={toggleLock} title="Lock / Unlock objek">
                  <Lock className="h-4 w-4" />
                  <span>Lock</span>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Riwayat</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => void handleUndo()} title="Undo (Ctrl+Z)">
                  <Undo2 className="h-4 w-4" />
                  <span>Undo</span>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => void handleRedo()} title="Redo (Ctrl+Y)">
                  <Redo2 className="h-4 w-4" />
                  <span>Redo</span>
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-2">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Lihat</p>
              <div className="grid grid-cols-2 gap-2 lg:grid-cols-1">
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => applyZoom(zoom + 0.1)} title="Zoom in (Ctrl++)">
                  <ZoomIn className="h-4 w-4" />
                  <span>Zoom +</span>
                </Button>
                <Button variant="ghost" size="sm" className="justify-start lg:w-full" onClick={() => applyZoom(zoom - 0.1)} title="Zoom out (Ctrl+-)">
                  <ZoomOut className="h-4 w-4" />
                  <span>Zoom -</span>
                </Button>
                <Button
                  variant={showPrintArea ? "primary" : "ghost"}
                  size="sm"
                  className="justify-start lg:w-full"
                  onClick={() => setShowPrintArea((v) => !v)}
                  title="Toggle Area Cetak"
                >
                  <Ruler className="h-4 w-4" />
                  <span>Area cetak</span>
                </Button>
              </div>
            </div>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e)} />
        </aside>

        <main className="mesh-gradient flex flex-1 items-center justify-center p-4">
          <div className="relative w-full max-w-[1100px]">
            <div
              className="absolute inset-0 -z-10 rounded-3xl opacity-70 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.12), transparent 42%), radial-gradient(circle at 50% 50%, rgba(124,58,237,0.10), transparent 62%)",
              }}
            />
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-zinc-900/60 px-4 py-3 shadow-lg backdrop-blur">
              <div>
                <p className="text-[11px] uppercase tracking-[0.25em] text-zinc-500">Canvas aktif</p>
                <h2 className="text-sm font-semibold text-zinc-100">
                  {activeViewLabel[activeView]} · {Math.round(zoom * 100)}%
                </h2>
                <p className="mt-1 text-[11px] text-zinc-500">
                  Fokus pada area cetak {activeViewLabel[activeView].toLowerCase()} untuk mengatur desain baju.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-[11px] text-zinc-400">
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Tarik objek untuk pindah</span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1">Double klik teks untuk edit</span>
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900/50 p-3 shadow-2xl backdrop-blur">
              <EditorStage
                canvasRef={canvasElRef}
                ready={ready}
                zoom={zoom}
                productType={design.product_type}
                activeView={activeView}
                shirtColor={shirtColor}
                showPrintArea={showPrintArea}
                isOutside={isOutside}
                snapGuides={snapGuides}
              />
            </div>
            {isOutside && (
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Objek berada di luar area cetak</span>
              </div>
            )}
            <p className="mt-2 max-w-sm text-center text-xs text-zinc-500">
              Klik objek → geser · Tarik sudut → resize · Double-klik teks → edit · Space+drag → geser tampilan
            </p>
          </div>
        </main>

        <div className="flex w-full flex-col border-t border-white/10 bg-zinc-950/70 lg:sticky lg:top-16 lg:w-80 lg:shrink-0 lg:self-start lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto lg:border-t-0 lg:border-l">
          <PropertiesPanel
            shirtColor={shirtColor}
            onShirtColorChange={handleShirtColorChange}
            shirtColorPresets={SHIRT_COLOR_PRESETS}
            props={objectProps}
            onUpdate={(patch) => void applyObjectUpdate(patch)}
            onLayer={applyLayer}
            onDuplicate={() => void duplicateSelected()}
            onToggleLock={toggleLock}
            onCenter={centerSelected}
            onFit={fitSelected}
            cropActive={cropActive}
            onStartCrop={() => void startCropMode()}
            onApplyCrop={applyCropMode}
            onCancelCrop={cancelCropMode}
          />
          <LayersPanel fabricRef={fabricRef} ready={ready} activeView={activeView} />
        </div>
      </div>
      {/* Bottom toolbar for small screens */}
      <div className="fixed bottom-3 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-zinc-900/80 p-2 shadow-lg backdrop-blur lg:hidden">
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={() => void handleUndo()}>
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => void handleRedo()}>
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyZoom(zoom - 0.1)}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyZoom(zoom + 0.1)}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => void handleSave()} disabled={saving}>
            <Save className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setShowExportPanel((v) => !v)}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Help Modal */}
      {showHelpModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-zinc-100">Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowHelpModal(false)}
                className="rounded-lg p-2 text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
                title="Tutup (Esc)"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-semibold text-violet-400">Umum</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Simpan manual</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Ctrl+S</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Pilih semua objek</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Ctrl+A</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Bantuan (modal ini)</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">?</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-violet-400">Edit Objek</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Undo</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Ctrl+Z</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Redo</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Ctrl+Y / Ctrl+Shift+Z</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Duplikasi objek</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Ctrl+D</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Hapus objek terpilih</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Delete / Backspace</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Batalkan seleksi</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Escape</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-violet-400">Pindah Objek</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Pindah objek (1px)</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Arrow Keys</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Pindah objek (10px)</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Shift+Arrow Keys</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-violet-400">Layer</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Layer ke atas</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">]</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Layer ke bawah</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">[</kbd>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold text-violet-400">View</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Pindah ke view Depan / Belakang / Kiri / Kanan</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">1 / 2 / 3 / 4</kbd>
                  </div>
                  <div className="flex justify-between rounded-lg bg-white/5 px-3 py-2">
                    <span className="text-zinc-300">Geser tampilan canvas</span>
                    <kbd className="rounded bg-zinc-800 px-2 py-1 font-mono text-xs text-zinc-400">Space+Drag</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-lg border border-violet-500/30 bg-violet-500/10 p-3 text-xs text-violet-300">
              <p className="font-semibold">💡 Tips:</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-zinc-400">
                <li>Double-klik teks untuk mengedit langsung di canvas</li>
                <li>Tarik sudut objek untuk resize, handle atas untuk rotate</li>
                <li>Desain otomatis tersimpan setiap 2.5 detik</li>
                <li>Objek di luar area cetak akan ditandai dengan border merah</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
