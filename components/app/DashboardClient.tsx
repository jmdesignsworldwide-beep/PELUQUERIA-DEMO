"use client";

/**
 * DASHBOARD — Sala de mando premium y VIVA. Lee la fuente única del dinero +
 * la agenda + catálogo, todo coherente con el resto del sistema. Cada tarjeta
 * es clickeable (clic = más info en su módulo). Bi-piel.
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarDays,
  Clock,
  ArrowRight,
  Scissors,
  Cake,
  PackageX,
  CalendarClock,
  TrendingUp,
  TrendingDown,
  Scale,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { KpiNumber } from "@/components/ui/KpiNumber";
import { cn } from "@/lib/cn";
import { fromCents, formatRD } from "@/lib/money/calc";
import {
  dayIncome,
  dayExpenses,
  dayTips,
  paymentsOn,
  dailySeries,
} from "@/lib/money/selectors";
import {
  Appointment,
  STATUSES,
  StatusKey,
  appointmentsFor,
  initials,
  minutesToLabel,
  professionalsFor,
  statusColor,
  addDays,
} from "@/components/citas/data";
import { DashboardKpis } from "./DashboardKpis";
import { productsFor, isLowStock } from "@/lib/catalog/products";

/* ── birthday determinista (coherente con Fidelización) ── */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function birthday(name: string): { month: number; day: number } {
  const h = hash(name);
  return { month: (h % 12) + 1, day: (Math.floor(h / 12) % 28) + 1 };
}

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

const ACTIVE: StatusKey[] = ["pendiente", "confirmada", "en_proceso"];

function Avatar({ name, hue, size = 34 }: { name: string; hue: number; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full font-semibold text-fg/90"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `hsl(${hue} 42% 50% / 0.22)`,
        boxShadow: `inset 0 0 0 1px hsl(${hue} 42% 55% / 0.45)`,
      }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

function Hairline() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
      }}
    />
  );
}

