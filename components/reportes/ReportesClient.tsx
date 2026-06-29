"use client";

/**
 * REPORTES Y ESTADÍSTICAS (demo). Todo derivado de los datos reales del demo
 * (cobros de la fuente única + agenda + catálogo) → coherente con Caja, Pagos,
 * Servicios y Profesionales. Gráficos con los tokens de la piel. Filtro por
 * período; "clic = desglose" en servicios y profesionales.
 */

import { useMemo, useState } from "react";
import {
  BarChart3,
  TrendingUp,
  Scissors,
  Coins,
  Users,
  CalendarX,
  Gift,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { fromCents, formatRD } from "@/lib/money/calc";
import type { Payment } from "@/lib/money/types";
import {
  appointmentsFor,
  professionalsFor,
  fromISODate,
  mondayIndex,
} from "@/components/citas/data";
import { sellableProducts } from "@/lib/catalog/products";

function isoMinus(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  return `${dt.getFullYear()}-${`${dt.getMonth() + 1}`.padStart(2, "0")}-${`${dt.getDate()}`.padStart(2, "0")}`;
}
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function ReportesClient() {
  const { businessType, skin } = useApp();
  const { payments, today } = useMoney();
  const [period, setPeriod] = useState(30);
  const [drill, setDrill] = useState<{ title: string; rows: Payment[] } | null>(null);

  const pros = useMemo(() => professionalsFor(businessType), [businessType]);
  const proName = (id: string) =>
    id === "mostrador" ? "Mostrador" : pros.find((p) => p.id === id)?.name ?? id;

  const cutoff = isoMinus(today, period - 1);
  const ps = useMemo(
    () => payments.filter((p) => p.status === "pagado" && p.date >= cutoff),
    [payments, cutoff]
  );

  // KPIs
  const ingresos = ps.reduce((s, p) => s + p.total, 0);
  const propinas = ps.reduce((s, p) => s + p.tip, 0);
  const ticket = ps.length ? Math.round(ingresos / ps.length) : 0;

  // Agrupaciones
  const byService = useMemo(() => groupCount(ps, (p) => p.service), [ps]);
  const incomeByPro = useMemo(() => groupSum(ps, (p) => p.professionalId, (p) => p.subtotal), [ps]);
  const commByPro = useMemo(() => groupSum(ps, (p) => p.professionalId, (p) => p.commission), [ps]);
  const byClient = useMemo(() => groupCount(ps, (p) => p.clientName), [ps]);

  // Ingresos por día
  const serie = useMemo(() => {
    const days = Math.min(period, 30);
    return Array.from({ length: days }, (_, i) => {
      const date = isoMinus(today, days - 1 - i);
      const v = ps.filter((p) => p.date === date).reduce((s, p) => s + p.total, 0);
      return { date, v };
    });
  }, [ps, period, today]);
  const maxSerie = Math.max(1, ...serie.map((s) => s.v));

  // Agenda: demanda por día de semana + cancelaciones (14 días)
  const agenda = useMemo(() => {
    const byDow = [0, 0, 0, 0, 0, 0, 0];
    let total = 0, cancel = 0, noshow = 0;
    for (let d = 0; d < 14; d++) {
      const date = isoMinus(today, d);
      const dow = mondayIndex(fromISODate(date));
      for (const p of pros) {
        const appts = appointmentsFor(businessType, p.id, date);
        total += appts.length;
        byDow[dow] += appts.length;
        for (const a of appts) {
          if (a.status === "cancelada") cancel++;
          if (a.status === "no_show") noshow++;
        }
      }
    }
    return { byDow, total, cancel, noshow };
  }, [businessType, pros, today]);
  const maxDow = Math.max(1, ...agenda.byDow);

  // Productos vendidos (sembrado determinista, coherente con catálogo)
  const productos = useMemo(
    () =>
      sellableProducts(businessType)
        .map((p) => ({ label: p.name, value: 20 + (hash(p.id + p.name) % 110) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6),
    [businessType]
  );

  // Fidelización
  const fidel = useMemo(() => {
    const byCli = new Map<string, number>();
    for (const p of payments) {
      if (p.status === "pagado") byCli.set(p.clientName, (byCli.get(p.clientName) ?? 0) + p.total);
    }
    let puntos = 0, vip = 0;
    byCli.forEach((tot) => {
      const pts = Math.floor(fromCents(tot) / 50);
      puntos += pts;
      if (pts >= 250) vip++;
    });
    return { puntos, vip, clientes: byCli.size };
  }, [payments]);

  function drillService(service: string) {
    setDrill({ title: `Servicio · ${service}`, rows: ps.filter((p) => p.service === service) });
  }
  function drillPro(id: string) {
    setDrill({ title: `Profesional · ${proName(id)}`, rows: ps.filter((p) => p.professionalId === id) });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <BarChart3 size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Reportes</h1>
            <p className="text-xs text-muted">Estadísticas del negocio · {skin.label}</p>
          </div>
        </div>
        <div className="flex rounded-lg border border-border p-0.5 text-xs">
          {[7, 30].map((d) => (
            <button key={d} type="button" onClick={() => setPeriod(d)}
              className={cn("rounded-md px-2.5 py-1 font-medium transition-colors", period === d ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg")}>
              {d} días
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi icon={TrendingUp} label="Ingresos" value={formatRD(ingresos)} highlight />
        <Kpi icon={Scissors} label="Servicios" value={String(ps.length)} />
        <Kpi icon={Coins} label="Ticket promedio" value={formatRD(ticket)} />
        <Kpi icon={Coins} label="Propinas" value={formatRD(propinas)} />
      </div>

      {/* Ingresos por día */}
      <Card title={`Ingresos por día · ${period} días`}>
        <div className="flex h-40 items-end gap-1">
          {serie.map((s) => (
            <span key={s.date} className="flex-1 rounded-t bg-accent/60 transition-colors hover:bg-accent"
              style={{ height: `${Math.max(2, (s.v / maxSerie) * 100)}%` }}
              title={`${s.date}: ${formatRD(s.v)}`} />
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Servicios más solicitados" hint="Toca una barra para el desglose">
          <Bars data={byService} max={maxOf(byService)} fmt={(v) => `${v}`} onPick={drillService} />
        </Card>
        <Card title="Ingresos por profesional" hint="Toca una barra para el desglose">
          <Bars data={incomeByPro} max={maxOf(incomeByPro)} labelMap={proName} fmt={formatRD} onPickId={drillPro} cents />
        </Card>
        <Card title="Comisiones por profesional">
          <Bars data={commByPro} max={maxOf(commByPro)} labelMap={proName} fmt={formatRD} cents accent="metallic" />
        </Card>
        <Card title={`${skin.vocab.customerPlural} más frecuentes`}>
          <Bars data={byClient} max={maxOf(byClient)} fmt={(v) => `${v} visitas`} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title="Demanda por día (últ. 14 días)">
          <div className="flex h-40 items-end gap-2">
            {agenda.byDow.map((v, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <span className="w-full rounded-t bg-accent/60" style={{ height: `${Math.max(3, (v / maxDow) * 100)}%` }} title={`${v} citas`} />
                <span className="text-[10px] text-muted">{DOW[i]}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Productos más vendidos">
          <Bars data={Object.fromEntries(productos.map((p) => [p.label, p.value]))} max={Math.max(1, ...productos.map((p) => p.value))} fmt={(v) => `${v} u.`} />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border glass p-4">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><CalendarX size={12} /> Canceladas (14d)</p>
          <p className="font-display text-2xl font-semibold tabular" style={{ color: "rgb(var(--st-cancelada))" }}>{agenda.cancel}</p>
          <p className="text-[11px] text-muted">de {agenda.total} citas</p>
        </div>
        <div className="rounded-2xl border border-border glass p-4">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><CalendarX size={12} /> No presentadas (14d)</p>
          <p className="font-display text-2xl font-semibold tabular" style={{ color: "rgb(var(--st-noshow))" }}>{agenda.noshow}</p>
          <p className="text-[11px] text-muted">de {agenda.total} citas</p>
        </div>
        <div className="rounded-2xl border border-border glass p-4">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><Gift size={12} /> Fidelización</p>
          <p className="font-display text-2xl font-semibold tabular text-accent">{fidel.puntos.toLocaleString("es-DO")}</p>
          <p className="text-[11px] text-muted">puntos · {fidel.vip} VIP</p>
        </div>
      </div>

      {/* Desglose */}
      <Modal open={!!drill} onClose={() => setDrill(null)} title={drill?.title ?? ""}>
        {drill && (
          <div className="space-y-2">
            {drill.rows.length === 0 ? (
              <p className="text-sm text-muted">Sin movimientos en el período.</p>
            ) : (
              drill.rows.slice(0, 30).map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-xl bg-surface-2/30 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.clientName}</p>
                    <p className="truncate text-[11px] text-muted">{p.service} · {proName(p.professionalId)}</p>
                  </div>
                  <span className="tabular text-sm font-medium">{formatRD(p.total)}</span>
                </div>
              ))
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ── helpers de agrupación ── */
function groupCount(ps: Payment[], key: (p: Payment) => string): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of ps) acc[key(p)] = (acc[key(p)] ?? 0) + 1;
  return acc;
}
function groupSum(ps: Payment[], key: (p: Payment) => string, val: (p: Payment) => number): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const p of ps) acc[key(p)] = (acc[key(p)] ?? 0) + val(p);
  return acc;
}
function maxOf(rec: Record<string, number>): number {
  return Math.max(1, ...Object.values(rec));
}

/* ── UI ── */
function Card({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border glass p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{title}</p>
        {hint && <p className="text-[10px] text-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
function Kpi({ icon: Icon, label, value, highlight }: { icon: typeof TrendingUp; label: string; value: string; highlight?: boolean }) {
  return (
    <div className={cn("rounded-2xl border border-border glass p-4", highlight && "shadow-glow")}>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs text-muted">{label}</span>
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-accent"><Icon size={15} /></span>
      </div>
      <p className={cn("font-display text-2xl font-semibold tabular", highlight && "text-accent")}>{value}</p>
    </div>
  );
}
function Bars({
  data,
  max,
  fmt,
  labelMap,
  onPick,
  onPickId,
  cents,
  accent = "accent",
}: {
  data: Record<string, number>;
  max: number;
  fmt: (v: number) => string;
  labelMap?: (k: string) => string;
  onPick?: (k: string) => void;
  onPickId?: (k: string) => void;
  cents?: boolean;
  accent?: "accent" | "metallic";
}) {
  const entries = Object.entries(data).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 7);
  if (entries.length === 0) return <p className="py-2 text-sm text-muted">Sin datos en el período.</p>;
  const clickable = !!(onPick || onPickId);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => {
        const Row = (
          <>
            <span className="w-28 shrink-0 truncate text-sm">{labelMap ? labelMap(k) : k}</span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
              <span className="block h-full rounded-full" style={{ width: `${(v / max) * 100}%`, background: `rgb(var(--${accent}))` }} />
            </span>
            <span className="w-24 shrink-0 text-right tabular text-sm font-medium">{fmt(cents ? v : v)}</span>
          </>
        );
        return clickable ? (
          <button key={k} type="button" onClick={() => (onPickId ? onPickId(k) : onPick?.(k))}
            className="flex w-full items-center gap-3 rounded-lg px-1 py-1 text-left transition-colors hover:bg-surface-2/60">
            {Row}
          </button>
        ) : (
          <div key={k} className="flex items-center gap-3 px-1 py-1">{Row}</div>
        );
      })}
    </div>
  );
}
