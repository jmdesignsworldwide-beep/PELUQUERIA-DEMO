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
 * Bloque de cita PREMIUM: relleno con presencia (no pastel lavado), borde y
 * barra de acento lateral del color de estado. Texto con buen contraste.
 */
export const STATUS_BLOCK: Record<AgStatus, string> = {
  pendiente: "bg-amber-500/20 border border-amber-500/40 border-l-[4px] border-l-amber-500 text-fg",
  confirmada: "bg-sky-500/20 border border-sky-500/40 border-l-[4px] border-l-sky-500 text-fg",
  en_proceso: "bg-accent/25 border border-accent/50 border-l-[4px] border-l-accent text-fg",
  completada: "bg-emerald-500/20 border border-emerald-500/40 border-l-[4px] border-l-emerald-500 text-fg",
  cancelada: "bg-red-500/15 border border-red-500/30 border-l-[4px] border-l-red-500 text-fg/60",
  no_show: "bg-zinc-500/20 border border-zinc-500/40 border-l-[4px] border-l-zinc-500 text-fg/70",
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
