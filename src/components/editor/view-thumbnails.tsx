"use client";

import { ShirtMockup } from "@/components/editor/shirt-mockup";
import type { DesignView, ProductType } from "@/types";

export function ViewThumbnails({
  productType,
  active,
  onChange,
  shirtColor,
}: {
  productType: ProductType;
  active: DesignView;
  onChange: (v: DesignView) => void;
  shirtColor: string;
}) {
  const views: { id: DesignView; label: string }[] = [
    { id: "front", label: "Depan" },
    { id: "back", label: "Belakang" },
    { id: "left", label: "Kiri" },
    { id: "right", label: "Kanan" },
  ];

  return (
    <div className="hidden items-end gap-2 sm:flex">
      {views.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={`flex flex-col items-center gap-1 rounded-xl border p-1.5 transition ${active === v.id ? "border-violet-500 bg-violet-500/10 shadow-lg shadow-violet-600/10" : "border-white/10 bg-white/5 hover:bg-white/10"}`}
          title={v.label}
        >
          <div className="h-11 w-9 overflow-hidden rounded-md bg-zinc-800 ring-1 ring-white/10">
            <ShirtMockup productType={productType} view={v.id} shirtColor={shirtColor} width={40} height={48} />
          </div>
          <span className={`text-[10px] font-medium ${active === v.id ? "text-violet-200" : "text-zinc-400"}`}>
            {v.label}
          </span>
        </button>
      ))}
    </div>
  );
}
