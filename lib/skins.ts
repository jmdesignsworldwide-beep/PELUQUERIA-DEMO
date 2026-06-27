/**
 * ──────────────────────────────────────────────────────────────────────────
 * DEFINICIÓN DE PIELES (white-label por vertical)
 * ──────────────────────────────────────────────────────────────────────────
 * El motor es idéntico para ambas pieles. Lo único que cambia es esta capa:
 * nombre, vocabulario y catálogo. Los COLORES viven en globals.css (tokens),
 * seleccionados por data-skin / data-theme — aquí no hay colores hardcodeados.
 *
 * Una corrección aquí (o en los tokens) arregla las dos pieles a la vez.
 */

export type BusinessType = "salon" | "barberia";

export type SkinVocab = {
  /** El profesional que atiende. */
  professional: string;
  professionalPlural: string;
  /** La persona atendida (dato gestionado por el sistema). */
  customer: string;
  customerPlural: string;
};

export type Skin = {
  type: BusinessType;
  /** Nombre del negocio que se muestra en header / login. */
  businessName: string;
  /** Etiqueta corta de la vertical. */
  label: string;
  /** Monograma de marca. */
  monogram: string;
  vocab: SkinVocab;
};

export const SKINS: Record<BusinessType, Skin> = {
  salon: {
    type: "salon",
    businessName: "JM Beauty Salón",
    label: "Salón de Belleza",
    monogram: "JM",
    vocab: {
      professional: "Estilista",
      professionalPlural: "Estilistas",
      customer: "Clienta",
      customerPlural: "Clientas",
    },
  },
  barberia: {
    type: "barberia",
    businessName: "JM Barbería",
    label: "Barbería",
    monogram: "JM",
    vocab: {
      professional: "Barbero",
      professionalPlural: "Barberos",
      customer: "Cliente",
      customerPlural: "Clientes",
    },
  },
};

export const DEFAULT_SKIN: BusinessType = "salon";

export function getSkin(type: BusinessType | undefined | null): Skin {
  if (type && SKINS[type]) return SKINS[type];
  return SKINS[DEFAULT_SKIN];
}

export function isBusinessType(value: unknown): value is BusinessType {
  return value === "salon" || value === "barberia";
}
