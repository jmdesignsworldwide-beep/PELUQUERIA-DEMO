"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { rdParts } from "@/lib/rd";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DOW = ["D", "L", "M", "M", "J", "V", "S"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function Calendar({
  value,
  onChange,
  closedWeekdays,
  minDateStr,
  maxDateStr,
}: {
  value: string | null;
  onChange: (dateStr: string) => void;
  closedWeekdays: number[];
  /** Día mínimo seleccionable. Omitir = sin mínimo (permite pasado). */
  minDateStr?: string;
  /** Día máximo seleccionable. Omitir = sin máximo. */
  maxDateStr?: string;
}) {
  const today = rdParts(new Date());
  const initStr = value || `${today.y}-${pad(today.m + 1)}-${pad(today.day)}`;
  const initParts = initStr.split("-").map(Number);
  const [view, setView] = useState({ y: initParts[0], m: initParts[1] - 1 });

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const startDow = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();

  const monthStartStr = `${view.y}-${pad(view.m + 1)}-01`;
  const monthEndStr = `${view.y}-${pad(view.m + 1)}-${pad(daysInMonth)}`;
  const prevDisabled = !!minDateStr && monthStartStr <= minDateStr;
  const nextDisabled = !!maxDateStr && monthEndStr >= maxDateStr;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dayStr(d: number) {
    return `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
  }
  function weekdayOf(d: number) {
    return new Date(Date.UTC(view.y, view.m, d)).getUTCDay();
  }
  function disabled(d: number) {
    const s = dayStr(d);
    if (minDateStr && s < minDateStr) return true;
    if (maxDateStr && s > maxDateStr) return true;
    if (closedWeekdays.includes(weekdayOf(d))) return true;
    return false;
  }

  return (
    <div className="rounded-2xl border border-border glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
          disabled={prevDisabled}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors enabled:hover:bg-surface-2 enabled:hover:text-accent disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-display text-base font-semibold capitalize">
          {MONTHS[view.m]} {view.y}
        </p>
        <button
          type="button"
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
          disabled={nextDisabled}
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors enabled:hover:bg-surface-2 enabled:hover:text-accent disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-muted">
        {DOW.map((d, i) => (
          <span key={i} className="py-1">{d}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const s = dayStr(d);
          const dis = disabled(d);
          const sel = value === s;
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => onChange(s)}
              className={cn(
                "aspect-square rounded-lg text-sm tabular transition-colors",
                sel
                  ? "bg-accent font-semibold text-accent-contrast shadow-glow"
                  : dis
                    ? "text-muted/30"
                    : "text-fg hover:bg-surface-2"
              )}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}
