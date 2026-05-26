"use client";

import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/editor/constants";
import { getPrintArea } from "@/lib/editor/mockup-helpers";
import type { DesignView } from "@/types";

interface PrintAreaOverlayProps {
  view: DesignView;
  visible: boolean;
  canvasWidth: number;
  canvasHeight: number;
  zoom: number;
}

export function PrintAreaOverlay({
  view,
  visible,
  canvasWidth,
  canvasHeight,
  zoom,
}: PrintAreaOverlayProps) {
  if (!visible) return null;

  const area = getPrintArea(view);
  const scale = zoom || canvasWidth / CANVAS_WIDTH || canvasHeight / CANVAS_HEIGHT || 1;
  const label = `${Math.round(area.width / 8)} × ${Math.round(area.height / 8)} cm`;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 rounded-lg"
      style={{ width: canvasWidth, height: canvasHeight }}
      aria-hidden="true"
    >
      <div
        className="absolute rounded-2xl border border-violet-400/60 bg-violet-500/5 shadow-[0_0_0_1px_rgba(124,58,237,0.15),0_0_30px_rgba(124,58,237,0.12)]"
        style={{
          top: area.top * scale,
          left: area.left * scale,
          width: area.width * scale,
          height: area.height * scale,
        }}
      >
        <div className="absolute -top-8 left-0 rounded-full border border-violet-400/30 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-medium text-violet-200 shadow-lg shadow-black/30 select-none">
          Area Cetak · {label}
        </div>
        <div className="absolute inset-0 rounded-2xl border border-dashed border-violet-400/45" />
      </div>
    </div>
  );
}
