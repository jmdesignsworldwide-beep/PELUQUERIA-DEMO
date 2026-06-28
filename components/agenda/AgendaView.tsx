"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { formatRD } from "@/lib/format";
import {
  STATUS_BLOCK,
  STATUS_DOT,
  STATUS_LABEL,
  STATUS_ORDER,
} from "./status";
import {
  createBlock,
  createWalkin,
  deleteBlock,
  moveAppointment,
  setStatus,
} from "@/app/app/citas/actions";
import type { AgAppt, AgStatus, AgendaData } from "@/lib/agenda";

// Rango de la jornada que se MUESTRA en la rejilla (configurable).
const RANGE_OPEN = 8 * 60; // 8:00 AM
const RANGE_CLOSE = 20 * 60; // 8:00 PM
const RANGE = RANGE_CLOSE - RANGE_OPEN;
const SLOT = 30;
const MOBILE_PX = 1.4; // alto por minuto en móvil (scrollable)

// Posiciones como % del rango → en escritorio la altura se ajusta a la pantalla
// (todo el día sin scroll); en móvil el contenedor tiene alto fijo (scrollable).
const topPct = (min: number) => ((min - RANGE_OPEN) / RANGE) * 100;
const hPct = (dur: number) => (dur / RANGE) * 100;

// Servicios inyectados desde el server (para el formulario walk-in).
const ServicesContext = createContext<
  { id: string; name: string; price: number }[]
>([]);
function useServices() {
  return { services: useContext(ServicesContext) };
}

