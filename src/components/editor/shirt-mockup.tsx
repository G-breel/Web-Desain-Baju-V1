"use client";

import { getMockupSrc } from "@/lib/editor/mockup-helpers";
import type { DesignView, ProductType } from "@/types";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/editor/constants";

interface ShirtMockupProps {
  productType: ProductType;
  view: DesignView;
  shirtColor: string;
  width?: number;
  height?: number;
}

/**
 * Hitung apakah warna termasuk gelap (luminance < 0.35).
 * Dipakai untuk memilih blend mode yang tepat.
 */
function isDark(hex: string): boolean {
  const c = hex.replace("#", "");
  if (c.length < 6) return false;
  const r = parseInt(c.slice(0, 2), 16) / 255;
  const g = parseInt(c.slice(2, 4), 16) / 255;
  const b = parseInt(c.slice(4, 6), 16) / 255;
  // Relative luminance (sRGB)
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum < 0.35;
}

export function ShirtMockup({
  productType,
  view,
  shirtColor,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
}: ShirtMockupProps) {
  const src = getMockupSrc(productType, view);
  const dark = isDark(shirtColor);
  const isSideView = view === "left" || view === "right";
  const shirtMask = {
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  } as const;

  return (
    <div
      className="relative overflow-hidden rounded-xl"
      style={{ width, height }}
      aria-hidden="true"
    >
      {/* Layer 1: background editor putih */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "#ffffff" }}
      />

      {/* Layer 2: warna kaos, hanya pada siluet baju */}
      <div
        className="absolute inset-0"
        style={{ ...shirtMask, backgroundColor: shirtColor }}
      />

      {/* Layer 3: shading dimensi, hanya pada siluet baju */}
      <div
        className="absolute inset-0"
        style={{
          ...shirtMask,
          background: dark
            ? isSideView
              ? "radial-gradient(ellipse at 45% 18%, rgba(255,255,255,0.18) 0%, transparent 52%), linear-gradient(160deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.24) 100%)"
              : "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.12) 0%, transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0.18) 100%)"
            : isSideView
              ? "radial-gradient(ellipse at 45% 18%, rgba(255,255,255,0.34) 0%, transparent 52%), linear-gradient(160deg, rgba(255,255,255,0.18) 0%, rgba(0,0,0,0.2) 100%)"
              : "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.25) 0%, transparent 55%), linear-gradient(160deg, rgba(255,255,255,0.12) 0%, rgba(0,0,0,0.14) 100%)",
        }}
      />

      {/* Layer 4: border siluet agar bentuk tegas & simetris terlihat jelas */}
      <div
        className="absolute inset-0"
        style={{
          ...shirtMask,
          boxShadow: dark
            ? isSideView
              ? "inset 0 0 0 2px rgba(255,255,255,0.28), inset -8px 0 22px rgba(0,0,0,0.24), inset 8px 0 12px rgba(255,255,255,0.08)"
              : "inset 0 0 0 2px rgba(255,255,255,0.2), inset 0 -10px 24px rgba(0,0,0,0.18)"
            : isSideView
              ? "inset 0 0 0 2px rgba(41,37,36,0.28), inset -8px 0 20px rgba(0,0,0,0.16), inset 8px 0 10px rgba(255,255,255,0.18)"
              : "inset 0 0 0 2px rgba(41,37,36,0.16), inset 0 -10px 24px rgba(0,0,0,0.12)",
        }}
      />
    </div>
  );
}
