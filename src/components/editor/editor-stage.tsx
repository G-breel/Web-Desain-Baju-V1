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
  isOutside?: boolean;
  snapGuides?: { x: boolean; y: boolean };
}

export function EditorStage({
  canvasRef,
  ready,
  zoom,
  productType,
  activeView,
  shirtColor,
  showPrintArea,
  isOutside = false,
  snapGuides = { x: false, y: false },
}: EditorStageProps) {
  const stageW = CANVAS_WIDTH * zoom;
  const stageH = CANVAS_HEIGHT * zoom;

  return (
    <div className="rounded-3xl border border-white/10 bg-zinc-950/40 p-3 shadow-2xl">
      <div 
        className={`relative overflow-hidden rounded-2xl bg-zinc-800/30 ring-1 transition-all duration-200 ${
          isOutside 
            ? "ring-2 ring-red-500 shadow-lg shadow-red-500/20" 
            : "ring-white/10"
        }`} 
        style={{ width: stageW, height: stageH }}
      >
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

        {/* Center Snap Guides */}
        {ready && (snapGuides.x || snapGuides.y) && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {/* Vertical center line */}
            {snapGuides.x && (
              <div 
                className="absolute top-0 bottom-0 w-[2px] bg-violet-500 shadow-lg shadow-violet-500/50"
                style={{ left: `${stageW / 2}px`, transform: 'translateX(-50%)' }}
              />
            )}
            {/* Horizontal center line */}
            {snapGuides.y && (
              <div 
                className="absolute left-0 right-0 h-[2px] bg-violet-500 shadow-lg shadow-violet-500/50"
                style={{ top: `${stageH / 2}px`, transform: 'translateY(-50%)' }}
              />
            )}
          </div>
        )}

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
