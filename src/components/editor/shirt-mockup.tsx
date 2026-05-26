"use client";

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

function OversizeTshirtFront({ color }: { color: string }) {
  const shade = darken(color, 0.18);
  const highlight = lighten(color, 0.2);
  return (
    <>
      <ellipse cx="200" cy="452" rx="118" ry="14" fill="#000" opacity="0.14" />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill={color}
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill="url(#shirtGradFront)"
        opacity={0.35}
      />
      <path
        d="M62 188 L62 280 Q200 295 338 280 L338 188"
        fill="none"
        stroke={shade}
        strokeWidth="1"
        opacity={0.35}
      />
      <path
        d="M148 102 Q200 138 252 102 Q200 88 148 102 Z"
        fill={highlight}
        opacity={0.5}
      />
      <path
        d="M148 102 Q200 138 252 102"
        fill="none"
        stroke="rgba(0,0,0,0.22)"
        strokeWidth="1.5"
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M28 168 L62 188 M372 168 L338 188"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="1"
      />
    </>
  );
}

function OversizeTshirtBack({ color }: { color: string }) {
  const shade = darken(color, 0.18);
  return (
    <>
      <ellipse cx="200" cy="452" rx="118" ry="14" fill="#000" opacity="0.14" />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill={color}
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill="url(#shirtGradBack)"
        opacity={0.3}
      />
      <path
        d="M158 104 Q200 112 242 104"
        fill="none"
        stroke="rgba(0,0,0,0.25)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill="none"
        stroke="rgba(0,0,0,0.28)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M62 220 L338 220" stroke={shade} strokeWidth="0.8" opacity={0.25} />
    </>
  );
}

function OversizeTshirtSide({ color }: { color: string }) {
  return (
    <>
      <ellipse cx="200" cy="452" rx="100" ry="12" fill="#000" opacity="0.12" />
      <path
        d="M155 105 L115 138 L88 172 L115 192 L115 432 L285 432 L285 192 L312 172 L285 138 L245 105 Q220 120 200 122 Q180 120 155 105 Z"
        fill={color}
      />
      <path
        d="M155 105 L115 138 L88 172 L115 192 L115 432 L285 432 L285 192 L312 172 L285 138 L245 105 Q220 120 200 122 Q180 120 155 105 Z"
        fill="url(#shirtGradSide)"
        opacity={0.32}
      />
      <path
        d="M155 105 L115 138 L88 172 L115 192 L115 432 L285 432 L285 192 L312 172 L285 138 L245 105 Q220 120 200 122 Q180 120 155 105 Z"
        fill="none"
        stroke="rgba(0,0,0,0.26)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M200 122 L200 432"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1"
        strokeDasharray="4 6"
      />
    </>
  );
}

function HoodieFront({ color }: { color: string }) {
  const shade = darken(color, 0.2);
  const highlight = lighten(color, 0.18);
  return (
    <>
      <ellipse cx="200" cy="452" rx="118" ry="14" fill="#000" opacity="0.14" />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill={color}
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill="url(#shirtGradFront)"
        opacity={0.32}
      />
      <path
        d="M130 95 Q200 55 270 95 L255 125 Q200 105 145 125 Z"
        fill={shade}
        opacity={0.45}
      />
      <path
        d="M145 125 Q200 108 255 125 L248 155 Q200 142 152 155 Z"
        fill={highlight}
        opacity={0.35}
      />
      <path
        d="M198 155 L198 432"
        stroke="rgba(0,0,0,0.12)"
        strokeWidth="1.2"
        strokeDasharray="5 4"
      />
      <path
        d="M145 300 Q200 292 255 300 L258 365 Q200 372 142 365 Z"
        fill="none"
        stroke="rgba(0,0,0,0.18)"
        strokeWidth="1.2"
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 122 200 126 Q115 122 88 98 Z"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </>
  );
}

function HoodieBack({ color }: { color: string }) {
  return (
    <>
      <ellipse cx="200" cy="452" rx="118" ry="14" fill="#000" opacity="0.14" />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill={color}
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill="url(#shirtGradBack)"
        opacity={0.3}
      />
      <path
        d="M120 92 Q200 48 280 92 L268 118 Q200 78 132 118 Z"
        fill="rgba(0,0,0,0.12)"
      />
      <path
        d="M88 98 L48 132 L28 168 L62 188 L62 432 L338 432 L338 188 L372 168 L352 132 L312 98 Q285 118 200 120 Q115 118 88 98 Z"
        fill="none"
        stroke="rgba(0,0,0,0.3)"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </>
  );
}

function HoodieSide({ color }: { color: string }) {
  return <OversizeTshirtSide color={color} />;
}

function MockupContent({
  productType,
  view,
  shirtColor,
}: {
  productType: ProductType;
  view: DesignView;
  shirtColor: string;
}) {
  if (productType === "hoodie") {
    if (view === "front") return <HoodieFront color={shirtColor} />;
    if (view === "back") return <HoodieBack color={shirtColor} />;
    return <HoodieSide color={shirtColor} />;
  }
  if (view === "front") return <OversizeTshirtFront color={shirtColor} />;
  if (view === "back") return <OversizeTshirtBack color={shirtColor} />;
  return <OversizeTshirtSide color={shirtColor} />;
}

export function ShirtMockup({
  productType,
  view,
  shirtColor,
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
}: ShirtMockupProps) {
  return (
    <svg
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      width={width}
      height={height}
      className="h-full w-full"
      aria-hidden
    >
      <defs>
        <linearGradient id="shirtGradFront" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.35" />
          <stop offset="55%" stopColor="#fff" stopOpacity="0" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id="shirtGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <linearGradient id="shirtGradSide" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#000" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#fff" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <rect width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="#18181b" opacity={0.03} />
      <MockupContent productType={productType} view={view} shirtColor={shirtColor} />
    </svg>
  );
}
