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
import { PrintAreaOverlay } from "@/components/editor/print-area-overlay";
import { ExportImportPanel } from "@/components/editor/export-import-panel";
import { EditorStage } from "@/components/editor/editor-stage";
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
    if (trimmed.length > 40) trimmed.shift();
    historyRef.current[view] = trimmed;
    historyIndexRef.current[view] = trimmed.length - 1;
    setSaveStatus("unsaved");
  }, []);

  const handleSave = useCallback(
    async (silent = false) => {
      persistCurrentView();
      setSaving(true);
      setSaveStatus("saving");
      // Simpan shirtColor di _meta
      const dataWithMeta = {
        ...viewDataRef.current,
        _meta: { shirtColor },
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
      persistCurrentView();
      setActiveView(next);
      await loadViewToCanvas(next);
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
      const fabric = await import("fabric");
      const canvas = fabricRef.current;
      if (!canvas) return;
      const url = URL.createObjectURL(file);
      try {
        const img = await fabric.FabricImage.fromURL(url, {
          crossOrigin: "anonymous",
        });
        const maxW = CANVAS_WIDTH * 0.6;
        const scale = maxW / (img.width ?? maxW);
        img.scale(scale);
        img.set({
          left: CANVAS_WIDTH / 2 - ((img.width ?? 0) * scale) / 2,
          top: CANVAS_HEIGHT / 2 - ((img.height ?? 0) * scale) / 2,
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
    [afterChange]
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
      void handleSave(true);
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
  }, [handleSave, handleUndo, handleRedo, deleteSelected, duplicateSelected]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col bg-zinc-950">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
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
          <ViewTabs active={activeView} onChange={(v) => void switchView(v)} />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setShowExportPanel((v) => !v)}
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
        <aside className="flex flex-row flex-wrap gap-1 border-b border-white/10 p-2 lg:w-16 lg:flex-col lg:border-b-0 lg:border-r">
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => void addText()} title="Tambah Teks">
            <Type className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => fileInputRef.current?.click()} title="Upload Gambar">
            <ImagePlus className="h-4 w-4" />
          </Button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleImageUpload(e)} />
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => void duplicateSelected()} title="Duplikat (Ctrl+D)">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={deleteSelected} title="Hapus (Delete)">
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={toggleLock} title="Lock / Unlock objek">
            <Lock className="h-4 w-4" />
          </Button>
          <div className="mx-1 hidden h-px w-full bg-white/10 lg:block" />
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => void handleUndo()} title="Undo (Ctrl+Z)">
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => void handleRedo()} title="Redo (Ctrl+Y)">
            <Redo2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => applyZoom(zoom + 0.1)} title="Zoom in (Ctrl++)">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="lg:w-full" onClick={() => applyZoom(zoom - 0.1)} title="Zoom out (Ctrl+-)">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant={showPrintArea ? "primary" : "ghost"}
            size="sm"
            className="lg:w-full"
            onClick={() => setShowPrintArea((v) => !v)}
            title="Toggle Area Cetak"
          >
            <Ruler className="h-4 w-4" />
          </Button>
        </aside>

        <main className="mesh-gradient flex flex-1 items-center justify-center overflow-auto p-4">
          <div className="relative">
            <div className="absolute inset-0 -z-10 rounded-3xl opacity-40 blur-2xl" style={{ backgroundColor: shirtColor }} />
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

        <PropertiesPanel
          shirtColor={shirtColor}
          onShirtColorChange={setShirtColor}
          shirtColorPresets={SHIRT_COLOR_PRESETS}
          props={objectProps}
          onUpdate={(patch) => void applyObjectUpdate(patch)}
          onLayer={applyLayer}
          onDuplicate={() => void duplicateSelected()}
          onToggleLock={toggleLock}
          cropActive={cropActive}
          onStartCrop={() => void startCropMode()}
          onApplyCrop={applyCropMode}
          onCancelCrop={cancelCropMode}
        />
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
