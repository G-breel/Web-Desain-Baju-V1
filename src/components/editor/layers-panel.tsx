"use client";

import { useEffect, useState } from "react";
import type { Canvas } from "fabric";
import { Button } from "@/components/ui/button";

export function LayersPanel({
  fabricRef,
  onSelect,
}: {
  fabricRef: React.RefObject<Canvas | null>;
  onSelect?: (idx: number) => void;
}) {
  const [items, setItems] = useState<string[]>([]);

  useEffect(() => {
    const update = () => {
      const canvas = fabricRef.current;
      if (!canvas) return setItems([]);
      setItems(canvas.getObjects().map((o, i) => `${o.type} ${i + 1}`));
    };
    update();
    const canvas = fabricRef.current;
    if (!canvas) return;
    canvas.on("object:added", update);
    canvas.on("object:removed", update);
    canvas.on("object:modified", update);
    return () => {
      canvas.off("object:added", update);
      canvas.off("object:removed", update);
      canvas.off("object:modified", update);
    };
  }, [fabricRef]);

  const handleClick = (idx: number) => {
    const canvas = fabricRef.current;
    if (!canvas) return;
    const obj = canvas.getObjects()[idx];
    if (!obj) return;
    canvas.setActiveObject(obj);
    canvas.requestRenderAll();
    onSelect?.(idx);
  };

  return (
    <div className="border-t border-white/10 px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">Layers</h4>
          <p className="mt-1 text-[11px] text-zinc-500">Atur urutan objek di view aktif</p>
        </div>
        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-zinc-500">{items.length} objek</span>
      </div>
      <div className="space-y-2">
        {items.length === 0 && <p className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-3 py-4 text-xs text-zinc-500">Tidak ada objek di view ini.</p>}
        {items.map((it, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 transition-colors hover:bg-white/[0.07]">
            <button type="button" onClick={() => handleClick(i)} className="min-w-0 text-left text-xs font-medium text-zinc-100 underline-offset-2 hover:underline">
              {it}
            </button>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => {
                const canvas = fabricRef.current; if (!canvas) return; const obj = canvas.getObjects()[i]; if (!obj) return; canvas.bringObjectForward(obj); canvas.requestRenderAll();
              }}>Up</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                const canvas = fabricRef.current; if (!canvas) return; const obj = canvas.getObjects()[i]; if (!obj) return; canvas.sendObjectBackwards(obj); canvas.requestRenderAll();
              }}>Down</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
