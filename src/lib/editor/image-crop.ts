import type { Canvas, FabricImage, FabricObject, Rect } from "fabric";

const CROP_FRAME_KEY = "__cropFrame";

export type CropSession = {
  image: FabricImage;
  frame: Rect;
};

function getSourceSize(image: FabricImage) {
  const el = image.getElement() as HTMLImageElement | HTMLCanvasElement;
  const srcW =
    ("naturalWidth" in el && el.naturalWidth) || el.width || image.width || 1;
  const srcH =
    ("naturalHeight" in el && el.naturalHeight) || el.height || image.height || 1;
  return { srcW, srcH };
}

/** Buat kotak crop di atas gambar (resize/geser kotak = area potong) */
export async function startImageCrop(
  canvas: Canvas,
  image: FabricImage
): Promise<CropSession> {
  cancelImageCrop(canvas);

  const { Rect } = await import("fabric");
  const bound = image.getBoundingRect();
  const margin = 0.08;
  const frameW = Math.max(40, bound.width * (1 - margin * 2));
  const frameH = Math.max(40, bound.height * (1 - margin * 2));

  const frame = new Rect({
    left: bound.left + bound.width * margin,
    top: bound.top + bound.height * margin,
    width: frameW,
    height: frameH,
    fill: "rgba(124, 58, 237, 0.1)",
    stroke: "#7c3aed",
    strokeWidth: 2,
    strokeDashArray: [6, 4],
    originX: "left",
    originY: "top",
    hasRotatingPoint: false,
    lockRotation: true,
    name: CROP_FRAME_KEY,
  });

  image.set({ selectable: false, evented: false });
  canvas.add(frame);
  canvas.bringObjectToFront(frame);
  canvas.setActiveObject(frame);
  canvas.requestRenderAll();

  return { image, frame };
}

export function cancelImageCrop(canvas: Canvas) {
  const frame = canvas
    .getObjects()
    .find((o) => o.name === CROP_FRAME_KEY);

  const lockedImage = canvas
    .getObjects()
    .find((o) => o.isType("image") && !o.selectable) as FabricImage | undefined;

  if (lockedImage) {
    lockedImage.set({ selectable: true, evented: true });
  }
  if (frame) {
    canvas.remove(frame);
    canvas.requestRenderAll();
  }
}

/**
 * Potong gambar di resolusi sumber (cropX/cropY) — bukan raster ulang.
 */
export function applyImageCrop(canvas: Canvas, session: CropSession) {
  const { image, frame } = session;
  const { srcW, srcH } = getSourceSize(image);

  const currentCropX = image.cropX ?? 0;
  const currentCropY = image.cropY ?? 0;
  const currentW = image.width ?? srcW;
  const currentH = image.height ?? srcH;

  const cropBound = frame.getBoundingRect();
  const imgBound = image.getBoundingRect();

  const ix = Math.max(cropBound.left, imgBound.left);
  const iy = Math.max(cropBound.top, imgBound.top);
  const iw =
    Math.min(cropBound.left + cropBound.width, imgBound.left + imgBound.width) -
    ix;
  const ih =
    Math.min(cropBound.top + cropBound.height, imgBound.top + imgBound.height) -
    iy;

  if (iw < 4 || ih < 4) {
    throw new Error("Area crop terlalu kecil");
  }

  const relLeft = (ix - imgBound.left) / imgBound.width;
  const relTop = (iy - imgBound.top) / imgBound.height;
  const relW = iw / imgBound.width;
  const relH = ih / imgBound.height;

  const cropX = Math.round(
    Math.max(0, Math.min(currentCropX + relLeft * currentW, srcW - 1))
  );
  const cropY = Math.round(
    Math.max(0, Math.min(currentCropY + relTop * currentH, srcH - 1))
  );
  const cropW = Math.round(Math.max(1, Math.min(relW * currentW, srcW - cropX)));
  const cropH = Math.round(Math.max(1, Math.min(relH * currentH, srcH - cropY)));

  image.set({
    cropX,
    cropY,
    width: cropW,
    height: cropH,
    scaleX: iw / cropW,
    scaleY: ih / cropH,
    left: ix,
    top: iy,
    selectable: true,
    evented: true,
  });

  image.setCoords();
  canvas.remove(frame);
  canvas.setActiveObject(image);
  canvas.requestRenderAll();
}

export function isCropFrame(obj: FabricObject) {
  return obj.name === CROP_FRAME_KEY;
}
