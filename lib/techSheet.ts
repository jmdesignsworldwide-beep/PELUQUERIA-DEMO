import type { BusinessType } from "@/lib/skins";

/**
 * Ficha técnica POR PIEL: una sola estructura (jsonb tech_sheet en clients),
 * vestida con campos distintos según business_type. La ficha y el formulario
 * leen esta config — no se duplican tablas ni componentes.
 */
export type TechField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  placeholder?: string;
};

const SALON: TechField[] = [
  { key: "formula_color", label: "Fórmula de color", type: "text", placeholder: "Ej. Igora 7-1 + oxidante 20vol" },
  { key: "tonos", label: "Tonos usados", type: "text", placeholder: "Ej. Rubio ceniza" },
  { key: "tratamientos", label: "Tratamientos", type: "text", placeholder: "Ej. Keratina (mar 2026)" },
  { key: "tipo_cabello", label: "Tipo de cabello", type: "text", placeholder: "Ej. Ondulado, procesado" },
  { key: "largo_cabello", label: "Largo de cabello", type: "select", options: ["corto", "mediano", "largo"] },
  { key: "alergias", label: "Alergias / reacciones", type: "text", placeholder: "Ej. Amoníaco" },
];

const BARBERIA: TechField[] = [
  { key: "tipo_corte", label: "Tipo de corte", type: "text", placeholder: "Ej. Fade medio + texturizado" },
  { key: "maquina", label: "Número de máquina / guías", type: "text", placeholder: "Ej. 1.5 a los lados" },
  { key: "degradado", label: "Tipo de degradado", type: "select", options: ["Bajo", "Medio", "Alto", "Skin fade"] },
  { key: "barba", label: "Perfilado de barba", type: "text", placeholder: "Ej. Perfilado clásico con navaja" },
  { key: "notas_estilo", label: "Notas de estilo", type: "text", placeholder: "Ej. Raya marcada al lado" },
  { key: "alergias", label: "Alergias / sensibilidad", type: "text", placeholder: "Ej. Sensible a la navaja" },
];

export function techFieldsFor(bt: BusinessType): TechField[] {
  return bt === "barberia" ? BARBERIA : SALON;
}

export function techSheetTitle(bt: BusinessType): string {
  return bt === "barberia" ? "Ficha técnica · corte y barba" : "Ficha técnica · color y cabello";
}
