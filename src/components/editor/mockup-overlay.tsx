"use client";

import { ShirtMockup } from "@/components/editor/shirt-mockup";
import type { DesignView, ProductType } from "@/types";

interface MockupOverlayProps {
  productType: ProductType;
  view: DesignView;
  shirtColor: string;
  width?: number;
  height?: number;
}

/** @deprecated Gunakan EditorStage + ShirtMockup langsung di editor */
export function MockupOverlay({
  productType,
  view,
  shirtColor,
  width,
  height,
}: MockupOverlayProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
      <ShirtMockup
        productType={productType}
        view={view}
        shirtColor={shirtColor}
        width={width}
        height={height}
      />
    </div>
  );
}
