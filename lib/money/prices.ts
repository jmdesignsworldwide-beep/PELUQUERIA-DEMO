/**
 * Precio de referencia por servicio (RD$ 2026) para precargar el cobro desde
 * la cita. Las llaves coinciden con los nombres de servicio de la agenda
 * (components/citas/data.ts). Si un servicio no está en el mapa, cae a un
 * precio por defecto razonable según la piel.
 */

import type { BusinessType } from "@/lib/skins";

const PRICES: Record<BusinessType, Record<string, number>> = {
  salon: {
    Secado: 600,
    "Diseño de cejas": 500,
    "Corte y peinado": 1000,
    Manicure: 450,
    Pedicure: 600,
    "Tratamiento capilar": 1500,
    "Maquillaje social": 2500,
    "Color completo": 2800,
    Keratina: 6000,
    "Mechas / Balayage": 7000,
  },
  barberia: {
    "Afeitado a navaja": 500,
    "Corte clásico": 400,
    "Corte infantil": 350,
    "Diseño de líneas": 400,
    "Corte + barba": 750,
    Degradado: 550,
    Tinte: 700,
    "Ritual completo": 1200,
  },
};

const FALLBACK: Record<BusinessType, number> = { salon: 1000, barberia: 500 };

/** Precio en pesos de un servicio para una piel. */
export function servicePrice(skin: BusinessType, service: string): number {
  return PRICES[skin]?.[service] ?? FALLBACK[skin];
}
