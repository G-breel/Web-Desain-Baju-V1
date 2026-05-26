"use client";

import { getPrintArea } from "@/lib/editor/mockup-helpers";
import type { DesignView } from "@/types";

interface PrintAreaOverlayProps {
  view: DesignView;
  visible: boolean;
  canvasWidth: number;
  canvasHeight: number;
}

export function PrintAreaOverlay({
  view,
  visible,
  canvasWidth,
  canvasHeight,
}: PrintAreaOverlayProps) {
  if (!visible) return null;

  const area = getPrintArea(view);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 rounded-lg"
      style={{ width: canvasWidth, height: canvasHeight }}
      aria-hidden="true"
    >
      <div
        className="absolute rounded border-2 border-dashed border-violet-400/70"
        style={{
          top: area.top,
          left: area.left,
          width: area.width,
          height: area.height,
        }}
      >
        <span className="absolute -top-5 left-0 text-[10px] font-medium text-violet-400/80 select-none">
          Area Cetak
        </span>
      </div>
    </div>
  );
}
