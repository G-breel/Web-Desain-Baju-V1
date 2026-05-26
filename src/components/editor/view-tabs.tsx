"use client";

import { cn } from "@/lib/utils";
import { DESIGN_VIEWS } from "@/lib/editor/constants";
import type { DesignView } from "@/types";

export function ViewTabs({
  active,
  onChange,
}: {
  active: DesignView;
  onChange: (view: DesignView) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-zinc-900/80 p-1 sm:flex sm:flex-wrap">
      {DESIGN_VIEWS.map((v, index) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={cn(
            "flex min-w-[74px] flex-col items-start rounded-xl px-3 py-2 text-left text-xs font-medium transition-all sm:px-4",
            active === v.id
              ? "bg-gradient-to-b from-violet-500 to-violet-700 text-white shadow-lg shadow-violet-600/25 ring-1 ring-violet-300/20"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          )}
        >
          <span className="text-[10px] uppercase tracking-[0.2em] opacity-70">0{index + 1}</span>
          {v.label}
        </button>
      ))}
    </div>
  );
}
