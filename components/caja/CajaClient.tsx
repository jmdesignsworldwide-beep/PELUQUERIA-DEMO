"use client";

/**
 * CAJA DIARIA — el organismo del dinero. Lee TODO de la fuente única:
 * ingresos/egresos, balance por método, propinas e ingresos por profesional,
 * arqueo de cierre y reportes por período. Todo clickeable (clic en un número
 * → desglose). Cálculos en centavos enteros.
 */

import { useMemo, useState } from "react";
import {
  Calculator,
  Plus,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Scale,
  Banknote,
  CreditCard,
  ArrowLeftRight,
  Coins,
  Lock,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { KpiNumber } from "@/components/ui/KpiNumber";
import { cn } from "@/lib/cn";
import { fromCents, toCents, formatRD, formatRD2 } from "@/lib/money/calc";
import {
  METHOD_LABEL,
  PaymentMethod,
  Payment,
  ExpenseCategory,
  EXPENSE_CATEGORY_LABEL,
} from "@/lib/money/types";
import {
  paymentsOn,
  expensesOn,
  dayIncome,
  dayExpenses,
  incomeByMethod,
  expensesByMethod,
  expectedCash,
  tipsByPro,
  incomeByPro,
  dailySeries,
} from "@/lib/money/selectors";
import { professionalsFor, formatLongDate } from "@/components/citas/data";

function addDaysISO(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + n);
  return `${dt.getFullYear()}-${`${dt.getMonth() + 1}`.padStart(2, "0")}-${`${dt.getDate()}`.padStart(2, "0")}`;
}

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: ArrowLeftRight,
  tarjeta: CreditCard,
};

