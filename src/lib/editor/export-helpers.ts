import type { DesignView, ProductType } from "@/types";

export interface WearFileData {
  version: string;
  format: "wear";
  title: string;
  productType: ProductType;
  shirtColor: string;
  views: Record<DesignView, unknown>;
}

/**
 * Trigger download file di browser.
 */
export function downloadFile(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

/**
 * Serializes seluruh project ke JSON string format .wear
 */
export function buildWearFile(
  views: Record<DesignView, unknown>,
  productType: ProductType,
  shirtColor: string,
  title: string
): string {
  const data: WearFileData = {
    version: "1.0",
    format: "wear",
    title,
    productType,
    shirtColor,
    views,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Memvalidasi dan mem-parse string JSON ke WearFileData.
 * Throws Error dengan pesan deskriptif jika tidak valid.
 */
export function parseWearFile(jsonString: string): WearFileData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error("File tidak valid: bukan format JSON yang benar.");
  }

  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("File tidak valid: struktur tidak dikenali.");
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.format !== "wear") {
    throw new Error('File tidak valid: bukan format .wear (field "format" harus "wear").');
  }

  if (typeof obj.title !== "string") {
    throw new Error('File tidak valid: field "title" harus berupa string.');
  }

  if (obj.productType !== "oversize-tshirt" && obj.productType !== "hoodie") {
    throw new Error('File tidak valid: field "productType" harus "oversize-tshirt" atau "hoodie".');
  }

  if (typeof obj.shirtColor !== "string") {
    throw new Error('File tidak valid: field "shirtColor" harus berupa string.');
  }

  if (typeof obj.views !== "object" || obj.views === null) {
    throw new Error('File tidak valid: field "views" harus berupa object.');
  }

  return obj as unknown as WearFileData;
}

/**
 * Export canvas sebagai PNG atau JPG dan trigger download.
 */
export function exportCanvasImage(
  dataUrl: string,
  format: "png" | "jpg",
  title: string,
  view: DesignView
): void {
  const ext = format === "jpg" ? "jpg" : "png";
  const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "_");
  downloadFile(dataUrl, `${safeName}-${view}.${ext}`);
}

/**
 * Export canvas data semua view sebagai JSON dan trigger download.
 */
export function exportCanvasJson(
  views: Record<DesignView, unknown>,
  title: string
): void {
  const json = JSON.stringify(views, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "_");
  downloadFile(url, `${safeName}.json`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Export project sebagai .wear file dan trigger download.
 */
export function exportWearFile(
  views: Record<DesignView, unknown>,
  productType: ProductType,
  shirtColor: string,
  title: string
): void {
  const content = buildWearFile(views, productType, shirtColor, title);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const safeName = title.replace(/[^a-zA-Z0-9-_]/g, "_");
  downloadFile(url, `${safeName}.wear`);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
