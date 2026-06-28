"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock,
  Phone,
  Scissors,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Card } from "@/components/ui/Card";
import { KpiNumber } from "@/components/ui/KpiNumber";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";
import { formatRD, formatTimeRD } from "@/lib/format";
import type { ApptLite, DashboardData } from "@/lib/dashboard";
import { RevenueSparkline } from "./RevenueSparkline";

/* ───────────────── piezas vivas ───────────────── */

function PulseDot({ tone = "accent" }: { tone?: "accent" | "ok" | "warn" }) {
  const color =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-accent";
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className={cn(
          "absolute inline-flex h-full w-full animate-ping rounded-full opacity-70",
          color
        )}
      />
      <span className={cn("relative inline-flex h-2.5 w-2.5 rounded-full", color)} />
    </span>
  );
}

/** Cuenta regresiva viva hacia la próxima cita (tic real desde la referencia). */
function Countdown({ targetISO, baseISO }: { targetISO: string; baseISO: string }) {
  const [now, setNow] = useState(() => new Date(baseISO).getTime());
  useEffect(() => {
    const mounted = Date.now();
    const base = new Date(baseISO).getTime();
    const t = setInterval(() => setNow(base + (Date.now() - mounted)), 1000);
    return () => clearInterval(t);
  }, [baseISO]);

  const diff = new Date(targetISO).getTime() - now;
  const mins = Math.max(0, Math.round(diff / 60000));
  let label: string;
  if (mins < 1) label = "ahora mismo";
  else if (mins < 60) label = `en ${mins} min`;
  else label = `en ${Math.floor(mins / 60)} h ${mins % 60} min`;

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-sm font-medium text-accent">
      <Clock size={14} />
      {label}
    </span>
  );
}

const STATUS_STYLE: Record<ApptLite["status"], string> = {
  completada: "bg-emerald-500/15 text-emerald-500",
  en_curso: "bg-accent/15 text-accent",
  pendiente: "bg-amber-500/15 text-amber-500",
  cancelada: "bg-red-500/15 text-red-500",
};
const STATUS_LABEL: Record<ApptLite["status"], string> = {
  completada: "Completada",
  en_curso: "En curso",
  pendiente: "Pendiente",
  cancelada: "Cancelada",
};

/* ───────────────── skeleton de carga ───────────────── */

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-72" />
        <Skeleton className="h-4 w-44" />
      </div>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-40 rounded-2xl" />
      </div>
    </div>
  );
}

/* ───────────────── vista principal ───────────────── */

type ModalKind = null | "next" | "citas" | "caja" | "pros";

