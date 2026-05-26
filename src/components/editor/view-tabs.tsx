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
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-zinc-900/80 p-1">
      {DESIGN_VIEWS.map((v) => (
        <button
          key={v.id}
          type="button"
          onClick={() => onChange(v.id)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors sm:px-4 sm:text-sm",
            active === v.id
              ? "bg-violet-600 text-white shadow"
              : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100"
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}
