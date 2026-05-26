import type { DesignView } from "@/types";

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
