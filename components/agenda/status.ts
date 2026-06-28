import type { AgStatus } from "@/lib/agenda";

export const STATUS_LABEL: Record<AgStatus, string> = {
  pendiente: "Pendiente",
  confirmada: "Confirmada",
  en_proceso: "En proceso",
  completada: "Completada",
  cancelada: "Cancelada",
  no_show: "No-show",
};

/** Clases para el bloque de cita (borde izquierdo + fondo + texto). */
export const STATUS_BLOCK: Record<AgStatus, string> = {
  pendiente: "border-l-amber-500 bg-amber-500/10",
  confirmada: "border-l-sky-500 bg-sky-500/10",
  en_proceso: "border-l-[rgb(var(--accent))] bg-accent/15",
  completada: "border-l-emerald-500 bg-emerald-500/10",
  cancelada: "border-l-red-500 bg-red-500/10 opacity-60",
  no_show: "border-l-zinc-500 bg-zinc-500/10 opacity-60",
};

/** Punto/etiqueta de estado. */
export const STATUS_DOT: Record<AgStatus, string> = {
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