export function CajaClient() {
  const { businessType, skin } = useApp();
  const { payments, expenses, closes, ready, today, addExpense, closeCash } =
    useMoney();
  const pros = useMemo(() => professionalsFor(businessType), [businessType]);
  const proName = (id: string) => pros.find((p) => p.id === id)?.name ?? id;

  const [date, setDate] = useState(today);
  const [gastoOpen, setGastoOpen] = useState(false);
  const [counted, setCounted] = useState("");
  const [reportDays, setReportDays] = useState(14);
  const [detail, setDetail] = useState<{ title: string; rows: Payment[] } | null>(
    null
  );

  // Métricas del día seleccionado.
  const dayPays = useMemo(() => paymentsOn(payments, date), [payments, date]);
  const income = dayIncome(payments, date);
  const egresos = dayExpenses(expenses, date);
  const balance = income - egresos;
  const byMethod = incomeByMethod(payments, date);
  const expByMethod = expensesByMethod(expenses, date);
  const expected = expectedCash(payments, expenses, date);
  const tips = tipsByPro(payments, date);
  const incPro = incomeByPro(payments, date);
  const dayExp = expensesOn(expenses, date);

  const servicios = dayPays
    .filter((p) => p.source !== "producto")
    .reduce((s, p) => s + p.total, 0);
  const productos = dayPays
    .filter((p) => p.source === "producto")
    .reduce((s, p) => s + p.total, 0);

  const close = closes.find((c) => c.date === date);
  const countedCents = close ? close.countedCash : toCents(Number(counted) || 0);
  const difference = countedCents - expected;

  // Reporte por período.
  const reportDates = useMemo(() => {
    const arr: string[] = [];
    for (let i = reportDays - 1; i >= 0; i--) arr.push(addDaysISO(today, -i));
    return arr;
  }, [today, reportDays]);
  const series = useMemo(
    () => dailySeries(payments, expenses, reportDates),
    [payments, expenses, reportDates]
  );
  const maxIncome = Math.max(1, ...series.map((s) => s.income));
  const periodTotal = series.reduce((s, x) => s + x.income, 0);

  function openDetail(title: string, rows: Payment[]) {
    setDetail({ title, rows });
  }

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-surface-2/60" />
          ))}
        </div>
      </div>
    );
  }

  const isToday = date === today;

  return (
    <div className="space-y-5">
      {/* Encabezado + fecha */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Calculator size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Caja
            </h1>
            <p className="text-xs capitalize text-muted">
              {formatLongDate(date)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDate((d) => addDaysISO(d, -1))}
            aria-label="Día anterior"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border glass text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            <ChevronLeft size={17} />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(today)}
              className="h-9 rounded-xl border border-border glass px-3 text-sm text-accent"
            >
              Hoy
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate((d) => (d < today ? addDaysISO(d, 1) : d))}
            aria-label="Día siguiente"
            disabled={isToday}
            className="grid h-9 w-9 place-items-center rounded-xl border border-border glass text-muted transition-colors hover:border-accent/50 hover:text-accent disabled:opacity-40"
          >
            <ChevronRight size={17} />
          </button>
          <Button className="ml-1" variant="secondary" onClick={() => setGastoOpen(true)}>
            <Plus size={16} /> Gasto
          </Button>
        </div>
      </div>

      {/* KPIs del día */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <KpiCard
          label="Ingresos del día"
          icon={TrendingUp}
          cents={income}
          onClick={() => openDetail("Ingresos del día", dayPays)}
        />
        <KpiCard
          label="Egresos del día"
          icon={TrendingDown}
          cents={egresos}
          tone="down"
        />
        <KpiCard label="Balance" icon={Scale} cents={balance} highlight />
      </div>

      {/* Balance por método + servicios/productos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Balance por método">
          <div className="space-y-2">
            {(Object.keys(byMethod) as PaymentMethod[]).map((m) => {
              const Icon = METHOD_ICON[m];
              const v = byMethod[m];
              const max = Math.max(1, ...Object.values(byMethod));
              return (
                <button
                  key={m}
                  type="button"
                  onClick={() =>
                    openDetail(
                      `Ingresos · ${METHOD_LABEL[m]}`,
                      dayPays.filter((p) => p.splits.some((s) => s.method === m))
                    )
                  }
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2/60"
                >
                  <Icon size={16} className="shrink-0 text-muted" />
                  <span className="w-28 shrink-0 text-sm">{METHOD_LABEL[m]}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                    <span
                      className="block h-full rounded-full bg-accent"
                      style={{ width: `${(v / max) * 100}%` }}
                    />
                  </span>
                  <span className="w-24 shrink-0 text-right tabular text-sm font-medium">
                    {formatRD(v)}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 border-t border-border pt-3 text-sm">
            <Mini label="Ingresos por servicios" value={formatRD(servicios)} />
            <Mini label="Ingresos por productos" value={formatRD(productos)} />
          </div>
        </Card>

        {/* Ingresos por profesional */}
        <Card title={`Ingresos por ${skin.vocab.professional.toLowerCase()}`}>
          <ProBars
            data={incPro}
            proName={proName}
            onPick={(id) =>
              openDetail(
                `Ingresos · ${proName(id)}`,
                dayPays.filter((p) => p.professionalId === id)
              )
            }
            empty="Sin ingresos este día."
          />
        </Card>
      </div>

      {/* Propinas por profesional + Arqueo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={`Propinas por ${skin.vocab.professional.toLowerCase()}`}>
          <ProBars
            data={tips}
            proName={proName}
            accent="metallic"
            onPick={(id) =>
              openDetail(
                `Propinas · ${proName(id)}`,
                dayPays.filter((p) => p.professionalId === id && p.tip > 0)
              )
            }
            empty="Sin propinas este día."
          />
        </Card>

        {/* Arqueo de cierre */}
        <Card title="Arqueo de cierre">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">Efectivo esperado en caja</span>
              <span className="font-display text-xl font-semibold tabular">
                {formatRD(expected)}
              </span>
            </div>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Efectivo contado
              </span>
              <input
                inputMode="decimal"
                value={close ? String(fromCents(close.countedCash)) : counted}
                onChange={(e) => setCounted(e.target.value)}
                disabled={!!close}
                placeholder="0"
                className="w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm tabular outline-none focus:border-accent/60 disabled:opacity-70"
              />
            </label>
            {(counted !== "" || close) && (
              <div
                className="flex items-center justify-between rounded-xl px-3 py-2 text-sm"
                style={{
                  background:
                    difference === 0
                      ? "rgb(var(--st-completada) / 0.12)"
                      : "rgb(var(--st-cancelada) / 0.12)",
                  color:
                    difference === 0
                      ? "rgb(var(--st-completada))"
                      : "rgb(var(--st-cancelada))",
                }}
              >
                <span>Diferencia</span>
                <span className="tabular font-semibold">
                  {difference > 0 ? "+" : ""}
                  {formatRD2(difference)}
                </span>
              </div>
            )}
            {close ? (
              <div className="flex items-center gap-2 text-sm text-muted">
                <Lock size={15} /> Caja cerrada
              </div>
            ) : (
              <Button
                fullWidth
                disabled={counted === ""}
                onClick={() =>
                  closeCash({
                    date,
                    closedAt: new Date().toISOString(),
                    expectedCash: expected,
                    countedCash: toCents(Number(counted) || 0),
                    difference: toCents(Number(counted) || 0) - expected,
                  })
                }
              >
                <Lock size={16} /> Cerrar caja del día
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Gastos del día */}
      <Card
        title="Gastos del día"
        action={
          <button
            type="button"
            onClick={() => setGastoOpen(true)}
            className="text-xs font-medium text-accent hover:underline"
          >
            + Gasto
          </button>
        }
      >
        {dayExp.length === 0 ? (
          <p className="py-2 text-sm text-muted">Sin gastos registrados este día.</p>
        ) : (
          <div className="space-y-1.5">
            {dayExp.map((e) => (
              <div
                key={e.id}
                className="flex items-center gap-3 rounded-xl bg-surface-2/30 px-3 py-2"
              >
                <Coins size={15} className="shrink-0 text-muted" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{e.concept}</p>
                  <p className="text-[11px] text-muted">
                    {EXPENSE_CATEGORY_LABEL[e.category]} · {METHOD_LABEL[e.method]}
                  </p>
                </div>
                <span className="tabular text-sm font-medium text-[color:rgb(var(--st-cancelada))]">
                  − {formatRD(e.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Reportes por período */}
      <Card
        title="Reporte por período"
        action={
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {[14, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setReportDays(d)}
                className={cn(
                  "rounded-md px-2 py-0.5 font-medium transition-colors",
                  reportDays === d
                    ? "bg-accent text-accent-contrast"
                    : "text-muted hover:text-fg"
                )}
              >
                {d} días
              </button>
            ))}
          </div>
        }
      >
        <p className="mb-3 text-sm">
          <span className="text-muted">Ingresos del período: </span>
          <span className="font-display text-lg font-semibold tabular">
            {formatRD(periodTotal)}
          </span>
        </p>
        <div className="flex h-40 items-end gap-1">
          {series.map((s) => {
            const h = (s.income / maxIncome) * 100;
            const sel = s.date === date;
            return (
              <button
                key={s.date}
                type="button"
                onClick={() => setDate(s.date)}
                title={`${s.date}: ${formatRD(s.income)}`}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <span
                  className={cn(
                    "w-full rounded-t transition-colors",
                    sel ? "bg-accent" : "bg-accent/40 group-hover:bg-accent/70"
                  )}
                  style={{ height: `${Math.max(2, h)}%` }}
                />
              </button>
            );
          })}
        </div>
        <p className="mt-1 text-center text-[10px] text-muted">
          Toca una barra para ver ese día
        </p>
      </Card>

      {/* Modal de desglose (clic en un número) */}
      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.title ?? ""}
      >
        {detail && (
          <div className="space-y-2">
            {detail.rows.length === 0 ? (
              <p className="text-sm text-muted">Sin movimientos.</p>
            ) : (
              detail.rows.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-xl bg-surface-2/30 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.clientName}</p>
                    <p className="truncate text-[11px] text-muted">
                      {p.service} · {p.professionalName}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="tabular text-sm font-medium">
                      {formatRD(p.total)}
                    </p>
                    {p.tip > 0 && (
                      <p className="tabular text-[11px] text-muted">
                        Propina {formatRD(p.tip)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>

      {/* Registrar gasto */}
      <GastoModal
        open={gastoOpen}
        onClose={() => setGastoOpen(false)}
        onSave={(concept, amount, method, category) => {
          addExpense({ date, concept, amount: toCents(amount), method, category });
          setGastoOpen(false);
        }}
      />
    </div>
  );
}

/* ── Subcomponentes ── */

function Card({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border glass p-4 shadow-soft sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          {title}
        </p>
        {action}
      </div>
      {children}
    </div>
  );
}

function KpiCard({
  label,
  icon: Icon,
  cents,
  onClick,
  tone,
  highlight,
}: {
  label: string;
  icon: typeof TrendingUp;
  cents: number;
  onClick?: () => void;
  tone?: "down";
  highlight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "rounded-2xl border border-border glass p-5 text-left shadow-soft transition-premium",
        onClick && "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop",
        highlight && "shadow-glow"
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-accent">
          <Icon size={17} />
        </span>
      </div>
      <KpiNumber
        value={fromCents(cents)}
        prefix={tone === "down" && cents > 0 ? "− RD$ " : "RD$ "}
        className={cn(
          "font-display text-3xl font-semibold",
          highlight && "text-accent"
        )}
      />
    </button>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-muted">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}

function ProBars({
  data,
  proName,
  onPick,
  empty,
  accent = "accent",
}: {
  data: Record<string, number>;
  proName: (id: string) => string;
  onPick: (id: string) => void;
  empty: string;
  accent?: "accent" | "metallic";
}) {
  const entries = Object.entries(data)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);
  if (entries.length === 0)
    return <p className="py-2 text-sm text-muted">{empty}</p>;
  const max = Math.max(1, ...entries.map(([, v]) => v));
  return (
    <div className="space-y-2">
      {entries.map(([id, v]) => (
        <button
          key={id}
          type="button"
          onClick={() => onPick(id)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-2/60"
        >
          <span className="w-28 shrink-0 truncate text-sm">{proName(id)}</span>
          <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${(v / max) * 100}%`,
                background: `rgb(var(--${accent}))`,
              }}
            />
          </span>
          <span className="w-24 shrink-0 text-right tabular text-sm font-medium">
            {formatRD(v)}
          </span>
        </button>
      ))}
    </div>
  );
}

function GastoModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (
    concept: string,
    amount: number,
    method: PaymentMethod,
    category: ExpenseCategory
  ) => void;
}) {
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [category, setCategory] = useState<ExpenseCategory>("insumos");
  const cls =
    "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-accent/60";
  const valid = concept.trim() !== "" && Number(amount) > 0;
  return (
    <Modal open={open} onClose={onClose} title="Registrar gasto">
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Concepto</span>
          <input
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Ej. Compra de tintes"
            className={cls}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Monto (RD$)</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className={cn(cls, "tabular")}
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Categoría</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className={cls}
            >
              {(Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseCategory[]).map((c) => (
                <option key={c} value={c}>
                  {EXPENSE_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Fondo</span>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
              className={cls}
            >
              {(["efectivo", "transferencia", "tarjeta"] as PaymentMethod[]).map(
                (m) => (
                  <option key={m} value={m}>
                    {METHOD_LABEL[m]}
                  </option>
                )
              )}
            </select>
          </label>
        </div>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() => {
            onSave(concept.trim(), Number(amount), method, category);
            setConcept("");
            setAmount("");
          }}
        >
          Registrar gasto
        </Button>
        <p className="text-center text-[11px] text-muted">
          Demo: el gasto se ve al instante (no persiste al recargar).
        </p>
      </div>
    </Modal>
  );
}
