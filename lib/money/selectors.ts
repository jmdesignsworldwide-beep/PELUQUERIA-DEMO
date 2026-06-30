/**
 * Selectores PUROS sobre la fuente única (pagos + gastos). La Caja, los
 * reportes y el Dashboard leen de aquí — no recalculan ni duplican el dinero.
 * Todo en centavos enteros.
 */

import { METHODS, PaymentMethod } from "./types";
import type { Expense, Payment } from "./types";

export function activePayments(payments: Payment[]): Payment[] {
  return payments.filter((p) => p.status === "pagado");
}

export function paymentsOn(payments: Payment[], date: string): Payment[] {
  return activePayments(payments).filter((p) => p.date === date);
}
export function expensesOn(expenses: Expense[], date: string): Expense[] {
  return expenses.filter((e) => e.date === date);
}

/** Ingresos totales (suma de totales) de un día. */
export function dayIncome(payments: Payment[], date: string): number {
  return paymentsOn(payments, date).reduce((s, p) => s + p.total, 0);
}

/** Egresos totales de un día. */
export function dayExpenses(expenses: Expense[], date: string): number {
  return expensesOn(expenses, date).reduce((s, e) => s + e.amount, 0);
}

/** Balance de caja del día = ingresos − egresos. */
export function dayBalance(
  payments: Payment[],
  expenses: Expense[],
  date: string
): number {
  return dayIncome(payments, date) - dayExpenses(expenses, date);
}

function emptyByMethod(): Record<PaymentMethod, number> {
  return { efectivo: 0, transferencia: 0, tarjeta: 0 };
}

/** Ingresos por método de un día (reparte el pago mixto por su split). */
export function incomeByMethod(
  payments: Payment[],
  date: string
): Record<PaymentMethod, number> {
  const acc = emptyByMethod();
  for (const p of paymentsOn(payments, date)) {
    for (const s of p.splits) acc[s.method] += s.amount;
  }
  return acc;
}

/** Egresos por método de un día. */
export function expensesByMethod(
  expenses: Expense[],
  date: string
): Record<PaymentMethod, number> {
  const acc = emptyByMethod();
  for (const e of expensesOn(expenses, date)) acc[e.method] += e.amount;
  return acc;
}

/** Efectivo esperado en caja = entradas efectivo − salidas efectivo. */
export function expectedCash(
  payments: Payment[],
  expenses: Expense[],
  date: string
): number {
  return (
    incomeByMethod(payments, date).efectivo -
    expensesByMethod(expenses, date).efectivo
  );
}

/** Propinas del día agrupadas por profesional. */
export function tipsByPro(
  payments: Payment[],
  date: string
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of paymentsOn(payments, date)) {
    if (p.tip > 0) acc[p.professionalId] = (acc[p.professionalId] ?? 0) + p.tip;
  }
  return acc;
}

/** Ingresos generados por profesional (suma de subtotal de servicio). */
export function incomeByPro(
  payments: Payment[],
  date: string
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of paymentsOn(payments, date)) {
    acc[p.professionalId] = (acc[p.professionalId] ?? 0) + p.subtotal;
  }
  return acc;
}

/** Comisión acumulada por profesional. */
export function commissionByPro(
  payments: Payment[],
  date: string
): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of paymentsOn(payments, date)) {
    acc[p.professionalId] = (acc[p.professionalId] ?? 0) + p.commission;
  }
  return acc;
}

/** Total de propinas del día. */
export function dayTips(payments: Payment[], date: string): number {
  return paymentsOn(payments, date).reduce((s, p) => s + p.tip, 0);
}

/** Serie de balance por día en un rango [fromISO..toISO] inclusivo. */
export function dailySeries(
  payments: Payment[],
  expenses: Expense[],
  dates: string[]
): { date: string; income: number; expenses: number; balance: number }[] {
  return dates.map((date) => {
    const income = dayIncome(payments, date);
    const exp = dayExpenses(expenses, date);
    return { date, income, expenses: exp, balance: income - exp };
  });
}

export const ALL_METHODS = METHODS;
