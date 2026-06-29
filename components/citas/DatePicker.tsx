"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { BusinessType } from "@/lib/skins";
import { cn } from "@/lib/cn";
import {
  MONTHS,
  WEEKDAYS_MINI,
  Professional,
  addDays,
  dayHasAppointments,
  fromISODate,
  mondayIndex,
  toISODate,
} from "./data";

/**
 * Mini-calendario premium (date picker). Arregla el Bug A: muestra la rejilla
 * COMPLETA de días del mes, con hoy resaltado, puntito en días con citas, y al
 * elegir un día salta y se cierra.
 */
export function DatePicker({
  value,
  todayISO,
  skin,
  professionals,
  onSelect,
  onClose,
}: {
  value: string;
  todayISO: string;
  skin: BusinessType;
  professionals: Professional[];
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Mes visible: arranca en el mes del día seleccionado.
  const sel = fromISODate(value);
  const [view, setView] = useState({ y: sel.getFullYear(), m: sel.getMonth() });

  // Cierre por clic fuera + Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const first = new Date(view.y, view.m, 1);
  const lead = mondayIndex(first); // celdas vacías antes del día 1
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  // Construimos exactamente las celdas necesarias (lead + días).
  const cells: (number | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function shiftMonth(delta: number) {
    setView((v) => {
      const nm = v.m + delta;
      const y = v.y + Math.floor(nm / 12);
      const m = ((nm % 12) + 12) % 12;
      return { y, m };
    });
  }

  function isoFor(day: number): string {
    return toISODate(new Date(view.y, view.m, day));
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.98 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="absolute left-0 top-[calc(100%+8px)] z-40 w-[268px] rounded-2xl border border-border glass p-3 shadow-layered"
      role="dialog"
      aria-label="Seleccionar fecha"
    >
      {/* hairline metálico superior */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-2xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
        }}
      />

      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => shiftMonth(-1)}
          aria-label="Mes anterior"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-accent"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-sm font-semibold tracking-tight">
          {MONTHS[view.m]} {view.y}
        </p>
        <button
          type="button"
          onClick={() => shiftMonth(1)}
          aria-label="Mes siguiente"
          className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-accent"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-0.5">
        {WEEKDAYS_MINI.map((w, i) => (
          <div
            key={i}
            className="grid h-6 place-items-center text-[10px] font-medium uppercase tracking-wide text-muted"
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (day === null) return <div key={`b${i}`} className="h-8" />;
          const iso = isoFor(day);
          const isToday = iso === todayISO;
          const isSelected = iso === value;
          const hasAppts = dayHasAppointments(skin, professionals, iso);
          return (
            <button
              key={iso}
              type="button"
              onClick={() => {
                onSelect(iso);
                onClose();
              }}
              className={cn(
                "relative grid h-8 place-items-center rounded-lg text-[13px] tabular transition-colors",
                isSelected
                  ? "bg-accent font-semibold text-accent-contrast shadow-glow"
                  : isToday
                  ? "font-semibold text-accent ring-1 ring-inset ring-accent/50 hover:bg-surface-2"
                  : "text-fg/85 hover:bg-surface-2 hover:text-accent"
              )}
              aria-label={iso}
              aria-current={isToday ? "date" : undefined}
            >
              {day}
              {hasAppts && !isSelected && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    isToday ? "bg-accent" : "bg-metallic/80"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
        <button
          type="button"
          onClick={() => {
            onSelect(todayISO);
            onClose();
          }}
          className="rounded-lg px-2 py-1 text-xs font-medium text-accent transition-colors hover:bg-surface-2"
        >
          Hoy
        </button>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              const prev = addDays(value, -1);
              onSelect(prev);
              const d = fromISODate(prev);
              setView({ y: d.getFullYear(), m: d.getMonth() });
            }}
            className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            Día −
          </button>
          <button
            type="button"
            onClick={() => {
              const next = addDays(value, 1);
              onSelect(next);
              const d = fromISODate(next);
              setView({ y: d.getFullYear(), m: d.getMonth() });
            }}
            className="rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:bg-surface-2 hover:text-fg"
          >
            Día +
          </button>
        </div>
      </div>
    </motion.div>
  );
}