function fmtMin(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

function shiftDate(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

function dateLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat("es-DO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(dt);
}

export function AgendaView({ data }: { data: AgendaData }) {
  const { skin } = useApp();
  const v = skin.vocab;
  const router = useRouter();

  const [detail, setDetail] = useState<AgAppt | null>(null);
  const [walkin, setWalkin] = useState<{ proId: string; startMin: number } | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [mobilePro, setMobilePro] = useState(data.professionals[0]?.id ?? "");

  const mobileH = RANGE * MOBILE_PX;
  const hourMarks = useMemo(() => {
    const marks: number[] = [];
    for (let h = RANGE_OPEN; h <= RANGE_CLOSE; h += 60) marks.push(h);
    return marks;
  }, []);

  const apptsByPro = (proId: string) =>
    data.appts.filter((a) => a.professionalId === proId);
  const blocksByPro = (proId: string) =>
    data.blocks.filter((b) => b.professionalId === proId);

  async function onDrop(proId: string, startMin: number, apptId: string) {
    setDraggingId(null);
    const res = await moveAppointment({
      apptId,
      professionalId: proId,
      startMin,
      dateStr: data.dateStr,
    });
    if (res.error) alert(res.error);
    else router.refresh();
  }

  function goDate(newDate: string) {
    router.push(`/app/citas?date=${newDate}`);
  }

  // ── Columna de un profesional (posiciones en % → cabe sin scroll en PC) ──
  function ProColumn({ proId, compact }: { proId: string; compact: boolean }) {
    const slots: number[] = [];
    for (let t = RANGE_OPEN; t < RANGE_CLOSE; t += SLOT) slots.push(t);
    return (
      <div className="relative h-full">
        {/* drop targets / slots clicables */}
        {slots.map((t) => (
          <div
            key={t}
            onClick={() => setWalkin({ proId, startMin: t })}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              const id = e.dataTransfer.getData("text/plain");
              if (id) onDrop(proId, t, id);
            }}
            className="absolute inset-x-0 cursor-pointer border-t border-border/40 transition-colors hover:bg-surface-2/40"
            style={{ top: `${topPct(t)}%`, height: `${hPct(SLOT)}%` }}
          />
        ))}

        {/* bloqueos */}
        {blocksByPro(proId).map((b) => (
          <div
            key={b.id}
            className="absolute inset-x-1 z-10 flex items-center justify-between gap-1 overflow-hidden rounded-md border border-dashed border-border bg-surface-2/80 px-1.5 text-[11px] text-muted"
            style={{
              top: `${topPct(b.startMin)}%`,
              height: `${hPct(b.endMin - b.startMin)}%`,
              minHeight: 18,
            }}
          >
            <span className="inline-flex items-center gap-1 truncate">
              <Lock size={11} /> {b.reason}
            </span>
            <button
              onClick={async () => {
                await deleteBlock(b.id);
                router.refresh();
              }}
              className="shrink-0 text-muted hover:text-accent"
              aria-label="Quitar bloqueo"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        {/* citas */}
        {apptsByPro(proId).map((a) => (
          <button
            key={a.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", a.id);
              setDraggingId(a.id);
            }}
            onDragEnd={() => setDraggingId(null)}
            onClick={() => setDetail(a)}
            title={`${a.clientName} · ${a.serviceName} · ${fmtMin(a.startMin)}`}
            className={cn(
              "absolute inset-x-1 z-20 overflow-hidden rounded-md border-l-[3px] px-1.5 text-left leading-tight shadow-sm transition-opacity",
              compact ? "py-0.5" : "py-1",
              STATUS_BLOCK[a.status],
              draggingId === a.id && "opacity-40"
            )}
            style={{
              top: `calc(${topPct(a.startMin)}% + 1px)`,
              height: `calc(${hPct(a.endMin - a.startMin)}% - 2px)`,
              minHeight: 20,
            }}
          >
            <p className="truncate text-[11px] font-medium leading-tight">
              {a.clientName}
            </p>
            <p className="truncate text-[10px] leading-tight text-muted">
              {fmtMin(a.startMin)} · {a.serviceName}
            </p>
          </button>
        ))}

        {/* línea de ahora */}
        {data.nowMin !== null &&
          data.nowMin >= RANGE_OPEN &&
          data.nowMin <= RANGE_CLOSE && (
            <div
              className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
              style={{ top: `${topPct(data.nowMin)}%` }}
            >
              <span className="h-2 w-2 -translate-x-1 rounded-full bg-accent" />
              <span className="h-px flex-1 bg-accent/70" />
            </div>
          )}
      </div>
    );
  }

  return (
    <ServicesContext.Provider value={data.services}>
    <div className="space-y-5">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Agenda
          </h1>
          {data.locationName && (
            <p className="mt-0.5 text-sm text-muted">{data.locationName}</p>
          )}
        </div>
        <Button onClick={() => setWalkin({ proId: data.professionals[0]?.id ?? "", startMin: data.nowMin ? Math.round(data.nowMin / 30) * 30 : data.openMin })}>
          <Plus size={18} /> Cita rápida
        </Button>
      </div>

      {/* Selector de día */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-border glass p-2">
        <button
          onClick={() => goDate(shiftDate(data.dateStr, -1))}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label="Día anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="font-display text-base font-semibold capitalize">
            {dateLabel(data.dateStr)}
          </p>
          {!data.isToday && (
            <button
              onClick={() => router.push("/app/citas")}
              className="text-xs text-accent hover:underline"
            >
              Volver a hoy
            </button>
          )}
        </div>
        <button
          onClick={() => goDate(shiftDate(data.dateStr, 1))}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label="Día siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setBlocking(true)}>
          <Lock size={15} /> Bloquear horario
        </Button>
        {/* Leyenda */}
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5">
              <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
              {STATUS_LABEL[s]}
            </span>
          ))}
        </div>
      </div>

      {/* ───── DESKTOP: rejilla por profesional (todo el día sin scroll) ───── */}
      <div className="hidden rounded-2xl border border-border glass p-3 lg:block">
        {/* La altura se ajusta a la pantalla: 8am–8pm caben sin scroll. */}
        <div className="flex h-[calc(100dvh-17rem)] min-h-[420px]">
          {/* encabezados + eje en una columna fija */}
          <div className="flex w-12 shrink-0 flex-col">
            <div className="mb-1 h-9 shrink-0" />
            <div className="relative flex-1">
              {hourMarks.map((h) => (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular text-muted"
                  style={{ top: `${topPct(h)}%` }}
                >
                  {fmtMin(h)}
                </span>
              ))}
            </div>
          </div>
          {/* columnas */}
          <div className="grid flex-1 auto-cols-fr grid-flow-col">
            {data.professionals.map((p) => (
              <div
                key={p.id}
                className="flex min-w-0 flex-col border-l border-border px-1"
              >
                <div className="mb-1 h-9 shrink-0 text-center">
                  <p className="truncate text-sm font-medium leading-tight">
                    {p.name}
                  </p>
                  <p className="truncate text-[11px] leading-tight text-muted">
                    {p.specialty}
                  </p>
                </div>
                <div className="flex-1">
                  <ProColumn proId={p.id} compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ───── MÓVIL: un profesional a la vez ───── */}
      <div className="lg:hidden">
        <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
          {data.professionals.map((p) => (
            <button
              key={p.id}
              onClick={() => setMobilePro(p.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                mobilePro === p.id
                  ? "border-accent/50 bg-accent-soft/60 text-accent"
                  : "border-border text-muted"
              )}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="rounded-2xl border border-border glass p-3">
          <div className="flex" style={{ height: mobileH }}>
            <div className="relative w-12 shrink-0">
              {hourMarks.map((h) => (
                <span
                  key={h}
                  className="absolute right-1 -translate-y-1/2 text-[10px] tabular text-muted"
                  style={{ top: `${topPct(h)}%` }}
                >
                  {fmtMin(h)}
                </span>
              ))}
            </div>
            <div className="flex-1 border-l border-border px-1">
              {mobilePro && <ProColumn proId={mobilePro} compact={false} />}
            </div>
          </div>
        </div>
      </div>

      {/* ───── Modales ───── */}
      {detail && (
        <DetailModal
          appt={detail}
          professionals={data.professionals}
          dateStr={data.dateStr}
          openMin={data.openMin}
          closeMin={data.closeMin}
          vocabProfessional={v.professional}
          onClose={() => setDetail(null)}
          onChanged={() => {
            setDetail(null);
            router.refresh();
          }}
        />
      )}

      <WalkinModal
        open={!!walkin}
        preset={walkin}
        dateStr={data.dateStr}
        professionals={data.professionals}
        openMin={data.openMin}
        closeMin={data.closeMin}
        onClose={() => setWalkin(null)}
        onCreated={() => {
          setWalkin(null);
          router.refresh();
        }}
      />

      <BlockModal
        open={blocking}
        dateStr={data.dateStr}
        professionals={data.professionals}
        openMin={data.openMin}
        closeMin={data.closeMin}
        onClose={() => setBlocking(false)}
        onCreated={() => {
          setBlocking(false);
          router.refresh();
        }}
      />
    </div>
    </ServicesContext.Provider>
  );
}

/* ───────── Detalle de cita ───────── */
function DetailModal({
  appt,
  professionals,
  dateStr,
  openMin,
  closeMin,
  vocabProfessional,
  onClose,
  onChanged,
}: {
  appt: AgAppt;
  professionals: { id: string; name: string }[];
  dateStr: string;
  openMin: number;
  closeMin: number;
  vocabProfessional: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [pro, setPro] = useState(appt.professionalId ?? "");
  const [startMin, setStartMin] = useState(appt.startMin);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const times: number[] = [];
  for (let t = openMin; t < closeMin; t += SLOT) times.push(t);

  async function changeStatus(s: AgStatus) {
    setBusy(true);
    const res = await setStatus(appt.id, s);
    setBusy(false);
    if (res.error) setError(res.error);
    else onChanged();
  }
  async function saveMove() {
    setBusy(true);
    setError(null);
    const res = await moveAppointment({
      apptId: appt.id,
      professionalId: pro,
      startMin,
      dateStr,
    });
    setBusy(false);
    if (res.error) setError(res.error);
    else onChanged();
  }

  return (
    <Modal open onClose={onClose} title={appt.clientName}>
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface-2/40 p-4 text-sm">
          <div className="flex items-center justify-between">
            <span className="font-medium">{appt.serviceName}</span>
            <span className="tabular text-accent">{formatRD(appt.amount)}</span>
          </div>
          <p className="mt-1 text-xs text-muted">
            {fmtMin(appt.startMin)} – {fmtMin(appt.endMin)}
            {appt.source === "publica" && " · reservada en línea"}
            {appt.bookingCode && ` · ${appt.bookingCode}`}
          </p>
          {appt.clientId && (
            <Link
              href={`/app/clientes/${appt.clientId}`}
              className="mt-2 inline-flex items-center gap-1 text-xs text-accent hover:underline"
            >
              <User size={13} /> Ver ficha del cliente
            </Link>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-muted">Estado</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_ORDER.map((s) => (
              <button
                key={s}
                disabled={busy}
                onClick={() => changeStatus(s)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm transition-colors",
                  appt.status === s
                    ? "border-accent bg-accent text-accent-contrast"
                    : "border-border text-muted hover:text-fg"
                )}
              >
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg/80">
              {vocabProfessional}
            </label>
            <select
              value={pro}
              onChange={(e) => setPro(e.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-surface-2/60 px-3 text-fg outline-none focus:border-accent/60"
            >
              {professionals.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-fg/80">
              Hora
            </label>
            <select
              value={startMin}
              onChange={(e) => setStartMin(Number(e.target.value))}
              className="h-11 w-full rounded-xl border border-border bg-surface-2/60 px-3 text-fg outline-none focus:border-accent/60"
            >
              {times.map((t) => (
                <option key={t} value={t}>
                  {fmtMin(t)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}

        {(pro !== appt.professionalId || startMin !== appt.startMin) && (
          <Button fullWidth loading={busy} onClick={saveMove}>
            Guardar cambio de hora / {vocabProfessional.toLowerCase()}
          </Button>
        )}
      </div>
    </Modal>
  );
}

/* ───────── Walk-in ───────── */
function WalkinModal({
  open,
  preset,
  dateStr,
  professionals,
  openMin,
  closeMin,
  onClose,
  onCreated,
}: {
  open: boolean;
  preset: { proId: string; startMin: number } | null;
  dateStr: string;
  professionals: { id: string; name: string }[];
  openMin: number;
  closeMin: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Cita rápida / Walk-in">
      {open && preset && (
        <WalkinForm
          preset={preset}
          dateStr={dateStr}
          professionals={professionals}
          openMin={openMin}
          closeMin={closeMin}
          onCreated={onCreated}
        />
      )}
    </Modal>
  );
}

function WalkinForm({
  preset,
  dateStr,
  professionals,
  openMin,
  closeMin,
  onCreated,
}: {
  preset: { proId: string; startMin: number };
  dateStr: string;
  professionals: { id: string; name: string }[];
  openMin: number;
  closeMin: number;
  onCreated: () => void;
}) {
  const { services } = useServices();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [pro, setPro] = useState(preset.proId || professionals[0]?.id || "");
  const [startMin, setStartMin] = useState(
    Math.max(openMin, Math.min(preset.startMin, closeMin - 30))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const times: number[] = [];
  for (let t = openMin; t < closeMin; t += SLOT) times.push(t);

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await createWalkin({
      name,
      phone,
      serviceId,
      professionalId: pro,
      dateStr,
      startMin,
    });
    setBusy(false);
    if (res.error) setError(res.error);
    else onCreated();
  }

  const inputCls =
    "h-11 w-full rounded-xl border border-border bg-surface-2/60 px-3 text-fg outline-none focus:border-accent/60";

  return (
    <div className="space-y-4">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del cliente *"
        className={inputCls}
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="Teléfono (809…)"
        inputMode="numeric"
        className={inputCls}
      />
      <select value={serviceId} onChange={(e) => setServiceId(e.target.value)} className={inputCls}>
        <option value="">Servicio…</option>
        {services.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} · {formatRD(s.price)}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-3">
        <select value={pro} onChange={(e) => setPro(e.target.value)} className={inputCls}>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select value={startMin} onChange={(e) => setStartMin(Number(e.target.value))} className={inputCls}>
          {times.map((t) => (
            <option key={t} value={t}>
              {fmtMin(t)}
            </option>
          ))}
        </select>
      </div>
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
          <AlertCircle size={16} className="shrink-0" /> {error}
        </div>
      )}
      <Button
        fullWidth
        loading={busy}
        onClick={submit}
        disabled={!name.trim() || !serviceId || !pro}
      >
        Crear cita
      </Button>
    </div>
  );
}

/* ───────── Bloqueo ───────── */
function BlockModal({
  open,
  dateStr,
  professionals,
  openMin,
  closeMin,
  onClose,
  onCreated,
}: {
  open: boolean;
  dateStr: string;
  professionals: { id: string; name: string }[];
  openMin: number;
  closeMin: number;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [pro, setPro] = useState(professionals[0]?.id ?? "");
  const [startMin, setStartMin] = useState(13 * 60);
  const [endMin, setEndMin] = useState(14 * 60);
  const [reason, setReason] = useState("Almuerzo");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const times: number[] = [];
  for (let t = openMin; t <= closeMin; t += SLOT) times.push(t);
  const inputCls =
    "h-11 w-full rounded-xl border border-border bg-surface-2/60 px-3 text-fg outline-none focus:border-accent/60";

  async function submit() {
    setBusy(true);
    setError(null);
    const res = await createBlock({ professionalId: pro, dateStr, startMin, endMin, reason });
    setBusy(false);
    if (res.error) setError(res.error);
    else onCreated();
  }

  return (
    <Modal open={open} onClose={onClose} title="Bloquear horario">
      <div className="space-y-4">
        <select value={pro} onChange={(e) => setPro(e.target.value)} className={inputCls}>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <select value={startMin} onChange={(e) => setStartMin(Number(e.target.value))} className={inputCls}>
            {times.map((t) => (
              <option key={t} value={t}>{fmtMin(t)}</option>
            ))}
          </select>
          <select value={endMin} onChange={(e) => setEndMin(Number(e.target.value))} className={inputCls}>
            {times.map((t) => (
              <option key={t} value={t}>{fmtMin(t)}</option>
            ))}
          </select>
        </div>
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Motivo (almuerzo, ausencia…)"
          className={inputCls}
        />
        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
            <AlertCircle size={16} className="shrink-0" /> {error}
          </div>
        )}
        <Button fullWidth loading={busy} onClick={submit} disabled={!pro}>
          Bloquear
        </Button>
      </div>
    </Modal>
  );
}

