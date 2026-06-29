/**
 * ──────────────────────────────────────────────────────────────────────────
 * MODELO DE DINERO (demo en el navegador · fuente única en el cliente)
 * ──────────────────────────────────────────────────────────────────────────
 * El dinero del demo vive en UN store compartido (MoneyProvider) que persiste
 * en localStorage por piel. TODOS los montos se guardan en CENTAVOS enteros
 * para que los cálculos cuadren EXACTOS (sin errores de coma flotante).
 *
 * Cuando exista backend real, se reemplaza el store por llamadas a Supabase;
 * estos tipos y el motor de cálculo (calc.ts) se mantienen igual.
 */

export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta";

export const METHOD_LABEL: Record<PaymentMethod, string> = {
  efectivo: "Efectivo",
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
};

export const METHODS: PaymentMethod[] = ["efectivo", "transferencia", "tarjeta"];

/** De dónde nació el cobro. */
export type PaymentSource = "cita" | "manual" | "producto";

/** ITBIS dominicano (SIMULADO en el demo). */
export const ITBIS_RATE = 0.18;

/** Comisión por defecto del profesional (configurable; demo). */
export const DEFAULT_COMMISSION_PCT = 45;

/** Una parte de un pago (soporta pago mixto). Montos en centavos. */
export type PaymentSplit = {
  method: PaymentMethod;
  amount: number; // centavos
  reference?: string; // voucher / referencia de transferencia
};

/** Un cobro registrado (todos los montos en centavos enteros). */
export type Payment = {
  id: string;
  createdAt: string; // ISO
  date: string; // YYYY-MM-DD (día contable)

  // Snapshot (no FK: la agenda es demo en el navegador)
  source: PaymentSource;
  appointmentId?: string;
  clientName: string;
  service: string;
  professionalId: string;
  professionalName: string;

  // Desglose monetario (centavos)
  serviceAmount: number; // monto del servicio (base)
  discount: number; // descuento aplicado
  subtotal: number; // serviceAmount - discount
  itbis: number; // 18% simulado (0 si no se incluye)
  tip: number; // propina para el profesional
  total: number; // subtotal + itbis + tip
  commission: number; // comisión del profesional (sobre subtotal)
  commissionPct: number;

  // Cómo se pagó
  splits: PaymentSplit[]; // suma = total
  cashReceived?: number; // efectivo entregado (si aplica)
  change?: number; // devuelta

  status: "pagado" | "anulado";
  ncf: string; // NCF SIMULADO
  note?: string;
};

/** Un gasto/egreso del día (centavos). */
export type Expense = {
  id: string;
  createdAt: string;
  date: string; // YYYY-MM-DD
  concept: string;
  amount: number; // centavos
  method: PaymentMethod; // de qué fondo salió (efectivo casi siempre)
  category: ExpenseCategory;
};

export type ExpenseCategory =
  | "insumos"
  | "servicios"
  | "nomina"
  | "mantenimiento"
  | "otro";

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseCategory, string> = {
  insumos: "Insumos",
  servicios: "Servicios (luz, agua)",
  nomina: "Adelanto / Nómina",
  mantenimiento: "Mantenimiento",
  otro: "Otro",
};

/** Cierre de caja (arqueo) de un día. */
export type CashClose = {
  date: string; // YYYY-MM-DD
  closedAt: string; // ISO
  expectedCash: number; // efectivo esperado (centavos)
  countedCash: number; // efectivo contado por el usuario
  difference: number; // contado - esperado
};
