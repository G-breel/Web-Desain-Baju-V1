"use client";

import { ShirtMockup } from "@/components/editor/shirt-mockup";
import type { DesignView, ProductType } from "@/types";

export function ViewThumbnails({
  productType,
  active,
  onChange,
  shirtColor,
  viewThumbnails = {},
}: {
  productType: ProductType;
  active: DesignView;
  onChange: (v: DesignView) => void;
  shirtColor: string;
  viewThumbnails?: Partial<Record<DesignView, string>>;
}) {
  const views: { id: DesignView; label: string }[] = [
    { id: "front", label: "Depan" },
    { id: "back", label: "Belakang" },
    { id: "left", label: "Kiri" },
    { id: "right", label: "Kanan" },
  ];

  return (
    <div className="hidden items-end gap-2 sm:flex">
      {views.map((v) => {
        const thumb = viewThumbnails[v.id];
        const isActive = active === v.id;

        return (
          <button
            key={v.id}
            type="button"
            onClick={() => onChange(v.id)}
            className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition ${
              isActive
                ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-600/10"
                : "border-white/10 bg-white/5 hover:bg-white/10"
            }`}
            title={v.label}
          >
            {/* Thumbnail area — mockup + overlay desain */}
            <div className="relative h-11 w-9 overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/10">
              {/* Mockup baju di belakang */}
              <ShirtMockup
                productType={productType}
                view={v.id}
                shirtColor={shirtColor}
                width={36}
                height={44}
              />

              {/* Overlay desain dari canvas — muncul kalau ada thumbnail */}
              {thumb && (
                <img
                  src={thumb}
                  alt=""
                  className="absolute inset-0 h-full w-full object-contain"
                  draggable={false}
                />
              )}

              {/* Dot indikator kalau ada desain tapi belum ada thumbnail */}
              {!thumb && (
                <div className="absolute bottom-1 right-1 h-1.5 w-1.5 rounded-full bg-zinc-600" />
              )}
            </div>

            <span
              className={`text-[10px] font-medium ${
                isActive ? "text-violet-200" : "text-zinc-400"
              }`}
            >
              {v.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
