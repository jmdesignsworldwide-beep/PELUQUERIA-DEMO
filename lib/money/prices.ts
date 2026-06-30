/**
 * Precio de referencia por servicio (RD$) para precargar el cobro desde la
 * cita / reserva. DERIVA del catálogo único (lib/catalog/services.ts) para que
 * el precio sea EXACTAMENTE el mismo en Servicios, reserva y cobro.
 */

import type { BusinessType } from "@/lib/skins";
import { servicePriceMap } from "@/lib/catalog/services";

const FALLBACK: Record<BusinessType, number> = { salon: 1000, barberia: 500 };

/** Precio en pesos de un servicio para una piel. */
export function servicePrice(skin: BusinessType, service: string): number {
  return servicePriceMap(skin)[service] ?? FALLBACK[skin];
}
