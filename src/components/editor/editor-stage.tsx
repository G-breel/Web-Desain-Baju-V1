"use client";

import type { RefObject } from "react";
import { ShirtMockup } from "@/components/editor/shirt-mockup";
import { PrintAreaOverlay } from "@/components/editor/print-area-overlay";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/editor/constants";
import { getPrintArea } from "@/lib/editor/mockup-helpers";
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
  snapGuides?: { x: boolean; y: boolean; nearX: boolean; nearY: boolean };
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
  snapGuides = { x: false, y: false, nearX: false, nearY: false },
}: EditorStageProps) {
  const stageW = CANVAS_WIDTH * zoom;
  const stageH = CANVAS_HEIGHT * zoom;

  // Print area center in screen pixels (scaled by zoom)
  const printArea = getPrintArea(activeView);
  const centerX = (printArea.left + printArea.width / 2) * zoom;
  const centerY = (printArea.top + printArea.height / 2) * zoom;

  const showGuideX = snapGuides.nearX || snapGuides.x;
  const showGuideY = snapGuides.nearY || snapGuides.y;

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

        {/* Canvas Fabric */}
        <canvas ref={canvasRef} />

        {/* Center Snap Guides — muncul saat mendekati atau snap ke tengah */}
        {ready && (showGuideX || showGuideY) && (
          <div className="pointer-events-none absolute inset-0 z-20">
            {/* Vertical center line (melewati seluruh tinggi canvas) */}
            {showGuideX && (
              <>
                <div
                  className="absolute top-0 bottom-0 transition-all duration-75"
                  style={{
                    left: centerX,
                    width: snapGuides.x ? 2 : 1,
                    transform: "translateX(-50%)",
                    background: snapGuides.x
                      ? "rgba(139,92,246,1)"   // solid violet saat snap
                      : "rgba(139,92,246,0.45)", // transparan saat near
                    boxShadow: snapGuides.x ? "0 0 8px rgba(139,92,246,0.8)" : "none",
                  }}
                />
                {/* Label tengah vertikal */}
                {snapGuides.x && (
                  <div
                    className="absolute rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg"
                    style={{ left: centerX + 6, top: 8 }}
                  >
                    Tengah
                  </div>
                )}
              </>
            )}
            {/* Horizontal center line (melewati seluruh lebar canvas) */}
            {showGuideY && (
              <>
                <div
                  className="absolute left-0 right-0 transition-all duration-75"
                  style={{
                    top: centerY,
                    height: snapGuides.y ? 2 : 1,
                    transform: "translateY(-50%)",
                    background: snapGuides.y
                      ? "rgba(139,92,246,1)"
                      : "rgba(139,92,246,0.45)",
                    boxShadow: snapGuides.y ? "0 0 8px rgba(139,92,246,0.8)" : "none",
                  }}
                />
                {/* Label tengah horizontal */}
                {snapGuides.y && (
                  <div
                    className="absolute rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-lg"
                    style={{ top: centerY + 6, left: 8 }}
                  >
                    Tengah
                  </div>
                )}
              </>
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
