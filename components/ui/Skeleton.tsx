"use client";

import { cn } from "@/lib/cn";

/** Skeleton elegante con shimmer metálico. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg bg-surface-2",
        className
      )}
    >
      <div
        className="absolute inset-0 -translate-x-full animate-shimmer"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--fg) / 0.06), transparent)",
        }}
      />
    </div>
  );
}
