/**
 * LOGO DISTINTIVO POR PIEL (SVG premium, geométrico). Complementa el monograma
 * "JM" — no lo reemplaza. Trazo en currentColor (hereda el acento de la piel) y
 * un detalle en metálico (pivote dorado/cobre).
 *  · Salón → tijera de estilista, elegante.
 *  · Barbería → navaja clásica, artesanal.
 */

import type { BusinessType } from "@/lib/skins";

export function BrandMark({
  businessType,
  size = 28,
  className,
}: {
  businessType: BusinessType;
  size?: number;
  className?: string;
}) {
  return businessType === "salon" ? (
    <Tijera size={size} className={className} />
  ) : (
    <Navaja size={size} className={className} />
  );
}

function Tijera({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      className={className}
      aria-hidden
    >
      <circle cx="9" cy="9.4" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="9" cy="22.6" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M11.6 11.2 L27 25.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M11.6 20.8 L27 6.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="13.6" cy="16" r="1.25" fill="rgb(var(--metallic))" />
    </svg>
  );
}

function Navaja({ size, className }: { size: number; className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={size}
      height={size}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* hoja */}
      <path
        d="M6.8 21.8 C 12 18, 19 12.6, 26.4 8.2 L 27.8 10.4 C 21 15, 14 19.6, 8.8 23 Z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="currentColor"
        fillOpacity="0.10"
      />
      {/* mango */}
      <path d="M8.8 23 L 4.2 25.8" stroke="currentColor" strokeWidth="2" />
      {/* pivote metálico */}
      <circle cx="8.2" cy="22.4" r="1.3" fill="rgb(var(--metallic))" />
    </svg>
  );
}
