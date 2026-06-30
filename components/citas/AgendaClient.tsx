"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Clock,
  Plus,
  UserPlus,
  Wallet,
  BadgeCheck,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CobroPanel, CobroDraft } from "@/components/cobro/CobroPanel";
import { servicePrice } from "@/lib/money/prices";
import { formatRD } from "@/lib/money/calc";
import { DatePicker } from "./DatePicker";
import {
  Appointment,
  COL_MIN_WIDTH,
  GRID_END_MIN,
  GRID_START_MIN,
  HOUR_HEIGHT,
  PX_PER_MIN,
  Professional,
  SLOT_MIN,
  START_HOUR,
  END_HOUR,
  STATUSES,
  STATUS_ORDER,
  StatusKey,
  addDays,
  appointmentsFor,
  countFor,
  formatLongDate,
  hasConflict,
  hourLabel,
  initials,
  minutesToLabel,
  professionalsFor,
  statusColor,
  toISODate,
} from "./data";

const HEADER_H = 60; // alto del encabezado de columnas
const GUTTER_W = 66; // ancho de la columna de horas

type Override = Partial<Pick<Appointment, "professionalId" | "start" | "status">>;

type DragState = {
  apptId: string;
  duration: number;
  grabOffsetY: number;
  originX: number;
  originY: number;
  targetIndex: number;
  start: number;
  valid: boolean;
  moved: boolean;
};

const DRAG_THRESHOLD = 4; // px antes de considerar que es un arrastre (no un clic)

function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/* ────────────────────────────── Avatar ────────────────────────────── */

function Avatar({
  name,
  hue,
  size = 28,
}: {
  name: string;
  hue: number;
  size?: number;
}) {
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

/* ───────────────────────────── Status badge ───────────────────────── */

function StatusBadge({ status }: { status: StatusKey }) {
  const def = STATUSES[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: statusColor(status, 1),
        background: statusColor(status, 0.12),
        boxShadow: `inset 0 0 0 1px ${statusColor(status, 0.32)}`,
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: statusColor(status, 1) }}
      />
      {def.label}
    </span>
  );
}

/* ─────────────────────────── Appointment block ────────────────────── */

