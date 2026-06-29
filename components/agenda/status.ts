import type { AgStatus } from "@/lib/agenda";

export const STATUS_LABEL: Record<AgStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
  no_show: "No-show",
};

/**
 * Bloque de cita estándar 2026 (Notion / Linear): relleno tenue y tintado
 * (~10-12%), borde 1px sutil del color de estado y barra lateral de 3px que
 * identifica el estado de un vistazo. Texto con buen contraste sobre el tinte.
 */
export const STATUS_BLOCK: Record<AgStatus, string> = {
  pendiente: "bg-amber-500/[0.12] border border-amber-500/30 border-l-[3px] border-l-amber-500 text-fg",
  confirmada: "bg-sky-500/[0.12] border border-sky-500/30 border-l-[3px] border-l-sky-500 text-fg",
  en_proceso: "bg-accent/[0.16] border border-accent/40 border-l-[3px] border-l-accent text-fg",
  completada: "bg-emerald-500/[0.12] border border-emerald-500/30 border-l-[3px] border-l-emerald-500 text-fg",
  cancelada: "bg-red-500/[0.10] border border-red-500/25 border-l-[3px] border-l-red-500 text-fg/55",
  no_show: "bg-zinc-500/[0.12] border border-zinc-500/30 border-l-[3px] border-l-zinc-500 text-fg/65",
};

export const STATUS_DOT: Record<AgStatus, string> = {
  pendiente: "bg-amber-500",
  confirmada: "bg-sky-500",
  en_proceso: "bg-accent",
  completada: "bg-emerald-500",
  cancelada: "bg-red-500",
  no_show: "bg-zinc-500",
};

/** Progreso (barra) para citas en proceso. */
export const STATUS_BAR: Record<AgStatus, string> = {
  pendiente: "bg-amber-500",
  confirmada: "bg-sky-500",
  en_proceso: "bg-accent",
  completada: "bg-emerald-500",
  cancelada: "bg-red-500",
  no_show: "bg-zinc-500",
};

export const STATUS_ORDER: AgStatus[] = [
  "pendiente",
  "confirmada",
  "en_proceso",
  "completada",
  "no_show",
  "cancelada",
];
