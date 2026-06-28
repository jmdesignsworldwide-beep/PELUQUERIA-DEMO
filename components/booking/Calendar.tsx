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
}: {
  value: string | null;
  onChange: (dateStr: string) => void;
  closedWeekdays: number[];
}) {
  const today = rdParts(new Date());
  const [view, setView] = useState({ y: today.y, m: today.m });

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const startDow = first.getUTCDay();
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();

  const todayStr = `${today.y}-${pad(today.m + 1)}-${pad(today.day)}`;
  const isPastMonth = view.y < today.y || (view.y === today.y && view.m <= today.m);

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
    if (s < todayStr) return true;
    if (closedWeekdays.includes(weekdayOf(d))) return true;
    return false;
  }

  return (
    <div className="rounded-2xl border border-border glass p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
          disabled={isPastMonth}
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
          className="grid h-9 w-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-accent"
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
