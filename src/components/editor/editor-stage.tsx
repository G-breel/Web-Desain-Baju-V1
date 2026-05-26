"use client";

import type { RefObject } from "react";
import { ShirtMockup } from "@/components/editor/shirt-mockup";
import { PrintAreaOverlay } from "@/components/editor/print-area-overlay";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/editor/constants";
import type { DesignView, ProductType } from "@/types";

interface EditorStageProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  ready: boolean;
  zoom: number;
  productType: ProductType;
  activeView: DesignView;
  shirtColor: string;
  showPrintArea: boolean;
}

export function EditorStage({
  canvasRef,
  ready,
  zoom,
  productType,
  activeView,
  shirtColor,
  showPrintArea,
}: EditorStageProps) {
  const stageW = CANVAS_WIDTH * zoom;
  const stageH = CANVAS_HEIGHT * zoom;

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-3 shadow-2xl">
      <div className="relative overflow-hidden rounded-2xl bg-zinc-800/30 ring-1 ring-white/10" style={{ width: stageW, height: stageH }}>
        {/* Mockup di belakang — tidak menangkap klik */}
        <div className="pointer-events-none absolute inset-0 z-0">
          <ShirtMockup
            productType={productType}
            view={activeView}
            shirtColor={shirtColor}
            width={stageW}
            height={stageH}
          />
        </div>

        {/* Canvas Fabric — jangan pakai hidden/display:none saat init */}
        <canvas ref={canvasRef} />

        {ready && showPrintArea && (
          <PrintAreaOverlay
            view={activeView}
            visible={showPrintArea}
            canvasWidth={stageW}
            canvasHeight={stageH}
            zoom={zoom}
          />
        )}

        {!ready && (
          <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center bg-zinc-950/70 text-sm text-zinc-400">
            Memuat canvas...
          </div>
        )}
      </div>
    </div>
  );
}
