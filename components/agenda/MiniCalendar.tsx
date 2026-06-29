"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { rdParts } from "@/lib/rd";

const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const DOW = ["L", "M", "M", "J", "V", "S", "D"];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Date picker mensual: días visibles, hoy resaltado, puntito en días con citas. */
export function MiniCalendar({
  value,
  onPick,
  apptDates,
}: {
  value: string;
  onPick: (dateStr: string) => void;
  apptDates: Set<string>;
}) {
  const today = rdParts(new Date());
  const todayStr = `${today.y}-${pad(today.m + 1)}-${pad(today.day)}`;
  const [vy, vm] = value.split("-").map(Number);
  const [view, setView] = useState({ y: vy, m: vm - 1 });

  // Lunes como primer día de la semana (RD).
  const firstDow = (new Date(Date.UTC(view.y, view.m, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dayStr(d: number) {
    return `${view.y}-${pad(view.m + 1)}-${pad(d)}`;
  }

  return (
    <div className="w-72 rounded-2xl border border-border bg-surface p-3 shadow-pop">
      <div className="mb-2 flex items-center justify-between">
        <button
          onClick={() => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }))}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label="Mes anterior"
        >
          <ChevronLeft size={16} />
        </button>
        <p className="font-display text-sm font-semibold capitalize">
          {MONTHS[view.m]} {view.y}
        </p>
        <button
          onClick={() => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }))}
          className="grid h-8 w-8 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-accent"
          aria-label="Mes siguiente"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-medium uppercase text-muted">
        {DOW.map((d, i) => (
          <span key={i} className="py-1">{d}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((d, i) => {
          if (d === null) return <span key={i} />;
          const s = dayStr(d);
          const isToday = s === todayStr;
          const isSel = s === value;
          const hasAppts = apptDates.has(s);
          return (
            <button
              key={i}
              onClick={() => onPick(s)}
              className={cn(
                "relative grid aspect-square place-items-center rounded-lg text-[13px] tabular transition-colors",
                isSel
                  ? "bg-accent font-semibold text-accent-contrast shadow-glow"
                  : isToday
                    ? "bg-accent/15 font-semibold text-accent"
                    : "text-fg hover:bg-surface-2"
              )}
            >
              {d}
              {hasAppts && !isSel && (
                <span
                  className={cn(
                    "absolute bottom-1 h-1 w-1 rounded-full",
                    isToday ? "bg-accent" : "bg-accent/60"
                  )}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