function Block({
  appt,
  top,
  height,
  index,
  selected,
  dragging,
  invalidDrag,
  shaking,
  overlay,
  paid,
  left,
  width,
  onPointerDown,
}: {
  appt: Appointment;
  top: number;
  height: number;
  index: number;
  selected: boolean;
  dragging?: boolean;
  invalidDrag?: boolean;
  shaking?: boolean;
  overlay?: boolean;
  paid?: boolean;
  left?: number;
  width?: number;
  onPointerDown?: (e: React.PointerEvent, appt: Appointment, top: number) => void;
}) {
  const showSecond = height >= 40;
  const showAvatar = height >= 54;
  const end = appt.start + appt.duration;

  const borderColor = invalidDrag
    ? statusColor("cancelada", 0.9)
    : selected || dragging
    ? "rgb(var(--accent))"
    : statusColor(appt.status, 0.4);

  const boxShadow = invalidDrag
    ? `0 0 0 1.5px ${statusColor("cancelada", 0.9)}, 0 10px 24px -8px ${statusColor(
        "cancelada",
        0.5
      )}`
    : selected
    ? "0 0 0 1.5px rgb(var(--accent)), 0 10px 26px -8px rgb(var(--accent) / 0.5)"
    : dragging
    ? "0 0 0 1.5px rgb(var(--accent)), 0 18px 36px -10px rgb(var(--shadow-rgb) / 0.5)"
    : "0 0 14px -3px rgb(var(--accent) / 0.30), 0 1px 2px rgb(var(--shadow-rgb) / 0.10)";

  return (
    <motion.div
      role="button"
      tabIndex={0}
      aria-label={`${appt.client}, ${appt.service}, ${minutesToLabel(
        appt.start
      )}, ${STATUSES[appt.status].label}`}
      initial={overlay ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        overlay
          ? { duration: 0 }
          : { delay: Math.min(index * 0.04, 0.4), type: "spring", stiffness: 320, damping: 28 }
      }
      onPointerDown={(e) => onPointerDown?.(e, appt, top)}
      style={{
        top,
        height: Math.max(height, 22),
        left: overlay ? left : 4,
        right: overlay ? undefined : 4,
        width: overlay ? width : undefined,
        borderColor,
        boxShadow,
        background: "rgb(var(--surface))",
        zIndex: overlay ? 50 : selected ? 40 : 10,
        transform: selected && !overlay ? "translateY(-1px)" : undefined,
        cursor: "grab",
        touchAction: "none",
      }}
      className={cn(
        "group absolute overflow-hidden rounded-lg border select-none",
        !overlay &&
          "transition-[box-shadow,border-color,transform] duration-150 hover:z-20 hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgb(var(--shadow-rgb)/0.22)]",
        shaking && "animate-shake-x",
        appt.status === "cancelada" && "opacity-[0.82]"
      )}
    >
      {/* tinte de estado (muy suave) */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{ background: statusColor(appt.status, 0.12) }}
      />
      {/* barra de color de estado a la izquierda */}
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-1 rounded-l-lg"
        style={{ background: statusColor(appt.status, selected ? 1 : 0.9) }}
      />
      {/* indicador de cobrado */}
      {paid && (
        <span
          className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full"
          style={{
            background: statusColor("completada", 1),
            color: "rgb(var(--surface))",
          }}
          aria-label="Cobrada"
        >
          <BadgeCheck size={11} strokeWidth={3} />
        </span>
      )}

      <div className="relative h-full px-2 py-1.5 pl-2.5">
        <div className="flex items-center gap-1.5">
          {showAvatar && (
            <span
              className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[9px] font-semibold text-fg/80"
              style={{
                background: statusColor(appt.status, 0.22),
                boxShadow: `inset 0 0 0 1px ${statusColor(appt.status, 0.4)}`,
              }}
            >
              {initials(appt.client)}
            </span>
          )}
          <span className="truncate text-[13px] font-semibold leading-tight tracking-tight text-fg">
            {appt.client}
          </span>
        </div>
        {showSecond && (
          <p className="mt-0.5 truncate text-[11px] leading-tight text-muted">
            {appt.service} · {minutesToLabel(appt.start)}
            {height >= 76 && <> – {minutesToLabel(end)}</>}
          </p>
        )}
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────── Main ────────────────────────────── */

export function AgendaClient() {
  const { businessType: skin, skin: skinObj } = useApp();
  const { payments } = useMoney();
  const vocab = skinObj.vocab;
  const professionals = useMemo(() => professionalsFor(skin), [skin]);

  // Citas ya cobradas (leído de la fuente única del dinero).
  const paidApptIds = useMemo(
    () =>
      new Set(
        payments
          .filter((p) => p.status === "pagado" && p.appointmentId)
          .map((p) => p.appointmentId as string)
      ),
    [payments]
  );
  const [cobroDraft, setCobroDraft] = useState<CobroDraft | null>(null);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [todayISO, setTodayISO] = useState("2026-06-29");
  const [date, setDate] = useState("2026-06-29");
  const [now, setNow] = useState(nowMinutes());

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mobilePro, setMobilePro] = useState<string>("");
  const [pickerOpen, setPickerOpen] = useState(false);

  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const [overrides, setOverrides] = useState<Record<string, Override>>({});
  const [extras, setExtras] = useState<Appointment[]>([]);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [shakeId, setShakeId] = useState<string | null>(null);

  const columnsAreaRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pxPerMinRef = useRef(PX_PER_MIN);
  const [viewportH, setViewportH] = useState(0);

  /* Mide el alto disponible del scroll para estirar las horas a pantalla. */
  useEffect(() => {
    if (!mounted) return;
    const el = scrollRef.current;
    if (!el) return;
    const measure = () => setViewportH(el.clientHeight);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    measure();
    return () => ro.disconnect();
  }, [mounted]);

  /* Montaje: fija hoy/fecha reales y selección por defecto. */
  useEffect(() => {
    const t = toISODate(new Date());
    setTodayISO(t);
    setDate(t);
    setNow(nowMinutes());
    setSelectedIds(professionals.slice(0, 5).map((p) => p.id));
    setMobilePro(professionals[0]?.id ?? "");
    setMounted(true);
  }, [professionals]);

  /* Si cambia la piel, re-sincroniza selección a la nueva lista. */
  useEffect(() => {
    if (!mounted) return;
    setSelectedIds(professionals.slice(0, 5).map((p) => p.id));
    setMobilePro(professionals[0]?.id ?? "");
    setExtras([]);
    setOverrides({});
    setSelectedApptId(null);
  }, [skin]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Breakpoint. */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* Tic de la línea de "ahora" cada minuto. */
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const visiblePros: Professional[] = useMemo(() => {
    if (isMobile) {
      const p = professionals.find((x) => x.id === mobilePro);
      return p ? [p] : professionals.slice(0, 1);
    }
    return professionals.filter((p) => selectedIds.includes(p.id));
  }, [isMobile, professionals, selectedIds, mobilePro]);

  /* Citas del día (generadas + extras), con overrides aplicados, agrupadas. */
  const applyOverride = useCallback(
    (a: Appointment): Appointment => {
      const o = overrides[a.id];
      return o ? { ...a, ...o } : a;
    },
    [overrides]
  );

  const dayAppointments: Appointment[] = useMemo(() => {
    const base = professionals.flatMap((p) => appointmentsFor(skin, p.id, date));
    const all = [...base, ...extras.filter((e) => e.date === date)];
    return all.map(applyOverride);
  }, [skin, date, professionals, extras, applyOverride]);

  const byPro = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    for (const p of professionals) map[p.id] = [];
    for (const a of dayAppointments) {
      (map[a.professionalId] ??= []).push(a);
    }
    return map;
  }, [dayAppointments, professionals]);

  const detailAppt = useMemo(
    () => dayAppointments.find((a) => a.id === detailId) ?? null,
    [dayAppointments, detailId]
  );
  const detailPro = professionals.find((p) => p.id === detailAppt?.professionalId);

  /* ───────────── Drag (reprogramar arrastrando) ───────────── */

  const startDrag = useCallback(
    (e: React.PointerEvent, appt: Appointment, top: number) => {
      if (e.button !== 0) return;
      const area = columnsAreaRef.current;
      if (!area) return;
      const rect = area.getBoundingClientRect();
      const grabOffsetY = e.clientY - rect.top - top;
      const startIndex = Math.max(
        0,
        visiblePros.findIndex((p) => p.id === appt.professionalId)
      );
      setDrag({
        apptId: appt.id,
        duration: appt.duration,
        grabOffsetY,
        originX: e.clientX,
        originY: e.clientY,
        targetIndex: startIndex,
        start: appt.start,
        valid: true,
        moved: false,
      });
    },
    [visiblePros]
  );

  useEffect(() => {
    if (!drag) return;
    const area = columnsAreaRef.current;
    if (!area) return;

    const onMove = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - drag.originX, e.clientY - drag.originY);
      if (!drag.moved && dist < DRAG_THRESHOLD) return;
      const rect = area.getBoundingClientRect();
      const colW = rect.width / Math.max(visiblePros.length, 1);
      const idx = Math.min(
        visiblePros.length - 1,
        Math.max(0, Math.floor((e.clientX - rect.left) / colW))
      );
      const rawTop = e.clientY - rect.top - drag.grabOffsetY;
      let start =
        Math.round((rawTop / pxPerMinRef.current + GRID_START_MIN) / SLOT_MIN) *
        SLOT_MIN;
      start = Math.max(
        GRID_START_MIN,
        Math.min(start, GRID_END_MIN - drag.duration)
      );
      const targetPro = visiblePros[idx];
      const others = (byPro[targetPro.id] ?? []).filter(
        (a) => a.id !== drag.apptId
      );
      const valid = !hasConflict(
        { id: drag.apptId, start, duration: drag.duration },
        others
      );
      setDrag((d) =>
        d
          ? { ...d, targetIndex: idx, start, valid, moved: true }
          : d
      );
    };

    const onUp = () => {
      setDrag((d) => {
        if (!d) return null;
        if (!d.moved) {
          // Fue un clic: seleccionar (RESALTA) y abrir detalle.
          setSelectedApptId(d.apptId);
          setDetailId(d.apptId);
        } else if (d.valid) {
          const targetPro = visiblePros[d.targetIndex];
          setOverrides((prev) => ({
            ...prev,
            [d.apptId]: {
              ...prev[d.apptId],
              start: d.start,
              professionalId: targetPro.id,
            },
          }));
          setSelectedApptId(d.apptId);
        } else {
          setShakeId(d.apptId);
          window.setTimeout(() => setShakeId(null), 450);
        }
        return null;
      });
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, visiblePros, byPro]);

  /* ───────────── Acciones ───────────── */

  function togglePro(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function setStatus(apptId: string, status: StatusKey) {
    setOverrides((prev) => ({ ...prev, [apptId]: { ...prev[apptId], status } }));
  }

  function openCobro(appt: Appointment) {
    const pro = professionals.find((p) => p.id === appt.professionalId);
    setDetailId(null); // cerramos el detalle para no apilar modales
    setCobroDraft({
      source: "cita",
      appointmentId: appt.id,
      clientName: appt.client,
      service: appt.service,
      professionalId: appt.professionalId,
      professionalName: pro?.name ?? appt.professionalId,
      serviceAmount: servicePrice(skin, appt.service),
    });
  }

  // walkIn=true → cliente "Sin cita" (llegó sin reservar). false → cita nueva.
  function addAppointment(walkIn: boolean) {
    const pro = visiblePros[0];
    if (!pro) return;
    const dur = walkIn ? 30 : 60;
    const others = byPro[pro.id] ?? [];
    // Primer hueco (desde ahora si es hoy, si no desde el inicio) que quepa.
    let start =
      date === todayISO
        ? Math.max(GRID_START_MIN, Math.ceil(now / SLOT_MIN) * SLOT_MIN)
        : GRID_START_MIN;
    while (
      start + dur <= GRID_END_MIN &&
      hasConflict({ id: "_", start, duration: dur }, others)
    ) {
      start += SLOT_MIN;
    }
    if (start + dur > GRID_END_MIN) start = GRID_START_MIN;
    const appt: Appointment = {
      id: `${walkIn ? "sincita" : "cita"}-${date}-${pro.id}-${start}`,
      professionalId: pro.id,
      date,
      start,
      duration: dur,
      client: walkIn ? "Sin cita" : "Cita nueva",
      service: skin === "salon" ? "Corte y peinado" : "Corte clásico",
      status: walkIn ? "en_proceso" : "pendiente",
    };
    setExtras((prev) => [...prev.filter((e) => e.id !== appt.id), appt]);
    setSelectedApptId(appt.id);
  }

  /* ───────────── Render ───────────── */

  const hours: number[] = [];
  for (let h = START_HOUR; h <= END_HOUR; h++) hours.push(h);

  // Alto de hora dinámico: estira 8am–8pm para llenar la pantalla; si no cabe,
  // baja a un mínimo legible y aparece scroll vertical suave.
  const NUM_HOURS = END_HOUR - START_HOUR;
  const MIN_HOUR_H = 52;
  const hourHeight =
    viewportH > 0
      ? Math.max(MIN_HOUR_H, Math.round((viewportH - HEADER_H) / NUM_HOURS))
      : HOUR_HEIGHT;
  const pxPerMin = hourHeight / 60;
  const gridHeight = hourHeight * NUM_HOURS;
  pxPerMinRef.current = pxPerMin;

  const columnBg = `
    repeating-linear-gradient(to bottom, rgb(var(--border) / 0.55) 0px, rgb(var(--border) / 0.55) 1px, transparent 1px, transparent ${hourHeight}px),
    repeating-linear-gradient(to bottom, transparent 0px, transparent ${hourHeight / 2}px, rgb(var(--border) / 0.22) ${hourHeight / 2}px, rgb(var(--border) / 0.22) ${hourHeight / 2 + 1}px, transparent ${hourHeight / 2 + 1}px, transparent ${hourHeight}px)
  `;

  const showNow =
    mounted && date === todayISO && now >= GRID_START_MIN && now <= GRID_END_MIN;
  const nowTop = (now - GRID_START_MIN) * pxPerMin;

  if (!mounted) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <div className="h-10 w-64 shrink-0 animate-pulse rounded-xl bg-surface-2" />
        <div className="min-h-0 flex-1 animate-pulse rounded-2xl bg-surface-2/60" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {/* ───────── Encabezado / título ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <CalendarDays size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Agenda
            </h1>
            <p className="text-xs text-muted">
              {visiblePros.length}{" "}
              {visiblePros.length === 1
                ? vocab.professional.toLowerCase()
                : vocab.professionalPlural.toLowerCase()}{" "}
              · vista de día
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addAppointment(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border glass px-3 text-sm text-fg transition-colors hover:border-accent/50 hover:text-accent"
          >
            <UserPlus size={15} />
            <span className="hidden sm:inline">Sin cita</span>
          </button>
          <button
            type="button"
            onClick={() => addAppointment(false)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-accent px-3.5 text-sm font-medium text-accent-contrast shadow-glow transition-[filter] hover:brightness-[1.06]"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Cita</span>
          </button>
        </div>
      </div>

      {/* ───────── Toolbar de fecha ───────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, -1))}
            aria-label="Día anterior"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border glass text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            <ChevronLeft size={17} />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-border glass px-3 text-sm font-medium text-fg transition-colors hover:border-accent/50"
            >
              <span>{formatLongDate(date)}</span>
              <ChevronDown
                size={15}
                className={cn(
                  "text-muted transition-transform",
                  pickerOpen && "rotate-180"
                )}
              />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <DatePicker
                  value={date}
                  todayISO={todayISO}
                  skin={skin}
                  professionals={professionals}
                  onSelect={setDate}
                  onClose={() => setPickerOpen(false)}
                />
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={() => setDate((d) => addDays(d, 1))}
            aria-label="Día siguiente"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border glass text-muted transition-colors hover:border-accent/50 hover:text-accent"
          >
            <ChevronRight size={17} />
          </button>

          {date !== todayISO && (
            <button
              type="button"
              onClick={() => setDate(todayISO)}
              className="ml-1 h-9 rounded-xl border border-border glass px-3 text-sm text-accent transition-colors hover:bg-surface-2"
            >
              Hoy
            </button>
          )}
        </div>

        {/* Leyenda de estados */}
        <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 md:flex">
          {STATUS_ORDER.map((s) => (
            <span key={s} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: statusColor(s, 1) }}
              />
              {STATUSES[s].label}
            </span>
          ))}
        </div>
      </div>

      {/* ───────── Selector de profesional (móvil) ───────── */}
      {isMobile && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {professionals.map((p) => {
            const active = p.id === mobilePro;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setMobilePro(p.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                  active
                    ? "border-accent/60 bg-accent-soft/60 text-accent"
                    : "border-border glass text-muted"
                )}
              >
                <Avatar name={p.name} hue={p.hue} size={20} />
                {p.name}
              </button>
            );
          })}
        </div>
      )}

      {/* ───────── Cuerpo: sidebar + calendario ───────── */}
      <div className="flex min-h-0 flex-1 gap-4">
        {/* Sidebar de profesionales (escritorio) */}
        {!isMobile && (
          <aside className="hidden w-56 shrink-0 lg:flex">
            <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-border glass">
              <p className="shrink-0 border-b border-border px-3.5 py-2.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
                {vocab.professionalPlural}
              </p>
              <div className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
                {professionals.map((p) => {
                  const active = selectedIds.includes(p.id);
                  const count = countFor(skin, p.id, date);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePro(p.id)}
                      className={cn(
                        "group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition-colors",
                        active ? "bg-surface-2/70" : "hover:bg-surface-2/50"
                      )}
                    >
                      <Avatar name={p.name} hue={p.hue} size={32} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            active ? "text-fg" : "text-fg/80"
                          )}
                        >
                          {p.name}
                        </p>
                        <p className="truncate text-[11px] text-muted">
                          {p.specialty} · {count} cit{count === 1 ? "a" : "as"}
                        </p>
                      </div>
                      <span
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                          active
                            ? "border-accent bg-accent text-accent-contrast"
                            : "border-border text-transparent group-hover:border-accent/50"
                        )}
                      >
                        <Check size={13} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        )}

        {/* Calendario */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border glass">
          <div
            aria-hidden
            className="pointer-events-none h-px shrink-0"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
            }}
          />
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto">
            <div
              className="w-full"
              style={{ minWidth: GUTTER_W + visiblePros.length * COL_MIN_WIDTH }}
            >
              {/* Encabezado de columnas (sticky top) */}
              <div
                className="sticky top-0 z-30 flex border-b border-border glass-strong"
                style={{ height: HEADER_H }}
              >
                <div
                  className="sticky left-0 z-10 shrink-0 border-r border-border glass-strong"
                  style={{ width: GUTTER_W }}
                />
                {visiblePros.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-2 border-l border-border px-3"
                    style={{ flex: `1 0 ${COL_MIN_WIDTH}px` }}
                  >
                    <Avatar name={p.name} hue={p.hue} size={30} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold tracking-tight">
                        {p.name}
                      </p>
                      <p className="truncate text-[11px] text-muted">
                        {p.specialty}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Cuerpo de la rejilla */}
              <div className="flex" style={{ height: gridHeight }}>
                {/* Columna de horas (sticky left) */}
                <div
                  className="sticky left-0 z-20 shrink-0 border-r border-border glass"
                  style={{ width: GUTTER_W }}
                >
                  <div className="relative h-full">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute right-2 -translate-y-1/2 text-[13px] font-semibold tabular text-fg/80"
                        style={{ top: (h - START_HOUR) * hourHeight }}
                      >
                        {h === START_HOUR ? "" : hourLabel(h)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columnas de profesionales */}
                <div ref={columnsAreaRef} className="relative flex flex-1">
                  {visiblePros.map((p, idx) => {
                    const appts = (byPro[p.id] ?? []).filter(
                      (a) => a.id !== drag?.apptId || !drag?.moved
                    );
                    const isDropTarget = drag?.moved && drag.targetIndex === idx;
                    return (
                      <div
                        key={p.id}
                        className="relative border-l border-border"
                        style={{
                          flex: `1 0 ${COL_MIN_WIDTH}px`,
                          backgroundImage: columnBg,
                          backgroundColor: isDropTarget
                            ? "rgb(var(--accent) / 0.05)"
                            : undefined,
                        }}
                      >
                        {appts.map((a, i) => (
                          <Block
                            key={a.id}
                            appt={a}
                            top={(a.start - GRID_START_MIN) * pxPerMin}
                            height={a.duration * pxPerMin}
                            index={i}
                            selected={a.id === selectedApptId}
                            shaking={a.id === shakeId}
                            paid={paidApptIds.has(a.id)}
                            onPointerDown={startDrag}
                          />
                        ))}
                      </div>
                    );
                  })}

                  {/* Bloque fantasma durante el arrastre */}
                  {drag?.moved &&
                    (() => {
                      const a = dayAppointments.find((x) => x.id === drag.apptId);
                      if (!a) return null;
                      const area = columnsAreaRef.current;
                      const colW = area
                        ? area.getBoundingClientRect().width /
                          Math.max(visiblePros.length, 1)
                        : COL_MIN_WIDTH;
                      return (
                        <Block
                          appt={{ ...a, start: drag.start }}
                          top={(drag.start - GRID_START_MIN) * pxPerMin}
                          height={drag.duration * pxPerMin}
                          index={0}
                          selected={false}
                          dragging
                          invalidDrag={!drag.valid}
                          overlay
                          left={drag.targetIndex * colW + 4}
                          width={colW - 8}
                        />
                      );
                    })()}

                  {/* Línea de AHORA */}
                  {showNow && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-30"
                      style={{ top: nowTop }}
                    >
                      <div className="relative h-0.5 bg-accent">
                        <span className="absolute -left-1 -top-[3px] h-2 w-2 rounded-full bg-accent shadow-glow" />
                        <span className="absolute -left-1 -top-[3px] h-2 w-2 animate-now-pulse rounded-full bg-accent" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ───────── Detalle de cita ───────── */}
      <Modal
        open={!!detailAppt}
        onClose={() => setDetailId(null)}
        title="Detalle de la cita"
      >
        {detailAppt && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar
                name={detailAppt.client}
                hue={detailPro?.hue ?? 0}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate font-display text-lg font-semibold tracking-tight">
                  {detailAppt.client}
                </p>
                <p className="text-sm text-muted">{detailAppt.service}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                  <Clock size={12} /> Horario
                </p>
                <p className="text-sm font-medium tabular">
                  {minutesToLabel(detailAppt.start)} –{" "}
                  {minutesToLabel(detailAppt.start + detailAppt.duration)}
                </p>
                <p className="text-[11px] text-muted">
                  {detailAppt.duration} min
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="mb-1 text-[11px] uppercase tracking-wide text-muted">
                  {vocab.professional}
                </p>
                <p className="truncate text-sm font-medium">
                  {detailPro?.name ?? "—"}
                </p>
                <p className="truncate text-[11px] text-muted">
                  {detailPro?.specialty}
                </p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
                Estado
              </p>
              <div className="mb-3">
                <StatusBadge status={detailAppt.status} />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {STATUS_ORDER.map((s) => {
                  const active = s === detailAppt.status;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(detailAppt.id, s)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
                        active ? "text-accent-contrast" : "text-fg/70 hover:text-fg"
                      )}
                      style={{
                        background: active
                          ? statusColor(s, 1)
                          : statusColor(s, 0.1),
                        boxShadow: active
                          ? undefined
                          : `inset 0 0 0 1px ${statusColor(s, 0.28)}`,
                      }}
                    >
                      {STATUSES[s].label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cobro: aparece cuando la cita está completada */}
            {paidApptIds.has(detailAppt.id) ? (
              <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-sm">
                <BadgeCheck
                  size={18}
                  style={{ color: statusColor("completada", 1) }}
                />
                <span className="font-medium">Cita cobrada</span>
                {(() => {
                  const pago = payments.find(
                    (p) => p.appointmentId === detailAppt.id && p.status === "pagado"
                  );
                  return pago ? (
                    <span className="ml-auto tabular text-muted">
                      {formatRD(pago.total)}
                    </span>
                  ) : null;
                })()}
              </div>
            ) : detailAppt.status === "completada" ? (
              <Button fullWidth onClick={() => openCobro(detailAppt)}>
                <Wallet size={16} />
                Cobrar
              </Button>
            ) : (
              <p className="text-[11px] text-muted">
                Marca la cita como <span className="text-fg">Completada</span> para
                poder cobrarla.
              </p>
            )}

            <p className="text-[11px] text-muted">
              Consejo: arrastra el bloque en la rejilla para reprogramarlo a otra
              hora o {vocab.professional.toLowerCase()}.
            </p>
          </div>
        )}
      </Modal>

      {/* Panel de cobro (la cita "pagada" se deriva sola de la fuente única) */}
      <CobroPanel
        open={!!cobroDraft}
        draft={cobroDraft}
        onClose={() => setCobroDraft(null)}
      />
    </div>
  );
}
