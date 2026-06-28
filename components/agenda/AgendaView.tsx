"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CalendarDays,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Square,
  User,
  X,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Avatar } from "@/components/clients/Avatar";
import { Calendar } from "@/components/booking/Calendar";
import { cn } from "@/lib/cn";
import { formatRD } from "@/lib/format";
import { rdParts } from "@/lib/rd";
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

// Rango mostrado en la rejilla (configurable).
const RANGE_OPEN = 8 * 60;
const RANGE_CLOSE = 20 * 60;
const RANGE = RANGE_CLOSE - RANGE_OPEN;
const SLOT = 30;
const MOBILE_PX = 1.4;
const topPct = (min: number) => ((min - RANGE_OPEN) / RANGE) * 100;
const hPct = (dur: number) => (dur / RANGE) * 100;

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

/** Minuto del día actual en RD, que avanza solo (línea de "ahora" viva). */
function useLiveNowMin(active: boolean) {
  const [min, setMin] = useState(() => rdParts(new Date()).minutesOfDay);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(
      () => setMin(rdParts(new Date()).minutesOfDay),
      30000
    );
    return () => clearInterval(t);
  }, [active]);
  return min;
}

export function AgendaView({ data }: { data: AgendaData }) {
  const { skin } = useApp();
  const v = skin.vocab;
  const router = useRouter();

  const [detail, setDetail] = useState<AgAppt | null>(null);
  const [walkin, setWalkin] = useState<{ proId: string; startMin: number } | null>(null);
  const [blocking, setBlocking] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [showCal, setShowCal] = useState(false);
  const [mobilePro, setMobilePro] = useState(data.professionals[0]?.id ?? "");
  // Default inteligente: arranca con un número cómodo (5), no todos apretados.
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(data.professionals.slice(0, 5).map((p) => p.id))
  );

  const liveNow = useLiveNowMin(data.isToday);
  const nowMin = data.isToday ? liveNow : null;
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

  const shownPros = data.professionals.filter((p) => selected.has(p.id));

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }

  async function onDrop(proId: string, startMin: number, apptId: string) {
    setDraggingId(null);
    setDragOver(null);
    const res = await moveAppointment({
      apptId,
      professionalId: proId,
      startMin,
      dateStr: data.dateStr,
    });
    if (res.error) showToast(res.error);
    else router.refresh();
  }

  function goDate(newDate: string) {
    router.push(`/app/citas?date=${newDate}`);
  }

  // ── Columna de un profesional ──
  function ProColumn({ proId, compact }: { proId: string; compact: boolean }) {
    const slots: number[] = [];
    for (let t = RANGE_OPEN; t < RANGE_CLOSE; t += SLOT) slots.push(t);
    const appts = apptsByPro(proId);
    return (
      <div className="relative h-full">
        {slots.map((t) => {
          const key = `${proId}:${t}`;
          return (
            <div
              key={t}
              onClick={() => setWalkin({ proId, startMin: t })}
              onDragOver={(e) => {
                e.preventDefault();
                if (dragOver !== key) setDragOver(key);
              }}
              onDragLeave={() => dragOver === key && setDragOver(null)}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) onDrop(proId, t, id);
              }}
              className={cn(
                "absolute inset-x-0 cursor-pointer border-t border-border/40 transition-colors",
                dragOver === key ? "bg-accent/20" : "hover:bg-surface-2/40"
              )}
              style={{ top: `${topPct(t)}%`, height: `${hPct(SLOT)}%` }}
            />
          );
        })}

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

        {/* citas (bloques premium) */}
        {appts.map((a, i) => (
          <ApptBlock
            key={a.id}
            appt={a}
            index={i}
            compact={compact}
            nowMin={nowMin}
            dragging={draggingId === a.id}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", a.id);
              e.dataTransfer.effectAllowed = "move";
              setDraggingId(a.id);
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setDragOver(null);
            }}
            onClick={() => setDetail(a)}
          />
        ))}

        {/* línea de ahora viva */}
        {nowMin !== null && nowMin >= RANGE_OPEN && nowMin <= RANGE_CLOSE && (
          <div
            className="pointer-events-none absolute inset-x-0 z-30 flex items-center"
            style={{ top: `${topPct(nowMin)}%` }}
          >
            <span className="relative flex h-2.5 w-2.5 -translate-x-1">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-accent" />
            </span>
            <span className="h-[2px] flex-1 bg-accent/70" />
          </div>
        )}
      </div>
    );
  }

  return (
    <ServicesContext.Provider value={data.services}>
      <div className="space-y-4">
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
          <Button
            onClick={() =>
              setWalkin({
                proId: shownPros[0]?.id ?? data.professionals[0]?.id ?? "",
                startMin: nowMin ? Math.round(nowMin / 30) * 30 : data.openMin,
              })
            }
          >
            <Plus size={18} /> Cita rápida
          </Button>
        </div>

        {/* Selector de día + mini-calendario */}
        <div className="relative flex items-center justify-between gap-3 rounded-xl border border-border glass p-2">
          <button
            onClick={() => goDate(shiftDate(data.dateStr, -1))}
            className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
            aria-label="Día anterior"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => setShowCal((s) => !s)}
            className="flex items-center gap-2 rounded-lg px-3 py-1 hover:bg-surface-2"
          >
            <CalendarDays size={16} className="text-accent" />
            <span className="font-display text-base font-semibold capitalize">
              {dateLabel(data.dateStr)}
            </span>
          </button>
          <div className="flex items-center gap-1">
            {!data.isToday && (
              <button
                onClick={() => router.push("/app/citas")}
                className="rounded-lg px-2 py-1 text-xs text-accent hover:bg-surface-2"
              >
                Hoy
              </button>
            )}
            <button
              onClick={() => goDate(shiftDate(data.dateStr, 1))}
              className="grid h-9 w-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
              aria-label="Día siguiente"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <AnimatePresence>
            {showCal && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-1/2 top-full z-50 mt-2 w-72 -translate-x-1/2"
              >
                <Calendar
                  value={data.dateStr}
                  closedWeekdays={[]}
                  onChange={(d) => {
                    setShowCal(false);
                    goDate(d);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Barra de acciones + leyenda */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button variant="secondary" size="sm" onClick={() => setBlocking(true)}>
            <Lock size={15} /> Bloquear horario
          </Button>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
            {STATUS_ORDER.map((s) => (
              <span key={s} className="inline-flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[s])} />
                {STATUS_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        {/* ───── DESKTOP: barra lateral de empleados + rejilla ───── */}
        <div className="hidden gap-3 lg:flex">
          {/* Barra lateral */}
          <aside className="flex max-h-[calc(100dvh-15rem)] w-60 shrink-0 flex-col rounded-2xl border border-border glass p-2">
            <div className="mb-1 flex items-center justify-between px-2 py-1">
              <span className="text-xs font-medium uppercase tracking-wider text-muted">
                {v.professionalPlural}
              </span>
              <div className="flex gap-1 text-xs">
                <button
                  onClick={() => setSelected(new Set(data.professionals.map((p) => p.id)))}
                  className="text-accent hover:underline"
                >
                  Todos
                </button>
                <span className="text-muted">·</span>
                <button
                  onClick={() => setSelected(new Set())}
                  className="text-muted hover:text-fg"
                >
                  Ninguno
                </button>
              </div>
            </div>
            <div className="flex-1 space-y-1 overflow-y-auto">
              {data.professionals.map((p) => {
                const sel = selected.has(p.id);
                const count = apptsByPro(p.id).filter((a) => a.status !== "cancelada").length;
                const busyNow =
                  nowMin !== null &&
                  apptsByPro(p.id).some(
                    (a) =>
                      a.status !== "cancelada" &&
                      a.startMin <= nowMin &&
                      a.endMin > nowMin
                  );
                return (
                  <div
                    key={p.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded-xl px-2 py-2 transition-colors",
                      sel ? "bg-accent-soft/50" : "hover:bg-surface-2"
                    )}
                    onClick={() => setSelected(new Set([p.id]))}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(p.id)) next.delete(p.id);
                          else next.add(p.id);
                          return next;
                        });
                      }}
                      className="shrink-0 text-accent"
                      aria-label="Alternar"
                    >
                      {sel ? <CheckSquare size={18} /> : <Square size={18} className="text-muted" />}
                    </button>
                    <Avatar name={p.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium leading-tight">
                        {p.name}
                      </p>
                      <p className="truncate text-[11px] leading-tight text-muted">
                        {p.specialty}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full",
                          busyNow ? "bg-amber-500" : "bg-emerald-500"
                        )}
                      />
                      <span className="mt-0.5 text-[10px] tabular text-muted">
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Rejilla */}
          <div className="min-w-0 flex-1 rounded-2xl border border-border glass p-3">
            {shownPros.length === 0 ? (
              <div className="grid h-[calc(100dvh-17rem)] place-items-center text-sm text-muted">
                Selecciona uno o varios {v.professionalPlural.toLowerCase()} a la izquierda.
              </div>
            ) : (
              <div className="flex h-[calc(100dvh-17rem)] min-h-[420px]">
                <div className="flex w-12 shrink-0 flex-col">
                  <div className="mb-1 h-11 shrink-0" />
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
                {/* Columnas anchas y legibles. Si caben, llenan el ancho
                    (flex-1); si son muchas, mantienen ancho mínimo y aparece
                    scroll horizontal suave — nunca se aprietan. */}
                <div className="flex flex-1 overflow-x-auto">
                  <AnimatePresence initial={false}>
                    {shownPros.map((p) => (
                      <motion.div
                        key={p.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex min-w-[180px] flex-1 flex-col border-l border-border px-1.5"
                      >
                        <div className="mb-1 flex h-11 shrink-0 items-center gap-2">
                          <Avatar name={p.name} size={26} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium leading-tight">
                              {p.name}
                            </p>
                            <p className="truncate text-[11px] leading-tight text-muted">
                              {p.specialty}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1">
                          <ProColumn proId={p.id} compact />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
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
                  "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  mobilePro === p.id
                    ? "border-accent/50 bg-accent-soft/60 text-accent"
                    : "border-border text-muted"
                )}
              >
                <Avatar name={p.name} size={22} />
                {p.name.split(" ")[0]}
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

        {/* Toast elegante */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed inset-x-0 bottom-6 z-50 mx-auto flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm shadow-layered"
            >
              <AlertCircle size={16} className="text-amber-500" /> {toast}
            </motion.div>
          )}
        </AnimatePresence>

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

/* ───────── Bloque de cita premium ───────── */
function ApptBlock({
  appt,
  index,
  compact,
  nowMin,
  dragging,
  onDragStart,
  onDragEnd,
  onClick,
}: {
  appt: AgAppt;
  index: number;
  compact: boolean;
  nowMin: number | null;
  dragging: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onClick: () => void;
}) {
  const isLive = appt.status === "en_proceso";
  const progress =
    isLive && nowMin !== null
      ? Math.min(
          100,
          Math.max(
            0,
            ((nowMin - appt.startMin) / (appt.endMin - appt.startMin)) * 100
          )
        )
      : null;

  return (
    <motion.button
      layout
      draggable
      onDragStart={onDragStart as unknown as (e: unknown) => void}
      onDragEnd={onDragEnd}
      onClick={onClick}
      title={`${appt.clientName} · ${appt.serviceName} · ${fmtMin(appt.startMin)}`}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: dragging ? 0.4 : 1, scale: 1 }}
      transition={{
        delay: Math.min(index * 0.03, 0.3),
        type: "spring",
        stiffness: 320,
        damping: 26,
      }}
      whileHover={{ scale: 1.02, zIndex: 40 }}
      className={cn(
        "group absolute inset-x-1 z-20 cursor-grab overflow-hidden rounded-lg shadow-sm active:cursor-grabbing",
        compact ? "px-1.5 py-0.5" : "px-2 py-1",
        STATUS_BLOCK[appt.status],
        isLive && "shadow-glow ring-1 ring-accent/40",
        dragging && "shadow-layered"
      )}
      style={{
        top: `calc(${topPct(appt.startMin)}% + 1px)`,
        height: `calc(${hPct(appt.endMin - appt.startMin)}% - 2px)`,
        minHeight: 22,
      }}
    >
      {isLive && (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-lg ring-2 ring-accent/50"
          animate={{ opacity: [0.25, 0.7, 0.25] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
      <div className="relative flex items-center gap-1.5">
        <Avatar name={appt.clientName} size={compact ? 16 : 20} />
        <span className="truncate text-[11px] font-semibold leading-tight">
          {appt.clientName}
        </span>
      </div>
      <p className="relative truncate text-[10px] leading-tight text-muted">
        {fmtMin(appt.startMin)} · {appt.serviceName}
      </p>
      {progress !== null && (
        <span
          className="absolute bottom-0 left-0 h-[3px] rounded-r bg-accent"
          style={{ width: `${progress}%` }}
        />
      )}
    </motion.button>
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
