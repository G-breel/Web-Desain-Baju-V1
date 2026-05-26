"use client";

import { createElement } from "react";
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

function darken(hex: string, amount = 0.12): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = Math.max(0, parseInt(c.slice(0, 2), 16) * (1 - amount));
  const g = Math.max(0, parseInt(c.slice(2, 4), 16) * (1 - amount));
  const b = Math.max(0, parseInt(c.slice(4, 6), 16) * (1 - amount));
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

function lighten(hex: string, amount = 0.15): string {
  const c = hex.replace("#", "");
  if (c.length < 6) return hex;
  const r = Math.min(255, parseInt(c.slice(0, 2), 16) + 255 * amount);
  const g = Math.min(255, parseInt(c.slice(2, 4), 16) + 255 * amount);
  const b = Math.min(255, parseInt(c.slice(4, 6), 16) + 255 * amount);
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export function ShirtMockup({
  productType,
  view,
  shirtColor,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
}: ShirtMockupProps) {
  const src = getMockupSrc(productType, view);
  const shadow = darken(shirtColor, 0.18);
  const highlight = "rgba(255,255,255,0.16)";

  return createElement(
    "div",
    {
      className: "relative overflow-hidden rounded-xl",
      style: { width, height },
      "aria-hidden": true,
    },
    createElement("div", {
      className: "absolute inset-0",
      style: {
        backgroundColor: shirtColor,
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      },
    }),
    createElement("div", {
      className: "absolute inset-0 opacity-65",
      style: {
        background: `radial-gradient(circle at 50% 16%, ${highlight} 0%, transparent 30%), linear-gradient(135deg, rgba(255,255,255,0.08), rgba(0,0,0,0.22))`,
      },
    }),
    createElement("img", {
      src,
      alt: "",
      className: "absolute inset-0 h-full w-full select-none object-contain",
      draggable: false,
      style: {
        filter: `drop-shadow(0 20px 26px ${shadow}44)`,
        mixBlendMode: "multiply",
        opacity: 0.96,
      },
    })
  );
}
