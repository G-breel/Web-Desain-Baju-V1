"use client";

import { FONT_OPTIONS } from "@/lib/editor/fabric-helpers";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { FabricObject } from "fabric";

export type SelectionKind = "none" | "text" | "image" | "other";

export interface ObjectProps {
  kind: SelectionKind;
  locked?: boolean;
  opacity?: number;
  stroke?: string;
  strokeWidth?: number;
  fontFamily?: string;
  fontSize?: number;
  fill?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  charSpacing?: number;
  flipX?: boolean;
  flipY?: boolean;
  hasShadow?: boolean;
}

interface PropertiesPanelProps {
  shirtColor: string;
  onShirtColorChange: (c: string) => void;
  shirtColorPresets?: { label: string; value: string }[];
  props: ObjectProps;
  onUpdate: (patch: Partial<ObjectProps>) => void;
  onLayer: (dir: "up" | "down" | "top" | "bottom") => void;
  onDuplicate: () => void;
  onToggleLock: () => void;
  cropActive?: boolean;
  onStartCrop?: () => void;
  onApplyCrop?: () => void;
  onCancelCrop?: () => void;
}

export function PropertiesPanel({
  shirtColor,
  onShirtColorChange,
  shirtColorPresets = [],
  props,
  onUpdate,
  onLayer,
  onDuplicate,
  onToggleLock,
  cropActive = false,
  onStartCrop,
  onApplyCrop,
  onCancelCrop,
}: PropertiesPanelProps) {
  return (
    <aside className="w-full border-t border-white/10 p-4 lg:w-72 lg:border-t-0 lg:border-l lg:overflow-y-auto lg:max-h-[calc(100vh-8rem)]">
      <h3 className="text-sm font-medium text-zinc-200">Properti</h3>

      <div className="mt-4 space-y-5">
        <div>
          <label className="text-xs text-zinc-500">Warna kaos</label>
          {shirtColorPresets.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {shirtColorPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => onShirtColorChange(preset.value)}
                  className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: preset.value,
                    borderColor: shirtColor === preset.value ? "#7c3aed" : "rgba(255,255,255,0.2)",
                  }}
                />
              ))}
            </div>
          )}
          <input
            type="color"
            value={shirtColor}
            onChange={(e) => onShirtColorChange(e.target.value)}
            className="mt-2 h-10 w-full cursor-pointer rounded-lg border border-white/10 bg-transparent"
          />
        </div>

        {props.kind === "none" && (
          <p className="text-xs leading-relaxed text-zinc-500">
            Tambah teks atau gambar dari toolbar kiri, lalu klik objek di canvas.
            Tarik untuk pindah, sudut untuk resize, handle atas untuk putar.
            Double-klik teks untuk mengedit isinya.
          </p>
        )}

        {props.kind !== "none" && (
          <>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={onDuplicate}>
                Duplikat
              </Button>
              <Button size="sm" variant="ghost" onClick={onToggleLock}>
                {props.locked ? "Unlock" : "Lock"}
              </Button>
            </div>

            <div>
              <p className="mb-2 text-xs text-zinc-500">Layer</p>
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" variant="ghost" onClick={() => onLayer("up")}>
                  Naik
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onLayer("down")}>
                  Turun
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onLayer("top")}>
                  Paling atas
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onLayer("bottom")}
                >
                  Paling bawah
                </Button>
              </div>
            </div>

            <div>
              <label className="text-xs text-zinc-500">Opacity</label>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={props.opacity ?? 1}
                onChange={(e) =>
                  onUpdate({ opacity: parseFloat(e.target.value) })
                }
                className="mt-2 w-full"
              />
            </div>
          </>
        )}

        {props.kind === "text" && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-violet-300">Teks</p>
            <div>
              <label className="text-xs text-zinc-500">Font</label>
              <select
                value={props.fontFamily ?? "Arial"}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="mt-1 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Ukuran"
              type="number"
              min={8}
              max={200}
              value={props.fontSize ?? 28}
              onChange={(e) =>
                onUpdate({ fontSize: parseInt(e.target.value, 10) || 28 })
              }
            />
            <div>
              <label className="text-xs text-zinc-500">Warna teks</label>
              <input
                type="color"
                value={props.fill ?? "#18181b"}
                onChange={(e) => onUpdate({ fill: e.target.value })}
                className="mt-1 h-10 w-full rounded-lg border border-white/10"
              />
            </div>
            <div>
              <label className="text-xs text-zinc-500">Outline (Stroke)</label>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={props.stroke ?? "#000000"}
                  onChange={(e) => onUpdate({ stroke: e.target.value })}
                  className="h-10 w-16 rounded-lg border border-white/10"
                />
                <Input
                  label="Width"
                  type="number"
                  min={0}
                  max={40}
                  value={props.strokeWidth ?? 0}
                  onChange={(e) => onUpdate({ strokeWidth: parseInt(e.target.value, 10) || 0 })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={props.fontWeight === "bold" ? "primary" : "ghost"}
                onClick={() =>
                  onUpdate({
                    fontWeight: props.fontWeight === "bold" ? "normal" : "bold",
                  })
                }
              >
                B
              </Button>
              <Button
                size="sm"
                variant={props.fontStyle === "italic" ? "primary" : "ghost"}
                onClick={() =>
                  onUpdate({
                    fontStyle: props.fontStyle === "italic" ? "normal" : "italic",
                  })
                }
              >
                I
              </Button>
            </div>
            <div>
              <label className="text-xs text-zinc-500">Align</label>
              <div className="mt-1 flex gap-1">
                {(["left", "center", "right"] as const).map((a) => (
                  <Button
                    key={a}
                    size="sm"
                    variant={props.textAlign === a ? "primary" : "ghost"}
                    onClick={() => onUpdate({ textAlign: a })}
                  >
                    {a}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              label="Letter spacing"
              type="number"
              value={props.charSpacing ?? 0}
              onChange={(e) =>
                onUpdate({ charSpacing: parseInt(e.target.value, 10) || 0 })
              }
            />
            <Button
              size="sm"
              variant={props.hasShadow ? "primary" : "ghost"}
              onClick={() => onUpdate({ hasShadow: !props.hasShadow })}
            >
              Shadow
            </Button>
          </div>
        )}

        {props.kind === "image" && (
          <div className="space-y-3 border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-violet-300">Gambar</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={props.flipX ? "primary" : "ghost"}
                onClick={() => onUpdate({ flipX: !props.flipX })}
              >
                Flip H
              </Button>
              <Button
                size="sm"
                variant={props.flipY ? "primary" : "ghost"}
                onClick={() => onUpdate({ flipY: !props.flipY })}
              >
                Flip V
              </Button>
            </div>
            <Button
              size="sm"
              variant={props.hasShadow ? "primary" : "ghost"}
              onClick={() => onUpdate({ hasShadow: !props.hasShadow })}
            >
              Shadow
            </Button>
            <div className="space-y-2 pt-2">
              {!cropActive ? (
                <Button size="sm" variant="secondary" onClick={() => onStartCrop?.()}>
                  Crop gambar
                </Button>
              ) : (
                <>
                  <p className="text-xs text-violet-300">
                    Geser/resize kotak ungu untuk area potong
                  </p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" onClick={() => onApplyCrop?.()}>
                      Terapkan
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => onCancelCrop?.()}>
                      Batal
                    </Button>
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-zinc-500">
              Crop memotong dari file asli (tanpa turun resolusi).
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}

export function readObjectProps(obj: FabricObject | null): ObjectProps {
  if (!obj) return { kind: "none" };

  const base = {
    locked: !!obj.lockMovementX,
    opacity: obj.opacity ?? 1,
    hasShadow: !!obj.shadow,
  };

  if (obj.type === "text" || obj.type === "i-text" || obj.type === "textbox") {
    const t = obj as FabricObject & {
      fontFamily?: string;
      fontSize?: number;
      fill?: string;
      fontWeight?: string | number;
      fontStyle?: string;
      textAlign?: string;
      charSpacing?: number;
    };
    return {
      kind: "text",
      ...base,
      fontFamily: t.fontFamily ?? "Arial",
      fontSize: t.fontSize ?? 28,
      fill: typeof t.fill === "string" ? t.fill : "#18181b",
      fontWeight: String(t.fontWeight ?? "normal"),
      fontStyle: t.fontStyle ?? "normal",
      textAlign: t.textAlign ?? "left",
      charSpacing: t.charSpacing ?? 0,
      stroke: typeof (t as any).stroke === "string" ? (t as any).stroke : undefined,
      strokeWidth: typeof (t as any).strokeWidth === "number" ? (t as any).strokeWidth : undefined,
    };
  }

  if (obj.type === "image") {
    return {
      kind: "image",
      ...base,
      flipX: !!obj.flipX,
      flipY: !!obj.flipY,
    };
  }

  return { kind: "other", ...base };
}
