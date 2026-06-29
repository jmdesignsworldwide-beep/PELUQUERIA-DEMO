/**
 * ──────────────────────────────────────────────────────────────────────────
 * MOTOR DE CÁLCULO DEL DINERO (EXACTO · centavos enteros)
 * ──────────────────────────────────────────────────────────────────────────
 * Toda la aritmética del cobro ocurre aquí, en centavos enteros, para que el
 * total, la devuelta y el pago mixto cuadren SIEMPRE. El navegador nunca suma
 * pesos con decimales: convierte a centavos, opera con enteros y formatea al
 * final. Un error aquí es grave, por eso es una función pura y testeable.
 */

import {
  ITBIS_RATE,
  PaymentMethod,
  PaymentSplit,
} from "./types";

/* ── Conversión pesos ↔ centavos ── */

/** Pesos (number) → centavos enteros. Redondeo half-up estable. */
export function toCents(pesos: number): number {
  if (!Number.isFinite(pesos)) return 0;
  // +Number.EPSILON evita que 19.995*100 caiga a 1999 por binario.
  return Math.round((pesos + Number.EPSILON) * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

/** Aplica un porcentaje a una base en centavos, devolviendo centavos enteros. */
export function pctOfCents(baseCents: number, pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.round((baseCents * pct) / 100);
}

/* ── Formato dominicano RD$ ── */

const FMT_2 = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const FMT_0 = new Intl.NumberFormat("es-DO", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Formatea centavos como "RD$ 1,200" (sin decimales si es peso entero) o
 * "RD$ 1,234.50" (con decimales si los hay). tabular-nums lo alinea en UI.
 */
export function formatRD(cents: number): string {
  const pesos = fromCents(cents);
  const isWhole = Number.isInteger(pesos);
  return `RD$ ${(isWhole ? FMT_0 : FMT_2).format(pesos)}`;
}

/** Igual que formatRD pero siempre con 2 decimales (recibos/arqueo). */
export function formatRD2(cents: number): string {
  return `RD$ ${FMT_2.format(fromCents(cents))}`;
}

/* ── Entradas del cobro (desde la UI, en pesos) ── */

export type CobroInput = {
  /** Monto del servicio en pesos. */
  serviceAmount: number;
  /** Descuento: por monto (pesos) o por porciento. */
  discountKind: "monto" | "porciento";
  discountValue: number;
  /** Propina: por monto (pesos) o por porciento del subtotal. */
  tipKind: "monto" | "porciento";
  tipValue: number;
  /** Incluir ITBIS 18% simulado. */
  includeItbis: boolean;
  /** % de comisión del profesional (sobre el subtotal del servicio). */
  commissionPct: number;
  /** Cómo se paga (mixto = más de una parte). Montos en pesos. */
  splits: { method: PaymentMethod; amount: number; reference?: string }[];
  /** Efectivo entregado por el cliente (para la devuelta), en pesos. */
  cashReceived?: number;
};

export type CobroBreakdown = {
  serviceCents: number;
  discountCents: number;
  subtotalCents: number;
  itbisCents: number;
  tipCents: number;
  totalCents: number;
  commissionCents: number;

  splits: PaymentSplit[]; // en centavos
  paidCents: number; // suma de splits
  /** Parte en efectivo dentro de los splits. */
  cashPortionCents: number;
  cashReceivedCents: number;
  changeCents: number; // devuelta (>= 0)

  /** total - paid. >0 = falta; <0 = sobrepago. */
  balanceCents: number;
  /** El pago cuadra exacto (paid === total) y la devuelta no es negativa. */
  isExact: boolean;
  isOverpaid: boolean;
  isUnderpaid: boolean;
  /** Falta efectivo recibido para cubrir su parte. */
  insufficientCash: boolean;
};

/**
 * Calcula el desglose COMPLETO del cobro en centavos. Pura y determinista.
 * Orden: descuento → subtotal → ITBIS → propina → total → comisión → pagos.
 */
export function computeCobro(input: CobroInput): CobroBreakdown {
  const serviceCents = Math.max(0, toCents(input.serviceAmount));

  // Descuento (no puede exceder el servicio).
  let discountCents =
    input.discountKind === "porciento"
      ? pctOfCents(serviceCents, input.discountValue)
      : toCents(input.discountValue);
  discountCents = Math.min(Math.max(0, discountCents), serviceCents);

  const subtotalCents = serviceCents - discountCents;

  const itbisCents = input.includeItbis
    ? pctOfCents(subtotalCents, ITBIS_RATE * 100)
    : 0;

  const tipCents =
    input.tipKind === "porciento"
      ? pctOfCents(subtotalCents, input.tipValue)
      : Math.max(0, toCents(input.tipValue));

  const totalCents = subtotalCents + itbisCents + tipCents;

  const commissionCents = pctOfCents(subtotalCents, input.commissionPct);

  const splits: PaymentSplit[] = input.splits
    .map((s) => ({
      method: s.method,
      amount: Math.max(0, toCents(s.amount)),
      reference: s.reference?.trim() || undefined,
    }))
    .filter((s) => s.amount > 0);

  const paidCents = splits.reduce((sum, s) => sum + s.amount, 0);
  const cashPortionCents = splits
    .filter((s) => s.method === "efectivo")
    .reduce((sum, s) => sum + s.amount, 0);

  const cashReceivedCents =
    input.cashReceived != null ? toCents(input.cashReceived) : cashPortionCents;

  // La devuelta solo aplica a la parte en efectivo.
  const changeCents = Math.max(0, cashReceivedCents - cashPortionCents);

  const balanceCents = totalCents - paidCents;
  const insufficientCash =
    cashPortionCents > 0 && cashReceivedCents < cashPortionCents;

  return {
    serviceCents,
    discountCents,
    subtotalCents,
    itbisCents,
    tipCents,
    totalCents,
    commissionCents,
    splits,
    paidCents,
    cashPortionCents,
    cashReceivedCents,
    changeCents,
    balanceCents,
    isExact: balanceCents === 0 && !insufficientCash,
    isOverpaid: balanceCents < 0,
    isUnderpaid: balanceCents > 0,
    insufficientCash,
  };
}
