import type { BusinessType } from "@/lib/skins";

/**
 * Ficha técnica POR PIEL. Se separa en:
 *  - PERMANENTE (no cambia cada visita) → vive en clients.tech_sheet y va en el
 *    formulario de alta (tipo de cabello base, alergias, notas base).
 *  - POR VISITA (cambia cada vez) → vive en appointments.tech_detail y se ve en
 *    el HISTORIAL TÉCNICO (timeline). NO va en el formulario de alta.
 */
export type TechField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
};

/* ---------- PERMANENTE (formulario de alta) ---------- */
const PERMANENT_SALON: TechField[] = [
  { key: "tipo_cabello", label: "Tipo de cabello", type: "select", options: ["Liso", "Ondulado", "Rizado"] },
  { key: "procesado", label: "Estado del cabello", type: "select", options: ["Virgen", "Procesado", "Teñido"] },
  { key: "alergias", label: "Alergias / sensibilidades", type: "text", placeholder: "Ej. Amoníaco" },
];

const PERMANENT_BARBERIA: TechField[] = [
  { key: "alergias", label: "Alergias / sensibilidades", type: "text", placeholder: "Ej. Sensible a la navaja" },
  { key: "notas_estilo", label: "Notas de estilo base", type: "text", placeholder: "Ej. Raya marcada al lado" },
];

export function permanentFieldsFor(bt: BusinessType): TechField[] {
  return bt === "barberia" ? PERMANENT_BARBERIA : PERMANENT_SALON;
}

export function permanentTitle(bt: BusinessType): string {
  return bt === "barberia" ? "Datos base · sensibilidades" : "Datos base del cabello";
}

/* ---------- POR VISITA (timeline) ---------- */
export type VisitDetailField = { key: string; label: string };

const VISIT_SALON: VisitDetailField[] = [
  { key: "formula_color", label: "Fórmula" },
  { key: "tono", label: "Tono" },
  { key: "tratamiento", label: "Tratamiento" },
];

const VISIT_BARBERIA: VisitDetailField[] = [
  { key: "tipo_corte", label: "Corte" },
  { key: "maquina", label: "Máquina / guías" },
  { key: "barba", label: "Barba" },
];

export function visitDetailFieldsFor(bt: BusinessType): VisitDetailField[] {
  return bt === "barberia" ? VISIT_BARBERIA : VISIT_SALON;
}

export function timelineTitle(bt: BusinessType): string {
  return bt === "barberia"
    ? "Historial técnico · cortes y barba"
    : "Historial técnico · color y tratamientos";
}
