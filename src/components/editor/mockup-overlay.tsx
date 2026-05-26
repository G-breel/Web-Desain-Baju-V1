"use client";

import { getMockupSrc } from "@/lib/editor/mockup-helpers";
import type { DesignView, ProductType } from "@/types";

interface MockupOverlayProps {
  productType: ProductType;
  view: DesignView;
  shirtColor: string;
  width: number;
  height: number;
}

export function MockupOverlay({
  productType,
  view,
  shirtColor,
  width,
  height,
}: MockupOverlayProps) {
  const src = getMockupSrc(productType, view);

  return (
    <div
      className="absolute inset-0 z-0 rounded-lg"
      style={{ width, height }}
      aria-hidden="true"
    >
      {/* Warna baju */}
      <div
        className="absolute inset-0 rounded-lg"
        style={{ backgroundColor: shirtColor }}
      />
      {/* Outline/detail baju — pakai img biasa, bukan next/image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        width={width}
        height={height}
        className="absolute inset-0 h-full w-full rounded-lg object-contain"
        draggable={false}
      />
    </div>
  );
}