export function DashboardView({ data }: { data: DashboardData }) {
  const { skin } = useApp();
  const v = skin.vocab;
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ModalKind>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 750);
    return () => clearTimeout(t);
  }, []);

  if (loading) return <DashboardSkeleton />;

  const next = data.next;

  return (
    <>
      {/* Saludo */}
      <Reveal className="mb-6 space-y-2">
        <RevealItem>
          <p className="text-sm text-muted">
            {data.greeting} · {data.rdDateLabel}
          </p>
        </RevealItem>
        <RevealItem>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {skin.businessName}
          </h1>
        </RevealItem>
      </Reveal>

      {/* Próxima cita — la pieza más viva */}
      <Reveal className="mb-6">
        <RevealItem>
          <Card
            as="article"
            className="cursor-pointer p-6"
            onClick={() => next && setModal("next")}
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-muted">
                {next ? <PulseDot /> : <Clock size={14} />}
                Próxima cita
              </div>
              {next && (
                <Countdown targetISO={next.startsAt} baseISO={data.referenceNowISO} />
              )}
            </div>

            {next ? (
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="font-display text-2xl font-semibold tracking-tight">
                    {next.clientName}
                  </p>
                  <p className="mt-1 text-muted">
                    {next.serviceName} · {v.professional} {next.professionalName}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold tabular text-accent">
                    {formatTimeRD(next.startsAt)}
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-muted">
                    Ver detalle <ArrowRight size={14} />
                  </p>
                </div>
              </div>
            ) : (
              <p className="mt-4 text-muted">
                No quedan más citas por hoy. ¡Buen trabajo!
              </p>
            )}
          </Card>
        </RevealItem>
      </Reveal>

      {/* KPIs */}
      <Reveal className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Citas de hoy */}
        <RevealItem>
          <KpiCard
            label="Citas de hoy"
            icon={CalendarDays}
            onClick={() => setModal("citas")}
            footer={
              next ? (
                <span className="inline-flex items-center gap-1.5">
                  <PulseDot />
                  próxima {formatTimeRD(next.startsAt)}
                </span>
              ) : (
                "día completo"
              )
            }
          >
            <KpiNumber
              value={data.todayCount}
              className="font-display text-3xl font-semibold"
            />
          </KpiCard>
        </RevealItem>

        {/* Caja del día */}
        <RevealItem>
          <KpiCard
            label="Caja del día"
            icon={Wallet}
            onClick={() => setModal("caja")}
            footer={`${data.completed} ${data.completed === 1 ? "servicio cobrado" : "servicios cobrados"}`}
          >
            <KpiNumber
              value={data.cajaToday}
              prefix="RD$ "
              className="font-display text-3xl font-semibold"
            />
          </KpiCard>
        </RevealItem>

        {/* Profesionales trabajando */}
        <RevealItem>
          <KpiCard
            label={`${v.professionalPlural} ahora`}
            icon={Scissors}
            onClick={() => setModal("pros")}
            footer={
              <span className="inline-flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <PulseDot tone="warn" /> {data.busyCount} ocupados
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  {data.availableCount} libres
                </span>
              </span>
            }
          >
            <span className="font-display text-3xl font-semibold tabular">
              {data.busyCount}
              <span className="text-muted">/{data.professionals.length}</span>
            </span>
          </KpiCard>
        </RevealItem>
      </Reveal>

      {/* Resumen + tendencia */}
      <Reveal className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <RevealItem>
          <Card className="h-full p-6">
            <p className="mb-4 text-sm font-medium text-muted">Resumen del día</p>
            <div className="space-y-4">
              <SummaryBar
                label="Completadas"
                count={data.completed}
                total={data.todayCount}
                tone="ok"
              />
              <SummaryBar
                label="Pendientes"
                count={data.pending}
                total={data.todayCount}
                tone="warn"
              />
              <SummaryBar
                label="Canceladas"
                count={data.cancelled}
                total={data.todayCount}
                tone="bad"
              />
            </div>
          </Card>
        </RevealItem>

        <RevealItem>
          <Card className="h-full p-6">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-muted">
                Ingresos · últimos 7 días
              </p>
              <TrendingUp size={16} className="text-accent" />
            </div>
            <RevenueSparkline data={data.trend} />
          </Card>
        </RevealItem>
      </Reveal>

      {/* ───────── Modales (profundidad al clic) ───────── */}
      <Modal
        open={modal === "next"}
        onClose={() => setModal(null)}
        title="Próxima cita"
      >
        {next && <ApptDetail appt={next} professionalLabel={v.professional} />}
      </Modal>

      <Modal
        open={modal === "citas"}
        onClose={() => setModal(null)}
        title={`Citas de hoy · ${data.todayCount}`}
      >
        <div className="space-y-2">
          {data.todayList.map((a) => (
            <div
              key={a.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{a.clientName}</p>
                <p className="truncate text-xs text-muted">
                  {a.serviceName} · {a.professionalName}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="tabular text-sm text-muted">
                  {formatTimeRD(a.startsAt)}
                </span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11px] font-medium",
                    STATUS_STYLE[a.status]
                  )}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={modal === "caja"}
        onClose={() => setModal(null)}
        title="Desglose de la caja"
      >
        <div className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-border pb-3">
            <span className="text-muted">Total del día</span>
            <span className="font-display text-2xl font-semibold tabular text-accent">
              {formatRD(data.cajaToday)}
            </span>
          </div>
          {[
            ["Efectivo", data.cajaBreakdown.efectivo],
            ["Transferencia", data.cajaBreakdown.transferencia],
            ["Tarjeta", data.cajaBreakdown.tarjeta],
            ["Propinas", data.cajaBreakdown.propinas],
          ].map(([label, val]) => (
            <div key={label as string} className="flex items-center justify-between">
              <span className="text-sm text-muted">{label as string}</span>
              <span className="tabular font-medium">{formatRD(val as number)}</span>
            </div>
          ))}
        </div>
      </Modal>

      <Modal
        open={modal === "pros"}
        onClose={() => setModal(null)}
        title={`${v.professionalPlural} ahora`}
      >
        <div className="space-y-2">
          {data.professionals.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full",
                    p.busy ? "bg-amber-500" : "bg-emerald-500"
                  )}
                />
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted">{p.title}</p>
                </div>
              </div>
              <span className="text-sm text-muted">
                {p.busy ? (
                  <span className="text-amber-500">con {p.withClient}</span>
                ) : (
                  <span className="text-emerald-500">disponible</span>
                )}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

/* ───────────────── sub-componentes ───────────────── */

function KpiCard({
  label,
  icon: Icon,
  footer,
  onClick,
  children,
}: {
  label: string;
  icon: typeof Wallet;
  footer: React.ReactNode;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full cursor-pointer p-5" onClick={onClick}>
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-accent">
          <Icon size={17} />
        </span>
      </div>
      <div>{children}</div>
      <p className="mt-3 text-xs text-muted">{footer}</p>
    </Card>
  );
}

function SummaryBar({
  label,
  count,
  total,
  tone,
}: {
  label: string;
  count: number;
  total: number;
  tone: "ok" | "warn" | "bad";
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular font-medium">{count}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}

function ApptDetail({
  appt,
  professionalLabel,
}: {
  appt: ApptLite;
  professionalLabel: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-semibold">{appt.clientName}</p>
          {appt.clientPhone && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted">
              <Phone size={13} /> {appt.clientPhone}
            </p>
          )}
        </div>
        <span className="font-display text-xl font-semibold tabular text-accent">
          {formatTimeRD(appt.startsAt)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-surface-2/40 p-4 text-sm">
        <Field label="Servicio" value={appt.serviceName} />
        <Field label={professionalLabel} value={appt.professionalName} />
        <Field label="Monto" value={formatRD(appt.amount)} />
        <Field label="Termina" value={formatTimeRD(appt.endsAt)} />
      </div>
      <p className="inline-flex items-center gap-1.5 text-sm text-emerald-500">
        <CheckCircle2 size={15} /> Cita confirmada
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-muted">{label}</p>
      <p className="mt-0.5 font-medium text-fg">{value}</p>
    </div>
  );
}
