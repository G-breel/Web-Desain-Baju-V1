import type { FabricObject } from "fabric";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

const SNAP = 8;

export function isTextObject(obj: FabricObject) {
  return obj.type === "text" || obj.type === "i-text" || obj.type === "textbox";
}

export function isImageObject(obj: FabricObject) {
  return obj.type === "image";
}

export function snapObjectToGuides(obj: FabricObject) {
  const bound = obj.getBoundingRect();
  const cx = bound.left + bound.width / 2;
  const cy = bound.top + bound.height / 2;
  const canvasCx = CANVAS_WIDTH / 2;
  const canvasCy = CANVAS_HEIGHT / 2;

  let left = obj.left ?? 0;
  let top = obj.top ?? 0;

  if (Math.abs(cx - canvasCx) < SNAP) {
    left += canvasCx - cx;
  }
  if (Math.abs(cy - canvasCy) < SNAP) {
    top += canvasCy - cy;
  }
  if (Math.abs(bound.left) < SNAP) left -= bound.left;
  if (Math.abs(bound.top) < SNAP) top -= bound.top;
  if (Math.abs(CANVAS_WIDTH - (bound.left + bound.width)) < SNAP) {
    left -= CANVAS_WIDTH - (bound.left + bound.width);
  }
  if (Math.abs(CANVAS_HEIGHT - (bound.top + bound.height)) < SNAP) {
    top -= CANVAS_HEIGHT - (bound.top + bound.height);
  }

  obj.set({ left, top });
  obj.setCoords();
}

export const FONT_OPTIONS = [
  "Arial",
  "Georgia",
  "Impact",
  "Verdana",
  "Times New Roman",
  "Courier New",
  "Comic Sans MS",
];
