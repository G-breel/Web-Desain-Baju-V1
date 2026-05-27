"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { Canvas, FabricObject } from "fabric";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Type,
  ImageIcon,
  Square,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LayerItem {
  id: string;          // fabricObject.__uid atau fallback index
  index: number;       // posisi di canvas.getObjects()
  type: string;
  label: string;
  visible: boolean;
  locked: boolean;
  isActive: boolean;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

type ExtendedObject = FabricObject & {
  __uid?: string;
  __label?: string;
  text?: string;
  visible?: boolean;
  lockMovementX?: boolean;
};

function getObjectLabel(obj: ExtendedObject, index: number): string {
  if (obj.__label) return obj.__label;
  if (obj.type === "i-text" || obj.type === "text" || obj.type === "textbox") {
    const t = (obj as ExtendedObject & { text?: string }).text ?? "";
    return t.length > 20 ? t.slice(0, 20) + "…" : t || `Teks ${index + 1}`;
  }
  if (obj.type === "image") return `Gambar ${index + 1}`;
  if (obj.type === "rect") return `Kotak ${index + 1}`;
  if (obj.type === "circle") return `Lingkaran ${index + 1}`;
  if (obj.type === "path") return `Path ${index + 1}`;
  if (obj.type === "group") return `Grup ${index + 1}`;
  return `Layer ${index + 1}`;
}

function getObjectIcon(type: string) {
  if (type === "i-text" || type === "text" || type === "textbox")
    return <Type className="h-3.5 w-3.5 shrink-0 text-violet-400" />;
  if (type === "image")
    return <ImageIcon className="h-3.5 w-3.5 shrink-0 text-blue-400" />;
  return <Square className="h-3.5 w-3.5 shrink-0 text-zinc-400" />;
}

function buildLayers(canvas: Canvas, activeObj: FabricObject | null): LayerItem[] {
  const objs = canvas.getObjects() as ExtendedObject[];
  return objs
    .map((obj, i) => ({
      id: obj.__uid ?? String(i),
      index: i,
      type: obj.type ?? "object",
      label: getObjectLabel(obj, i),
      visible: obj.visible !== false,
      locked: !!(obj.lockMovementX),
      isActive: obj === activeObj,
    }))
    .reverse(); // layer atas tampil di atas seperti Figma
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LayersPanel({
  fabricRef,
  ready = false,
  activeView,
}: {
  fabricRef: React.RefObject<Canvas | null>;
  onSelect?: (idx: number) => void;
  ready?: boolean;
  activeView?: string;
}) {
  const [layers, setLayers] = useState<LayerItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const dragIndexRef = useRef<number | null>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // ── Sync layers dari canvas ──
  const syncLayers = useCallback(() => {
    const canvas = fabricRef.current;
    if (!canvas) return setLayers([]);
    const active = canvas.getActiveObject() ?? null;
    setLayers(buildLayers(canvas, active));
  }, [fabricRef]);

  // Re-sync saat canvas ready atau view berubah
  useEffect(() => {
    if (!ready) return;
    syncLayers();
  }, [ready, activeView, syncLayers]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    syncLayers();

    const events = [
      "object:added",
      "object:removed",
      "object:modified",
      "selection:created",
      "selection:updated",
      "selection:cleared",
    ] as const;

    events.forEach((ev) => canvas.on(ev, syncLayers));
    return () => {
      events.forEach((ev) => canvas.off(ev, syncLayers));
    };
  }, [fabricRef, syncLayers, ready]);

  // Focus input saat rename aktif
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  // ── Actions ──

  const selectLayer = (canvasIndex: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[canvasIndex];
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    syncLayers();
  };

  const toggleVisibility = (canvasIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[canvasIndex] as ExtendedObject;
    if (!obj) return;
    obj.visible = obj.visible === false ? true : false;
    canvas.requestRenderAll();
    syncLayers();
  };

  const toggleLock = (canvasIndex: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[canvasIndex] as ExtendedObject;
    if (!obj) return;
    const locked = !!obj.lockMovementX;
    obj.set({
      lockMovementX: !locked,
      lockMovementY: !locked,
      lockScalingX: !locked,
      lockScalingY: !locked,
      lockRotation: !locked,
      selectable: locked,   // kalau locked → false, kalau unlock → true
      evented: true,
      hasControls: locked,
    });
    canvas.requestRenderAll();
    syncLayers();
  };

  const moveLayer = (canvasIndex: number, dir: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[canvasIndex];
    if (!obj) return;
    if (dir === "up") canvas.bringObjectForward(obj);
    else canvas.sendObjectBackwards(obj);
    canvas.requestRenderAll();
    syncLayers();
  };

  const startRename = (layer: LayerItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(layer.id);
    setEditValue(layer.label);
  };

  const commitRename = (canvasIndex: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[canvasIndex] as ExtendedObject;
    if (obj && editValue.trim()) {
      obj.__label = editValue.trim();
    }
    setEditingId(null);
    syncLayers();
  };

  // ── Drag to reorder ──
  const handleDragStart = (canvasIndex: number) => {
    dragIndexRef.current = canvasIndex;
  };

  const handleDrop = (targetCanvasIndex: number) => {
    const canvas = fabricRef.current;
    const from = dragIndexRef.current;
    if (!canvas || from === null || from === targetCanvasIndex) return;

    const objs = canvas.getObjects();
    const obj = objs[from];
    if (!obj) return;

    // Pindahkan objek ke posisi target
    canvas.remove(obj);
    const newObjs = canvas.getObjects();
    // Hitung posisi insert yang benar setelah remove
    const insertAt = from < targetCanvasIndex ? targetCanvasIndex - 1 : targetCanvasIndex;
    canvas.insertAt(insertAt, obj);
    canvas.requestRenderAll();
    dragIndexRef.current = null;
    syncLayers();
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="border-t border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <Layers className="h-3.5 w-3.5 text-zinc-500" />
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
            Layers
          </h4>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500">
          {layers.length}
        </span>
      </div>

      {/* Layer list */}
      <div className="px-2 pb-3">
        {layers.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-5 text-center text-xs text-zinc-500">
            Belum ada objek di view ini
          </div>
        )}

        <div className="space-y-0.5">
          {layers.map((layer, displayIdx) => {
            const isEditing = editingId === layer.id;
            const isLast = displayIdx === layers.length - 1;
            const isFirst = displayIdx === 0;

            return (
              <div
                key={layer.id}
                draggable
                onDragStart={() => handleDragStart(layer.index)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(layer.index)}
                onClick={() => selectLayer(layer.index)}
                className={`group flex cursor-pointer items-center gap-1.5 rounded-xl px-1.5 py-1.5 transition-all ${
                  layer.isActive
                    ? "bg-violet-500/15 ring-1 ring-violet-500/40"
                    : "hover:bg-white/[0.06]"
                } ${!layer.visible ? "opacity-40" : ""}`}
              >
                {/* Drag handle */}
                <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing" />

                {/* Type icon */}
                {getObjectIcon(layer.type)}

                {/* Label / rename input */}
                <div className="min-w-0 flex-1">
                  {isEditing ? (
                    <input
                      ref={editInputRef}
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => commitRename(layer.index)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitRename(layer.index);
                        if (e.key === "Escape") setEditingId(null);
                        e.stopPropagation();
                      }}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full rounded-md border border-violet-500/50 bg-zinc-900 px-1.5 py-0.5 text-xs text-zinc-100 outline-none focus:border-violet-400"
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => startRename(layer, e)}
                      className={`block truncate text-xs ${
                        layer.isActive ? "font-medium text-zinc-100" : "text-zinc-300"
                      }`}
                      title="Double-klik untuk rename"
                    >
                      {layer.label}
                    </span>
                  )}
                </div>

                {/* Actions — tampil saat hover atau aktif */}
                <div className={`flex shrink-0 items-center gap-0.5 ${layer.isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"} transition-opacity`}>
                  {/* Move up/down */}
                  <button
                    type="button"
                    title="Naik"
                    disabled={isFirst}
                    onClick={(e) => moveLayer(layer.index, "up", e)}
                    className="rounded p-0.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-20"
                  >
                    <ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    title="Turun"
                    disabled={isLast}
                    onClick={(e) => moveLayer(layer.index, "down", e)}
                    className="rounded p-0.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200 disabled:opacity-20"
                  >
                    <ChevronDown className="h-3 w-3" />
                  </button>

                  {/* Visibility */}
                  <button
                    type="button"
                    title={layer.visible ? "Sembunyikan" : "Tampilkan"}
                    onClick={(e) => toggleVisibility(layer.index, e)}
                    className="rounded p-0.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                  >
                    {layer.visible ? (
                      <Eye className="h-3 w-3" />
                    ) : (
                      <EyeOff className="h-3 w-3 text-zinc-600" />
                    )}
                  </button>

                  {/* Lock */}
                  <button
                    type="button"
                    title={layer.locked ? "Unlock" : "Lock"}
                    onClick={(e) => toggleLock(layer.index, e)}
                    className="rounded p-0.5 text-zinc-500 transition hover:bg-white/10 hover:text-zinc-200"
                  >
                    {layer.locked ? (
                      <Lock className="h-3 w-3 text-amber-400" />
                    ) : (
                      <Unlock className="h-3 w-3" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
