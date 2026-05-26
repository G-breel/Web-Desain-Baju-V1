import type { DesignView, ProductType } from "@/types";
import { MOCKUP_PATHS, PRINT_AREAS } from "./constants";

export interface PrintAreaConfig {
  top: number;
  left: number;
  width: number;
  height: number;
}

/**
 * Mengembalikan path gambar mockup untuk kombinasi product type dan view tertentu.
 */
export function getMockupSrc(productType: ProductType, view: DesignView): string {
  return MOCKUP_PATHS[productType][view];
}

/**
 * Mengembalikan dimensi print area aman untuk view tertentu.
 */
export function getPrintArea(view: DesignView): PrintAreaConfig {
  return PRINT_AREAS[view];
}
