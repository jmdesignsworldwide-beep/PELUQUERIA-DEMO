"use client";

import { cn } from "@/lib/cn";

/**
 * Fondo de aurora que "respira" leyendo el acento de la piel activa
 * (--aurora-1 / --aurora-2 / --aurora-strength definidos por tokens).
 * Pura CSS animation → respeta prefers-reduced-motion vía globals.css.
 */
export function AuroraBackground({
  className,
  fixed = true,
}: {
  className?: string;
  fixed?: boolean;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        fixed ? "fixed" : "absolute",
        "inset-0 -z-10 overflow-hidden",
        className
      )}
    >
      {/* lienzo base */}
      <div className="absolute inset-0 bg-bg" />

      {/* blob 1 */}
      <div
        className="absolute -top-1/4 left-[-10%] h-[70vh] w-[70vh] rounded-full blur-[90px] animate-aurora-drift"
        style={{
          background:
            "radial-gradient(circle at center, rgb(var(--aurora-1) / var(--aurora-strength)), transparent 65%)",
        }}
      />
      {/* blob 2 */}
      <div
        className="absolute top-[10%] right-[-15%] h-[80vh] w-[80vh] rounded-full blur-[100px] animate-aurora-drift"
        style={{
          animationDelay: "-7s",
          background:
            "radial-gradient(circle at center, rgb(var(--aurora-2) / var(--aurora-strength)), transparent 65%)",
        }}
      />
      {/* blob 3, profundidad inferior */}
      <div
        className="absolute bottom-[-20%] left-1/3 h-[60vh] w-[60vh] rounded-full blur-[110px] animate-aurora-drift"
        style={{
          animationDelay: "-3.5s",
          background:
            "radial-gradient(circle at center, rgb(var(--aurora-1) / calc(var(--aurora-strength) * 0.7)), transparent 70%)",
        }}
      />

      {/* grano/vignette sutil para premium */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.28))]" />
    </div>
  );
}
