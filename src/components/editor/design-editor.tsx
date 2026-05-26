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
import { snapObjectToGuides } from "@/lib/editor/fabric-helpers";
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
  const panningRef = useRef(false);
  const panLastRef = useRef({ x: 0, y: 0 });
  const spaceHeldRef = useRef(false);
  const cropSessionRef = useRef<CropSession | null>(null);

  const [activeView, setActiveView] = useState<DesignView>("front");
  const [shirtColor, setShirtColor] = useState(extractShirtColor(design.canvas_data));
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

  const persistCurrentView = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    viewDataRef.current[activeView] = canvas.toJSON() as CanvasJson;
  }, [activeView]);

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
    async (silent = false, nextShirtColor = shirtColor) => {
      persistCurrentView();
      setSaving(true);
      setSaveStatus("saving");
      // Simpan shirtColor di _meta
      const dataWithMeta = {
        ...viewDataRef.current,
        _meta: { shirtColor: nextShirtColor },
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
      if (!silent) toast.success("Desain tersimpan");

      // Generate dan upload thumbnail secara fire-and-forget
      const canvas = fabricRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL({ multiplier: 1, format: "jpeg", quality: 0.8 });
        void saveThumbnailAction(design.id, dataUrl);
      }
    },
    [design.id, persistCurrentView, shirtColor]
  );

  const scheduleAutosave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => void handleSave(true), 2500);
  }, [handleSave]);

  const saveDraftToLocal = useCallback(() => {
    try {
      const draft = { views: viewDataRef.current, shirtColor };
      localStorage.setItem(`design-draft-${design.id}`, JSON.stringify(draft));
    } catch (e) {
      // ignore quota errors
    }
  }, [design.id, shirtColor]);

  const restoreDraftFromLocal = useCallback(async () => {
    try {
      const raw = localStorage.getItem(`design-draft-${design.id}`);
      if (!raw) return false;
      const data = JSON.parse(raw) as { views?: Record<string, unknown>; shirtColor?: string };
      if (!data.views) return false;
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
      // save current view state and draft
      persistCurrentView();
      saveDraftToLocal();
      setReady(false);
      setActiveView(next);
      await loadViewToCanvas(next);
      setReady(true);
    },
    [activeView, loadViewToCanvas, persistCurrentView]
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
    pushHistory(activeView);
    syncSelection();
    scheduleAutosave();
  }, [activeView, pushHistory, scheduleAutosave, syncSelection]);
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
      // validate type and size
      const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
      const maxSize = 10 * 1024 * 1024; // 10MB
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
      const fabric = await import("fabric");
      const canvas = fabricRef.current;
      if (!canvas) return;
      const url = URL.createObjectURL(file);
      try {
        const img = await fabric.FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });
        // place image centered in print area for active view
        const area = getPrintArea(activeView);
        const maxW = area.width * 0.9; // leave margin
        const maxH = area.height * 0.9;
        const iw = img.width ?? maxW;
        const ih = img.height ?? maxH;
        const scale = Math.min(maxW / iw, maxH / ih, 1);
        img.scale(scale);
        const w = (iw * scale) || maxW;
        const h = (ih * scale) || maxH;
        img.set({
          left: area.left + (area.width - w) / 2,
          top: area.top + (area.height - h) / 2,
          originX: "left",
          originY: "top",
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        afterChange();
      } catch {
        toast.error("Gagal memuat gambar");
      } finally {
        URL.revokeObjectURL(url);
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

      canvas.on("selection:created", syncSelection);
      canvas.on("selection:updated", syncSelection);
      canvas.on("selection:cleared", () => setObjectProps({ kind: "none" }));

      canvas.on("object:modified", () => {
        pushHistory(activeView);
        syncSelection();
        scheduleAutosave();
      });

      canvas.on("object:added", () => {
        if (!switchingRef.current) {
          pushHistory(activeView);
          scheduleAutosave();
        }
      });

      canvas.on("object:moving", (e) => {
        const target = e.target;
        if (target) snapObjectToGuides(target);
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
      canvas.on("mouse:up", () => {
        panningRef.current = false;
        canvas.selection = true;
      });

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
      if (e.code === "Space" && !(e.target as HTMLElement)?.closest("input")) {
        spaceHeldRef.current = true;
        e.preventDefault();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        void handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        void handleRedo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        void duplicateSelected();
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        deleteSelected();
      }
      // Switch view numeric keys 1-4
      if (!(e.target as HTMLElement)?.closest("input")) {
        const map: Record<string, DesignView> = { "1": "front", "2": "back", "3": "left", "4": "right" };
        if (map[e.key]) {
          e.preventDefault();
          void switchView(map[e.key]);
          return;
        }
      }

      // Ctrl+A select all
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

      // Arrow keys - move selected object
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        const canvas = fabricRef.current;
        const obj = canvas?.getActiveObject();
        if (!obj) return;
        const delta = e.shiftKey ? 10 : 1;
        if (e.key === "ArrowLeft") obj.left = (obj.left ?? 0) - delta;
        if (e.key === "ArrowRight") obj.left = (obj.left ?? 0) + delta;
        if (e.key === "ArrowUp") obj.top = (obj.top ?? 0) - delta;
        if (e.key === "ArrowDown") obj.top = (obj.top ?? 0) + delta;
        obj.setCoords();
        canvas?.requestRenderAll();
        scheduleAutosave();
        e.preventDefault();
        return;
      }

      // Layer control
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

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-950">
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
                  : "Tersimpan"}
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
        <aside className="border-b border-white/10 bg-zinc-950/70 p-2 lg:w-64 lg:border-b-0 lg:border-r lg:p-3">
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

        <main className="mesh-gradient flex flex-1 items-center justify-center overflow-auto p-4">
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
              />
            </div>
            <p className="mt-2 max-w-sm text-center text-xs text-zinc-500">
              Klik objek → geser · Tarik sudut → resize · Double-klik teks → edit · Space+drag → geser tampilan
            </p>
          </div>
        </main>

        <div className="flex w-full flex-col border-t border-white/10 bg-zinc-950/70 lg:w-80 lg:shrink-0 lg:border-t-0 lg:border-l">
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
          <LayersPanel fabricRef={fabricRef} />
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
    </div>
  );
}
