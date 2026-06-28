"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Calendar } from "./Calendar";
import { cn } from "@/lib/cn";
import { formatTimeRD } from "@/lib/format";
import { rdTodayDateStr } from "@/lib/rd";
import { slotsAction } from "@/app/reservar/[slug]/actions";
import type { Slot } from "@/lib/booking";

function addDaysStr(dateStr: string, days: number) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}-${String(dt.getUTCDate()).padStart(2, "0")}`;
}

export function DateTimeStep({
  slug,
  locationId,
  professionalId,
  serviceId,
  closedWeekdays,
  selectedDate,
  selectedSlotIso,
  onPick,
}: {
  slug: string;
  locationId: string;
  professionalId: string | null;
  serviceId: string;
  closedWeekdays: number[];
  selectedDate: string | null;
  selectedSlotIso: string | null;
  onPick: (dateStr: string, slot: Slot) => void;
}) {
  const [dateStr, setDateStr] = useState<string | null>(selectedDate);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!dateStr) return;
    let active = true;
    setLoading(true);
    setSlots([]);
    slotsAction({ slug, locationId, professionalId, serviceId, dateStr })
      .then((s) => {
        if (active) setSlots(s);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [dateStr, slug, locationId, professionalId, serviceId]);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
      <Calendar
        value={dateStr}
        onChange={setDateStr}
        closedWeekdays={closedWeekdays}
        minDateStr={rdTodayDateStr()}
        maxDateStr={addDaysStr(rdTodayDateStr(), 90)}
      />

      <div>
        <p className="mb-3 text-sm font-medium text-muted">
          {dateStr ? "Horarios disponibles" : "Elige un día"}
        </p>
        {!dateStr ? (
          <p className="text-sm text-muted">
            Selecciona una fecha en el calendario.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-muted">
            <Loader2 size={16} className="animate-spin" /> Buscando horarios…
          </div>
        ) : slots.length === 0 ? (
          <p className="text-sm text-muted">
            No hay horarios libres ese día. Prueba otra fecha.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-3">
            {slots.map((s) => {
              const sel = selectedSlotIso === s.iso && selectedDate === dateStr;
              return (
                <button
                  key={s.iso}
                  type="button"
                  onClick={() => onPick(dateStr, s)}
                  className={cn(
                    "tabular rounded-xl border px-2 py-2.5 text-sm transition-colors",
                    sel
                      ? "border-accent bg-accent text-accent-contrast shadow-glow"
                      : "border-border hover:border-accent/50 hover:text-accent"
                  )}
                >
                  {formatTimeRD(s.iso)}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
