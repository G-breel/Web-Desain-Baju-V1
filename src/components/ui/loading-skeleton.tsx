import { cn } from "@/lib/utils";

export function LoadingSkeleton({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-white/10",
        className
      )}
    />
  );
}

export function PageLoadingSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <LoadingSkeleton className="h-10 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} className="h-40" />
        ))}
      </div>
    </div>
  );
}