function Panel({
  children,
  className,
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const inner = (
    <div
      className={cn(
        "group relative h-full overflow-hidden rounded-2xl border border-border glass p-5 shadow-soft transition-premium",
        href && "hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop",
        className
      )}
    >
      <Hairline />
      {children}
    </div>
  );
  return href ? (
    <Link href={href} className="block h-full">
      {inner}
    </Link>
  ) : (
    inner
  );
}

function SectionTitle({
  children,
  icon: Icon,
  href,
}: {
  children: React.ReactNode;
  icon?: LucideIcon;
  href?: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        {Icon && <Icon size={13} />}
        {children}
      </p>
      {href && (
        <span className="text-muted transition-transform group-hover:translate-x-0.5">
          <ArrowRight size={15} />
        </span>
      )}
    </div>
  );
}

export function DashboardClient() {
  const { skin, businessType } = useApp();
  const { payments, expenses, today, ready } = useMoney();
  const vocab = skin.vocab;

  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(0);
  useEffect(() => {
    setMounted(true);
    setNow(nowMinutes());
    const t = window.setInterval(() => setNow(nowMinutes()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const pros = useMemo(() => professionalsFor(businessType), [businessType]);
  const proById = (id: string) => pros.find((p) => p.id === id);

  // Todas las citas de hoy (todas las pieles vía catálogo determinista).
  const apptsHoy = useMemo<Appointment[]>(
    () => pros.flatMap((p) => appointmentsFor(businessType, p.id, today)),
    [pros, businessType, today]
  );

  // Próxima cita (activa, sin terminar), ordenada por hora.
  const proxima = useMemo(() => {
    const cands = apptsHoy
      .filter((a) => ACTIVE.includes(a.status) && a.start + a.duration > now)
      .sort((a, b) => a.start - b.start);
    return cands[0] ?? null;
  }, [apptsHoy, now]);

  // Estilistas ahora: ocupado si tiene cita en curso.
  const estado = useMemo(() => {
    return pros.map((p) => {
      const enCurso = apptsHoy.find(
        (a) =>
          a.professionalId === p.id &&
          ACTIVE.includes(a.status) &&
          a.start <= now &&
          a.start + a.duration > now
      );
      return { pro: p, enCurso };
    });
  }, [pros, apptsHoy, now]);
  const ocupados = estado.filter((e) => e.enCurso).length;

  // Resumen del día por estado.
  const resumen = useMemo(() => {
    const acc: Record<StatusKey, number> = {
      pendiente: 0,
      confirmada: 0,
      en_proceso: 0,
      completada: 0,
      no_show: 0,
      cancelada: 0,
    };
    for (const a of apptsHoy) acc[a.status] += 1;
    return acc;
  }, [apptsHoy]);
  const totalHoy = apptsHoy.length;

  // Serie de ingresos de 7 días.
  const serie = useMemo(() => {
    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) dates.push(addDays(today, -i));
    return dailySeries(payments, expenses, dates).map((d) => ({
      label: new Date(d.date + "T00:00:00").toLocaleDateString("es-DO", {
        weekday: "short",
      }),
      ingresos: fromCents(d.income),
    }));
  }, [payments, expenses, today]);

  // Caja del día.
  const ingresos = dayIncome(payments, today);
  const egresos = dayExpenses(expenses, today);
  const balance = ingresos - egresos;

  // Alertas vivas.
  const lowStock = useMemo(
    () => productsFor(businessType).filter(isLowStock),
    [businessType]
  );
  const cumpleHoy = useMemo(() => {
    if (!mounted) return [] as string[];
    const d = new Date();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    const names = new Set<string>();
    for (const p of payments) if (p.status === "pagado") names.add(p.clientName);
    return Array.from(names).filter((n) => {
      const b = birthday(n);
      return b.month === m && b.day === day;
    });
  }, [payments, mounted]);
  const porConfirmar = resumen.pendiente;

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs text-muted">
          <Sparkles size={13} className="text-metallic" />
          {skin.label} · Sala de mando
        </span>
        <h1 className="mt-4 text-balance font-display text-3xl font-semibold leading-[1.05] tracking-tight sm:text-4xl">
          Bienvenida a <span className="text-accent">{skin.businessName}</span>.
        </h1>
      </div>

      {/* KPIs del día (count-up, ya en vivo) */}
      <DashboardKpis />

      {/* Próxima cita + Caja */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProximaCita appt={proxima} now={now} mounted={mounted} proById={proById} />
        </div>
        <Panel href="/app/caja">
          <SectionTitle icon={Scale} href="/app/caja">
            Caja de hoy
          </SectionTitle>
          <p className="font-display text-3xl font-semibold tabular text-accent">
            <KpiNumber value={fromCents(balance)} prefix="RD$ " />
          </p>
          <p className="mb-3 text-[11px] text-muted">balance del día</p>
          <div className="space-y-1.5 border-t border-border pt-3 text-sm">
            <Linea icon={TrendingUp} label="Ingresos" value={formatRD(ingresos)} />
            <Linea
              icon={TrendingDown}
              label="Egresos"
              value={egresos > 0 ? `− ${formatRD(egresos)}` : formatRD(0)}
            />
          </div>
        </Panel>
      </div>

      {/* Ingresos 7 días + Alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2" href="/app/reportes">
          <SectionTitle icon={TrendingUp} href="/app/reportes">
            Ingresos · últimos 7 días
          </SectionTitle>
          <div className="h-44 w-full">
            {ready && mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serie} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id="ingresosFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(var(--accent))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="rgb(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tick={{ fill: "rgb(var(--muted))", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "rgb(var(--muted))", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    width={44}
                    tickFormatter={(v) =>
                      Number(v) >= 1000 ? `${Math.round(Number(v) / 1000)}k` : `${v}`
                    }
                  />
                  <Tooltip
                    cursor={{ stroke: "rgb(var(--accent) / 0.4)" }}
                    contentStyle={{
                      background: "rgb(var(--surface))",
                      border: "1px solid rgb(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                      color: "rgb(var(--fg))",
                    }}
                    labelStyle={{ color: "rgb(var(--muted))" }}
                    formatter={(v) => [`RD$ ${Number(v).toLocaleString("es-DO")}`, "Ingresos"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="ingresos"
                    stroke="rgb(var(--accent))"
                    strokeWidth={2}
                    fill="url(#ingresosFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full w-full animate-pulse rounded-xl bg-surface-2/50" />
            )}
          </div>
        </Panel>

        {/* Alertas vivas */}
        <Panel>
          <SectionTitle icon={Sparkles}>Alertas de hoy</SectionTitle>
          <div className="space-y-2">
            <Alerta
              href="/app/citas"
              icon={CalendarClock}
              tone="--st-pendiente"
              label="Citas por confirmar"
              value={porConfirmar}
            />
            <Alerta
              href="/app/inventario"
              icon={PackageX}
              tone="--st-cancelada"
              label="Productos bajo stock"
              value={lowStock.length}
            />
            <Alerta
              href="/app/fidelizacion"
              icon={Cake}
              tone="--st-confirmada"
              label="Cumpleaños de hoy"
              value={cumpleHoy.length}
            />
          </div>
        </Panel>
      </div>

      {/* Estilistas ahora + Resumen del día */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel href="/app/profesionales">
          <SectionTitle icon={Scissors} href="/app/profesionales">
            {vocab.professionalPlural} ahora · {ocupados}/{pros.length} ocupad
            {ocupados === 1 ? "o" : "os"}
          </SectionTitle>
          <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {estado.map(({ pro, enCurso }) => (
              <div
                key={pro.id}
                className="flex items-center gap-2.5 rounded-xl bg-surface-2/30 px-2.5 py-2"
              >
                <Avatar name={pro.name} hue={pro.hue} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{pro.name}</p>
                  <p className="truncate text-[11px] text-muted">
                    {enCurso ? `Con ${enCurso.client}` : "Libre ahora"}
                  </p>
                </div>
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    background: enCurso
                      ? statusColor("en_proceso", 1)
                      : statusColor("completada", 1),
                  }}
                  aria-hidden
                />
              </div>
            ))}
          </div>
        </Panel>

        <Panel href="/app/citas">
          <SectionTitle icon={CalendarDays} href="/app/citas">
            Resumen del día · {totalHoy} citas
          </SectionTitle>
          <div className="space-y-2">
            {(["completada", "confirmada", "en_proceso", "pendiente", "no_show", "cancelada"] as StatusKey[])
              .filter((s) => resumen[s] > 0)
              .map((s) => {
                const pct = totalHoy ? (resumen[s] / totalHoy) * 100 : 0;
                return (
                  <div key={s} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-sm">{STATUSES[s].label}</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${pct}%`, background: statusColor(s, 0.9) }}
                      />
                    </span>
                    <span className="w-7 shrink-0 text-right tabular text-sm font-medium">
                      {resumen[s]}
                    </span>
                  </div>
                );
              })}
            {totalHoy === 0 && (
              <p className="py-4 text-sm text-muted">No hay citas hoy.</p>
            )}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ── Próxima cita destacada (viva) ── */
function ProximaCita({
  appt,
  now,
  mounted,
  proById,
}: {
  appt: Appointment | null;
  now: number;
  mounted: boolean;
  proById: (id: string) => { name: string; hue: number; specialty: string } | undefined;
}) {
  if (!mounted) {
    return (
      <div className="h-full min-h-[160px] animate-pulse rounded-2xl bg-surface-2/50" />
    );
  }
  if (!appt) {
    return (
      <Panel href="/app/citas" className="flex flex-col justify-center">
        <SectionTitle icon={CalendarClock} href="/app/citas">
          Próxima cita
        </SectionTitle>
        <div className="flex flex-col items-center py-6 text-center">
          <CalendarDays size={28} className="mb-2 text-muted" />
          <p className="text-sm text-muted">No hay más citas por hoy.</p>
        </div>
      </Panel>
    );
  }
  const pro = proById(appt.professionalId);
  const enCurso = appt.start <= now;
  const falta = appt.start - now;
  const cuanto = enCurso
    ? "En curso ahora"
    : falta < 60
    ? `En ${falta} min`
    : `En ${Math.floor(falta / 60)} h ${falta % 60} min`;

  return (
    <Panel href="/app/citas" className="flex h-full flex-col">
      <SectionTitle icon={CalendarClock} href="/app/citas">
        Próxima cita
      </SectionTitle>
      <div className="flex flex-1 flex-col justify-center gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={appt.client} hue={pro?.hue ?? 0} size={52} />
          <div className="min-w-0">
            <p className="truncate font-display text-xl font-semibold tracking-tight">
              {appt.client}
            </p>
            <p className="truncate text-sm text-muted">{appt.service}</p>
            <p className="truncate text-[11px] text-muted">
              {pro?.name ?? "—"} · {pro?.specialty ?? ""}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-left sm:text-right">
          <p className="flex items-center gap-1.5 font-display text-2xl font-semibold tabular sm:justify-end">
            <Clock size={18} className="text-accent" />
            {minutesToLabel(appt.start)}
          </p>
          <span
            className="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              color: statusColor(enCurso ? "en_proceso" : "confirmada", 1),
              background: statusColor(enCurso ? "en_proceso" : "confirmada", 0.12),
              boxShadow: `inset 0 0 0 1px ${statusColor(
                enCurso ? "en_proceso" : "confirmada",
                0.3
              )}`,
            }}
          >
            {cuanto}
          </span>
        </div>
      </div>
    </Panel>
  );
}

function Linea({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={14} className="shrink-0 text-muted" />
      <span className="text-muted">{label}</span>
      <span className="ml-auto tabular font-medium">{value}</span>
    </div>
  );
}

function Alerta({
  href,
  icon: Icon,
  tone,
  label,
  value,
}: {
  href: string;
  icon: LucideIcon;
  tone: string;
  label: string;
  value: number;
}) {
  const on = value > 0;
  return (
    <Link
      href={href}
      className="group/a flex items-center gap-3 rounded-xl border border-border bg-surface-2/30 px-3 py-2.5 transition-premium hover:border-accent/40 hover:bg-surface-2/60"
    >
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
        style={{
          color: on ? `rgb(var(${tone}))` : "rgb(var(--muted))",
          background: on ? `rgb(var(${tone}) / 0.12)` : "rgb(var(--surface-2))",
        }}
      >
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm">{label}</span>
      <span
        className="shrink-0 tabular text-base font-semibold"
        style={{ color: on ? `rgb(var(${tone}))` : "rgb(var(--muted))" }}
      >
        {value}
      </span>
    </Link>
  );
}
