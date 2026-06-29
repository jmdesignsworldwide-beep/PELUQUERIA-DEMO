"use client";

import { cn } from "@/lib/cn";

/**
 * Fondo de aurora que RESPIRA leyendo el acento de la piel activa
 * (--aurora-1 / --aurora-2 / --aurora-strength definidos por tokens).
 *
 * Cada blob tiene DOS capas anidadas para que los movimientos compongan sin
 * pisarse: la capa externa hace una deriva lenta (translate) y la interna
 * "respira" (scale + opacidad pulsante). Pura CSS animation → respeta
 * prefers-reduced-motion vía globals.css (las animaciones quedan estáticas).
 */
function Blob({
  className,
  delay,
  token,
  strengthMul = 1,
  blur = "100px",
}: {
  className?: string;
  delay: string;
  /** Nombre de la variable de color: --aurora-1 | --aurora-2 */
  token: string;
  strengthMul?: number;
  blur?: string;
}) {
  return (
    <div
      className={cn("absolute will-change-transform animate-aurora-drift", className)}
      style={{ animationDelay: delay }}
    >
      <div
        className="h-full w-full rounded-full animate-aurora-breathe will-change-[transform,opacity]"
        style={{
          animationDelay: delay,
          filter: `blur(${blur})`,
          background: `radial-gradient(circle at center, rgb(var(${token}) / calc(var(--aurora-strength) * ${strengthMul})), transparent 68%)`,
        }}
      />
    </div>
  );
}

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

      {/* blob 1 — acento principal, arriba-izquierda */}
      <Blob
        className="-top-1/4 left-[-10%] h-[70vh] w-[70vh]"
        delay="0s"
        token="--aurora-1"
        blur="90px"
      />
      {/* blob 2 — secundario (metálico), arriba-derecha */}
      <Blob
        className="top-[8%] right-[-15%] h-[80vh] w-[80vh]"
        delay="-7s"
        token="--aurora-2"
        blur="100px"
      />
      {/* blob 3 — profundidad inferior */}
      <Blob
        className="bottom-[-20%] left-1/3 h-[60vh] w-[60vh]"
        delay="-3.5s"
        token="--aurora-1"
        strengthMul={0.7}
        blur="110px"
      />

      {/* grano/vignette sutil para premium */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(0_0_0/0.28))]" />
    </div>
  );
}
