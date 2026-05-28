import type { FabricObject } from "fabric";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";
import { getPrintArea } from "./mockup-helpers";
import type { DesignView } from "@/types";

const SNAP = 8;

export function isTextObject(obj: FabricObject) {
  return obj.type === "text" || obj.type === "i-text" || obj.type === "textbox";
}

export function isImageObject(obj: FabricObject) {
  return obj.type === "image";
}

/**
 * Constrain object movement to stay within print area boundaries.
 * If object is larger than print area, it will be clamped to fit inside.
 */
export function constrainToPrintArea(obj: FabricObject, view: DesignView) {
  const printArea = getPrintArea(view);
  const bound = obj.getBoundingRect();

  // Jika objek lebih lebar dari area cetak, scale down
  if (bound.width > printArea.width || bound.height > printArea.height) {
    const scaleX = (obj.scaleX ?? 1);
    const scaleY = (obj.scaleY ?? 1);
    const shrink = Math.min(
      printArea.width / bound.width,
      printArea.height / bound.height
    );
    obj.set({
      scaleX: scaleX * shrink,
      scaleY: scaleY * shrink,
    });
    obj.setCoords();
    // Recalculate bound after scale
    const newBound = obj.getBoundingRect();
    bound.left = newBound.left;
    bound.top = newBound.top;
    bound.width = newBound.width;
    bound.height = newBound.height;
  }

  let left = obj.left ?? 0;
  let top = obj.top ?? 0;

  // Constrain left edge
  if (bound.left < printArea.left) {
    left += printArea.left - bound.left;
  }

  // Constrain top edge
  if (bound.top < printArea.top) {
    top += printArea.top - bound.top;
  }

  // Constrain right edge
  if (bound.left + bound.width > printArea.left + printArea.width) {
    left -= (bound.left + bound.width) - (printArea.left + printArea.width);
  }

  // Constrain bottom edge
  if (bound.top + bound.height > printArea.top + printArea.height) {
    top -= (bound.top + bound.height) - (printArea.top + printArea.height);
  }

  obj.set({ left, top });
  obj.setCoords();
}

/**
 * Snap object to center guides (horizontal and vertical center lines).
 * Returns snap state and "near" state (within 24px) for showing guide lines.
 */
export function snapToCenter(obj: FabricObject, view: DesignView): { x: boolean; y: boolean; nearX: boolean; nearY: boolean } {
  const printArea = getPrintArea(view);
  const bound = obj.getBoundingRect();
  
  const objCenterX = bound.left + bound.width / 2;
  const objCenterY = bound.top + bound.height / 2;
  
  const areaCenterX = printArea.left + printArea.width / 2;
  const areaCenterY = printArea.top + printArea.height / 2;
  
  const NEAR = 24; // show guide line when within 24px
  
  let left = obj.left ?? 0;
  let top = obj.top ?? 0;
  let snapX = false;
  let snapY = false;
  
  // Snap to vertical center line
  if (Math.abs(objCenterX - areaCenterX) < SNAP) {
    left += areaCenterX - objCenterX;
    snapX = true;
  }
  
  // Snap to horizontal center line
  if (Math.abs(objCenterY - areaCenterY) < SNAP) {
    top += areaCenterY - objCenterY;
    snapY = true;
  }
  
  obj.set({ left, top });
  obj.setCoords();
  
  // Recalculate after snap for near detection
  const newBound = obj.getBoundingRect();
  const newCX = newBound.left + newBound.width / 2;
  const newCY = newBound.top + newBound.height / 2;
  
  return {
    x: snapX,
    y: snapY,
    nearX: Math.abs(newCX - areaCenterX) < NEAR,
    nearY: Math.abs(newCY - areaCenterY) < NEAR,
  };
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
  "Helvetica",
  "Tahoma",
  "Trebuchet MS",
  "Verdana",
  "Georgia",
  "Garamond",
  "Palatino Linotype",
  "Times New Roman",
  "Book Antiqua",
  "Impact",
  "Courier New",
  "Lucida Console",
  "Comic Sans MS",
];
