"use client";

/**
 * Módulo PAGOS — centro de control del dinero. Historial completo desde la
 * fuente única, búsqueda/filtros, cobro manual y recibo de ejemplo.
 */

import { useMemo, useState } from "react";
import { Wallet, Plus, Search, ChevronRight, Ban } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CobroPanel, CobroDraft } from "@/components/cobro/CobroPanel";
import { Recibo } from "./Recibo";
import { formatRD } from "@/lib/money/calc";
import { METHOD_LABEL, METHODS, PaymentMethod, Payment } from "@/lib/money/types";
import { professionalsFor } from "@/components/citas/data";

type Range = "hoy" | "7" | "30" | "todos";

function isoMinus(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  return `${dt.getFullYear()}-${`${dt.getMonth() + 1}`.padStart(2, "0")}-${`${dt.getDate()}`.padStart(2, "0")}`;
}

function methodLabel(p: Payment): string {
  if (p.splits.length > 1) return "Mixto";
  return p.splits[0] ? METHOD_LABEL[p.splits[0].method] : "—";
}

function fmtShort(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const NEW_DRAFT: CobroDraft = {
  source: "manual",
  clientName: "",
  service: "",
  professionalId: "",
  professionalName: "",
  serviceAmount: 0,
};

export function PagosClient() {
  const { businessType, skin } = useApp();
  const { payments, ready, today, voidPayment } = useMoney();
  const pros = useMemo(() => professionalsFor(businessType), [businessType]);

  const [search, setSearch] = useState("");
  const [range, setRange] = useState<Range>("hoy");
  const [proFilter, setProFilter] = useState<string>("todos");
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | "todos">("todos");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [nuevoOpen, setNuevoOpen] = useState(false);

  const filtered = useMemo(() => {
    const cutoff =
      range === "7" ? isoMinus(today, 6) : range === "30" ? isoMinus(today, 29) : null;
    const q = search.trim().toLowerCase();
    return payments
      .filter((p) => {
        if (range === "hoy" && p.date !== today) return false;
        if (cutoff && p.date < cutoff) return false;
        if (proFilter !== "todos" && p.professionalId !== proFilter) return false;
        if (methodFilter !== "todos" && !p.splits.some((s) => s.method === methodFilter))
          return false;
        if (q) {
          const hay = `${p.clientName} ${p.service} ${p.ncf}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [payments, range, proFilter, methodFilter, search, today]);

  const totalCobrado = filtered
    .filter((p) => p.status === "pagado")
    .reduce((s, p) => s + p.total, 0);

  const detail = payments.find((p) => p.id === detailId) ?? null;

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2/60" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Wallet size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Pagos
            </h1>
            <p className="text-xs text-muted">Historial de cobros · {skin.label}</p>
          </div>
        </div>
        <Button onClick={() => setNuevoOpen(true)}>
          <Plus size={16} /> Nuevo cobro
        </Button>
      </div>

      {/* Filtros */}
      <div className="space-y-3 rounded-2xl border border-border glass p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, servicio o NCF…"
              className="w-full rounded-xl border border-border bg-surface-2/40 py-2 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent/60"
            />
          </div>
          <select
            value={proFilter}
            onChange={(e) => setProFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-accent/60"
          >
            <option value="todos">Todos los {skin.vocab.professionalPlural.toLowerCase()}</option>
            {pros.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Rango */}
          <div className="flex rounded-lg border border-border p-0.5 text-xs">
            {(
              [
                ["hoy", "Hoy"],
                ["7", "7 días"],
                ["30", "30 días"],
                ["todos", "Todos"],
              ] as [Range, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setRange(k)}
                className={cn(
                  "rounded-md px-2.5 py-1 font-medium transition-colors",
                  range === k ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg"
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Método */}
          <div className="flex flex-wrap gap-1.5">
            {(["todos", ...METHODS] as (PaymentMethod | "todos")[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  methodFilter === m
                    ? "border-accent bg-accent-soft/50 text-accent"
                    : "border-border text-muted hover:text-fg"
                )}
              >
                {m === "todos" ? "Todos" : METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resumen del filtro */}
      <div className="flex items-center justify-between px-1 text-sm">
        <span className="text-muted">
          {filtered.length} {filtered.length === 1 ? "cobro" : "cobros"}
        </span>
        <span className="tabular">
          <span className="text-muted">Total: </span>
          <span className="font-display text-lg font-semibold">
            {formatRD(totalCobrado)}
          </span>
        </span>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
          No hay cobros con estos filtros.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const anulado = p.status === "anulado";
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setDetailId(p.id)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface-2/60",
                  anulado && "opacity-60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "truncate text-sm font-medium",
                      anulado && "line-through"
                    )}
                  >
                    {p.clientName}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {p.service} · {p.professionalName} · {fmtShort(p.createdAt)}
                  </p>
                </div>
                <span className="hidden shrink-0 rounded-full border border-border px-2 py-0.5 text-[11px] text-muted sm:inline">
                  {methodLabel(p)}
                </span>
                <div className="shrink-0 text-right">
                  <p className="tabular text-sm font-semibold">{formatRD(p.total)}</p>
                  {p.tip > 0 && (
                    <p className="tabular text-[11px] text-muted">
                      Propina {formatRD(p.tip)}
                    </p>
                  )}
                </div>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
                />
              </button>
            );
          })}
        </div>
      )}

      {/* Detalle / Recibo */}
      <Modal
        open={!!detail}
        onClose={() => setDetailId(null)}
        title="Recibo"
        footer={
          detail && detail.status === "pagado" ? (
            <button
              type="button"
              onClick={() => {
                voidPayment(detail.id);
                setDetailId(null);
              }}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:rgb(var(--st-cancelada))] transition-opacity hover:opacity-80"
            >
              <Ban size={15} /> Anular cobro
            </button>
          ) : null
        }
      >
        {detail && <Recibo payment={detail} />}
      </Modal>

      {/* Nuevo cobro manual */}
      <CobroPanel
        open={nuevoOpen}
        draft={NEW_DRAFT}
        onClose={() => setNuevoOpen(false)}
      />
    </div>
  );
}
