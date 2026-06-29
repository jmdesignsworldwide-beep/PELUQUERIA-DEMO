"use client";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * FUENTE ÚNICA DEL DINERO (demo en el navegador)
 * ──────────────────────────────────────────────────────────────────────────
 * Un solo store comparten Pagos, Caja, Dashboard y el botón "Cobrar" de la
 * agenda. Persiste en localStorage por piel. Si no hay nada guardado, siembra
 * datos coherentes. Cuando exista backend, se reemplaza por Supabase sin tocar
 * a los consumidores (mismo contrato).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useApp } from "./AppProviders";
import { DEFAULT_COMMISSION_PCT } from "@/lib/money/types";
import type { CashClose, Expense, Payment } from "@/lib/money/types";
import { seedExpenses, seedPayments } from "@/lib/money/seed";

const STORAGE_VERSION = "v1";

function storageKey(skin: string) {
  return `jm-money-${STORAGE_VERSION}-${skin}`;
}

function todayISOLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type Persisted = {
  payments: Payment[];
  expenses: Expense[];
  closes: CashClose[];
};

export type NewPayment = Omit<Payment, "id" | "createdAt" | "ncf" | "status"> & {
  status?: Payment["status"];
};
export type NewExpense = Omit<Expense, "id" | "createdAt">;

type MoneyContextValue = {
  ready: boolean;
  today: string;
  payments: Payment[];
  expenses: Expense[];
  closes: CashClose[];
  /** Registra un cobro; devuelve el pago ya materializado (con id, ncf...). */
  addPayment: (input: NewPayment) => Payment;
  addExpense: (input: NewExpense) => Expense;
  voidPayment: (id: string) => void;
  closeCash: (close: CashClose) => void;
  commissionPctFor: (professionalId: string) => number;
};

const MoneyContext = createContext<MoneyContextValue | null>(null);

export function MoneyProvider({ children }: { children: React.ReactNode }) {
  const { businessType } = useApp();
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState("2026-06-29");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [closes, setCloses] = useState<CashClose[]>([]);
  const seqRef = useRef(1);

  // Carga/siembra al montar y al cambiar de piel.
  useEffect(() => {
    const t = todayISOLocal();
    setToday(t);
    const key = storageKey(businessType);
    let data: Persisted | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) data = JSON.parse(raw) as Persisted;
    } catch {
      data = null;
    }
    if (!data || !Array.isArray(data.payments) || data.payments.length === 0) {
      const now = new Date();
      data = {
        payments: seedPayments(businessType, now),
        expenses: seedExpenses(businessType, now),
        closes: [],
      };
    }
    setPayments(data.payments);
    setExpenses(data.expenses);
    setCloses(data.closes ?? []);
    // Siguiente NCF a partir del máximo sembrado.
    const maxNcf = data.payments.reduce((m, p) => {
      const n = parseInt(p.ncf.replace(/\D/g, ""), 10);
      return Number.isFinite(n) ? Math.max(m, n) : m;
    }, 0);
    seqRef.current = maxNcf + 1;
    setReady(true);
  }, [businessType]);

  // Persiste en cada cambio (una vez listo).
  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        storageKey(businessType),
        JSON.stringify({ payments, expenses, closes } satisfies Persisted)
      );
    } catch {
      /* almacenamiento lleno o no disponible: el demo sigue en memoria */
    }
  }, [ready, businessType, payments, expenses, closes]);

  const addPayment = useCallback((input: NewPayment): Payment => {
    const ncf = `B01${String(seqRef.current++).padStart(8, "0")}`;
    const payment: Payment = {
      ...input,
      id: `pago-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
      ncf,
      status: input.status ?? "pagado",
    };
    setPayments((prev) => [payment, ...prev]);
    return payment;
  }, []);

  const addExpense = useCallback((input: NewExpense): Expense => {
    const expense: Expense = {
      ...input,
      id: `gasto-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses((prev) => [expense, ...prev]);
    return expense;
  }, []);

  const voidPayment = useCallback((id: string) => {
    setPayments((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: "anulado" } : p))
    );
  }, []);

  const closeCash = useCallback((close: CashClose) => {
    setCloses((prev) => [
      close,
      ...prev.filter((c) => c.date !== close.date),
    ]);
  }, []);

  const commissionPctFor = useCallback(
    (_professionalId: string) => DEFAULT_COMMISSION_PCT,
    []
  );

  const value = useMemo<MoneyContextValue>(
    () => ({
      ready,
      today,
      payments,
      expenses,
      closes,
      addPayment,
      addExpense,
      voidPayment,
      closeCash,
      commissionPctFor,
    }),
    [
      ready,
      today,
      payments,
      expenses,
      closes,
      addPayment,
      addExpense,
      voidPayment,
      closeCash,
      commissionPctFor,
    ]
  );

  return <MoneyContext.Provider value={value}>{children}</MoneyContext.Provider>;
}

export function useMoney() {
  const ctx = useContext(MoneyContext);
  if (!ctx) throw new Error("useMoney debe usarse dentro de <MoneyProvider>");
  return ctx;
}
