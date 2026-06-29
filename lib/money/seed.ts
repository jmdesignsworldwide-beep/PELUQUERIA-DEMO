/**
 * Datos sembrados COHERENTES del dinero (demo). Deterministas por piel para
 * que la caja, los reportes y los ingresos por profesional tengan sentido.
 * Precios de mercado RD$ 2026 (ver doc §9). Se generan ~21 días hacia atrás.
 */

import type { BusinessType } from "@/lib/skins";
import { professionalsFor } from "@/components/citas/data";
import { servicesFor } from "@/lib/catalog/services";
import { toCents, pctOfCents } from "./calc";
import {
  DEFAULT_COMMISSION_PCT,
  Expense,
  ExpenseCategory,
  Payment,
  PaymentMethod,
  PaymentSplit,
} from "./types";

/* PRNG determinista (mulberry32 + hash de string). */
function hash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/* Catálogo de servicios con precio (pesos) por piel. */
// Los servicios sembrados salen del CATÁLOGO ÚNICO → mismos nombres y precios
// que en Servicios, el cobro y la reserva (coherencia total del organismo).
type Svc = { name: string; price: number };
function servicesForSeed(skin: BusinessType): Svc[] {
  return servicesFor(skin).map((s) => ({ name: s.name, price: s.price }));
}

const CLIENTS: Record<BusinessType, string[]> = {
  salon: [
    "María Fernández", "Carla Jiménez", "Rosa Almonte", "Yamilet Reyes",
    "Paola Castillo", "Dahiana Cruz", "Wendy Polanco", "Laura Santos",
    "Génesis Peña", "Massiel Then", "Esther Núñez", "Camila Rosario",
  ],
  barberia: [
    "José Martínez", "Carlos Rodríguez", "Luis Encarnación", "Pedro Guzmán",
    "Juan De la Cruz", "Héctor Díaz", "Manuel Acosta", "Ángel Pérez",
    "Frank Castro", "Diego Méndez", "Yunior Beltré", "Starling Ramírez",
  ],
};

const EXPENSE_CONCEPTS: { concept: string; category: ExpenseCategory; max: number }[] = [
  { concept: "Compra de insumos", category: "insumos", max: 3500 },
  { concept: "Productos de tienda", category: "insumos", max: 5000 },
  { concept: "Pago de luz", category: "servicios", max: 4000 },
  { concept: "Adelanto a personal", category: "nomina", max: 3000 },
  { concept: "Mantenimiento de equipos", category: "mantenimiento", max: 2500 },
];

/** YYYY-MM-DD local de hoy menos n días. */
function isoMinus(today: Date, n: number): string {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function makePayment(
  rng: () => number,
  skin: BusinessType,
  pros: { id: string; name: string }[],
  date: string,
  i: number,
  ncfSeq: number
): Payment {
  const svc = pick(rng, servicesForSeed(skin));
  const pro = pick(rng, pros);
  const client = pick(rng, CLIENTS[skin]);

  const serviceAmount = toCents(svc.price);
  // Descuento ocasional (10%).
  const discount = rng() < 0.15 ? pctOfCents(serviceAmount, 10) : 0;
  const subtotal = serviceAmount - discount;
  const itbis = 0; // en el demo los precios se cotizan sin ITBIS desglosado
  // Propina: ~60% deja propina, 5–15% del subtotal redondeada a 50.
  let tip = 0;
  if (rng() < 0.6) {
    const raw = pctOfCents(subtotal, 5 + Math.floor(rng() * 11));
    tip = Math.round(raw / 5000) * 5000; // redondeo a RD$50
  }
  const total = subtotal + itbis + tip;
  const commissionPct = DEFAULT_COMMISSION_PCT;
  const commission = pctOfCents(subtotal, commissionPct);

  // Método: 50% efectivo, 25% transferencia, 20% tarjeta, 5% mixto.
  const r = rng();
  let splits: PaymentSplit[];
  let cashReceived: number | undefined;
  let change: number | undefined;
  if (r < 0.5) {
    splits = [{ method: "efectivo", amount: total }];
    // Recibido redondeado hacia arriba al siguiente RD$100.
    cashReceived = Math.ceil(total / 10000) * 10000;
    change = cashReceived - total;
  } else if (r < 0.75) {
    splits = [{ method: "transferencia", amount: total, reference: `TRX${100000 + Math.floor(rng() * 899999)}` }];
  } else if (r < 0.95) {
    splits = [{ method: "tarjeta", amount: total }];
  } else {
    const half = Math.round(total / 2 / 5000) * 5000;
    splits = [
      { method: "efectivo", amount: half },
      { method: "tarjeta", amount: total - half },
    ];
    cashReceived = half;
    change = 0;
  }

  return {
    id: `seed-${skin}-${date}-${i}`,
    createdAt: `${date}T${String(8 + (i % 10)).padStart(2, "0")}:00:00`,
    date,
    source: rng() < 0.2 ? "producto" : "cita",
    clientName: client,
    service: svc.name,
    professionalId: pro.id,
    professionalName: pro.name,
    serviceAmount,
    discount,
    subtotal,
    itbis,
    tip,
    total,
    commission,
    commissionPct,
    splits,
    cashReceived,
    change,
    status: "pagado",
    ncf: `B01${String(ncfSeq).padStart(8, "0")}`,
  };
}

/** Genera pagos sembrados (hoy + ~21 días atrás) para una piel. */
export function seedPayments(skin: BusinessType, today: Date): Payment[] {
  const pros = professionalsFor(skin);
  const out: Payment[] = [];
  let ncf = 1;
  for (let day = 0; day <= 21; day++) {
    const date = isoMinus(today, day);
    const rng = mulberry32(hash(`pay:${skin}:${date}`));
    const dow = new Date(date).getDay();
    // Hoy más cargado; domingos livianos.
    const base = day === 0 ? 8 : dow === 0 ? 3 : 6;
    const count = base + Math.floor(rng() * 4);
    for (let i = 0; i < count; i++) {
      out.push(makePayment(rng, skin, pros, date, i, ncf++));
    }
  }
  return out;
}

/** Genera gastos sembrados (algunos días). */
export function seedExpenses(skin: BusinessType, today: Date): Expense[] {
  const out: Expense[] = [];
  for (let day = 0; day <= 21; day++) {
    const date = isoMinus(today, day);
    const rng = mulberry32(hash(`exp:${skin}:${date}`));
    const n = rng() < 0.6 ? 1 + Math.floor(rng() * 2) : 0;
    for (let i = 0; i < n; i++) {
      const e = pick(rng, EXPENSE_CONCEPTS);
      const amount = Math.round((500 + rng() * e.max) / 5000) * 5000;
      const method: PaymentMethod = rng() < 0.85 ? "efectivo" : "transferencia";
      out.push({
        id: `seedexp-${skin}-${date}-${i}`,
        createdAt: `${date}T17:00:00`,
        date,
        concept: e.concept,
        amount,
        method,
        category: e.category,
      });
    }
  }
  return out;
}
