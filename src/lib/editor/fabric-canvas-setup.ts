import type { Canvas, FabricObject, FabricObjectProps } from "fabric";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "./constants";

/** Warna handle seleksi ala Canva */
export const SELECTION_ACCENT = "#7c3aed";

const INTERACTIVE_DEFAULTS: Partial<FabricObjectProps> = {
  transparentCorners: false,
  cornerColor: "#ffffff",
  cornerStrokeColor: SELECTION_ACCENT,
  borderColor: SELECTION_ACCENT,
  cornerSize: 12,
  cornerStyle: "circle",
  padding: 8,
  borderScaleFactor: 2,
  touchCornerSize: 28,
};

/**
 * Fabric v7 memakai ownDefaults, bukan prototype — harus di-merge ke sini.
 */
export function applyFabricEditorDefaults(
  InteractiveFabricObjectClass: {
    ownDefaults: Partial<FabricObjectProps>;
  }
) {
  Object.assign(InteractiveFabricObjectClass.ownDefaults, INTERACTIVE_DEFAULTS);
}

export function ensureObjectInteractive(obj: FabricObject) {
  const locked = !!obj.lockMovementX && !!obj.lockMovementY;
  obj.set({
    selectable: !locked,
    evented: true,
    hasControls: !locked,
    hasBorders: true,
  });
}

export function ensureAllObjectsInteractive(canvas: Canvas) {
  canvas.getObjects().forEach(ensureObjectInteractive);
}

/** Posisikan wrapper Fabric di atas mockup */
export function attachCanvasWrapper(canvas: Canvas) {
  const wrapper = canvas.wrapperEl;
  if (!wrapper) return;

  wrapper.style.position = "absolute";
  wrapper.style.inset = "0";
  wrapper.style.width = "100%";
  wrapper.style.height = "100%";
  wrapper.style.zIndex = "10";

  const upper = canvas.upperCanvasEl;
  if (upper) {
    upper.style.pointerEvents = "auto";
    upper.style.cursor = "default";
  }
}

/** Hitung ulang offset pointer setelah layout/zoom berubah */
export function refreshCanvasLayout(canvas: Canvas, zoom: number) {
  canvas.setZoom(zoom);
  canvas.setDimensions({
    width: CANVAS_WIDTH * zoom,
    height: CANVAS_HEIGHT * zoom,
  });
  attachCanvasWrapper(canvas);
  canvas.calcOffset();
  canvas.requestRenderAll();
}

export const FABRIC_CANVAS_OPTIONS = {
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
  backgroundColor: "transparent",
  preserveObjectStacking: true,
  selection: true,
  enableRetinaScaling: true,
  stopContextMenu: true,
} as const;
