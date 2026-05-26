import type { DesignView, ProductType } from "@/types";

export const DESIGN_VIEWS: { id: DesignView; label: string }[] = [
  { id: "front", label: "Depan" },
  { id: "back", label: "Belakang" },
  { id: "left", label: "Kiri" },
  { id: "right", label: "Kanan" },
];

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 480;

export const DEFAULT_SHIRT_COLOR = "#e4e4e7";

export const EMPTY_CANVAS_DATA: Record<DesignView, object | null> = {
  front: null,
  back: null,
  left: null,
  right: null,
};

// Preset warna baju
export const SHIRT_COLOR_PRESETS: { label: string; value: string }[] = [
  { label: "Putih", value: "#f4f4f5" },
  { label: "Hitam", value: "#18181b" },
  { label: "Abu", value: "#71717a" },
  { label: "Navy", value: "#1e3a5f" },
  { label: "Merah", value: "#dc2626" },
  { label: "Biru Muda", value: "#60a5fa" },
  { label: "Hijau Army", value: "#4a5c3f" },
  { label: "Krem", value: "#f5f0e8" },
  { label: "Kuning", value: "#fbbf24" },
  { label: "Ungu", value: "#7c3aed" },
];

// Path mockup per product type dan view
export const MOCKUP_PATHS: Record<ProductType, Record<DesignView, string>> = {
  "oversize-tshirt": {
    front: "/mockups/oversize-tshirt-front.svg",
    back: "/mockups/oversize-tshirt-back.svg",
    left: "/mockups/oversize-tshirt-left.svg",
    right: "/mockups/oversize-tshirt-right.svg",
  },
  hoodie: {
    front: "/mockups/hoodie-front.svg",
    back: "/mockups/hoodie-back.svg",
    left: "/mockups/hoodie-left.svg",
    right: "/mockups/hoodie-right.svg",
  },
};

// Dimensi print area per view (dalam piksel, relatif terhadap canvas 400x480)
export const PRINT_AREAS: Record<DesignView, { top: number; left: number; width: number; height: number }> = {
  front:  { top: 80,  left: 80,  width: 240, height: 280 },
  back:   { top: 80,  left: 80,  width: 240, height: 280 },
  left:   { top: 100, left: 120, width: 160, height: 220 },
  right:  { top: 100, left: 120, width: 160, height: 220 },
};
