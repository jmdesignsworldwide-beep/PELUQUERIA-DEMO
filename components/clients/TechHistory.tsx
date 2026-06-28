"use client";

import { motion } from "framer-motion";
import { Clock, Heart, Sparkles, Repeat } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Card } from "@/components/ui/Card";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { formatDateRD, formatRD } from "@/lib/format";
import { visitDetailFieldsFor, timelineTitle } from "@/lib/techSheet";
import type { VisitItem } from "@/lib/clients";

function weeksAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / (7 * 24 * 3600 * 1000));
}

function monthYear(iso: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

function detailChips(
  fields: { key: string; label: string }[],
  detail: Record<string, string>
) {
  return fields
    .filter((f) => detail[f.key])
    .map((f) => ({ label: f.label, value: detail[f.key] }));
}

export function TechHistory({
  history,
  createdAt,
}: {
  history: VisitItem[];
  createdAt: string;
}) {
  const { businessType } = useApp();
  const fields = visitDetailFieldsFor(businessType);

  // Señales útiles (de la visita más reciente).
  const last = history[0];
  const lastChips = last ? detailChips(fields, last.techDetail) : [];
  const w = last ? weeksAgo(last.startsAt) : null;
  const retoqueDue = w !== null && w >= 4;

  return (
    <div className="space-y-5">
      {/* ── Señales útiles ── */}
      <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* Lo que le gustó la última vez */}
        <RevealItem>
          <Card className="h-full p-4">
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <Heart size={13} /> Lo que le gustó
            </p>
            {last ? (
              <>
                <p className="font-medium">{last.serviceName}</p>
                {lastChips.length > 0 ? (
                  <p className="mt-1 text-xs text-muted">
                    {lastChips.map((c) => c.value).join(" · ")}
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-muted">
                    {formatDateRD(last.startsAt)}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted">Sin visitas aún</p>
            )}
          </Card>
        </RevealItem>

        {/* Alerta de retoque */}
        <RevealItem>
          <Card className="h-full p-4">
            <p
              className={cn(
                "mb-2 inline-flex items-center gap-1.5 text-xs font-medium",
                retoqueDue ? "text-amber-500" : "text-muted"
              )}
            >
              {retoqueDue && (
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                </span>
              )}
              <Clock size={13} /> Retoque
            </p>
            {last ? (
              <>
                <p className="font-medium">
                  {w === 0 ? "Esta semana" : `Hace ${w} ${w === 1 ? "semana" : "semanas"}`}
                </p>
                <p className="mt-1 text-xs text-muted">
                  {retoqueDue ? "Sugerido traerla de vuelta" : "Al día"}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted">—</p>
            )}
          </Card>
        </RevealItem>

        {/* Lealtad / frecuencia */}
        <RevealItem>
          <Card className="h-full p-4">
            <p className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
              <Repeat size={13} /> Lealtad
            </p>
            <p className="font-display text-xl font-semibold tabular">
              {history.length}{" "}
              <span className="text-sm font-normal text-muted">
                {history.length === 1 ? "visita" : "visitas"}
              </span>
            </p>
            <p className="mt-1 text-xs text-muted">Cliente desde {monthYear(createdAt)}</p>
          </Card>
        </RevealItem>
      </Reveal>

      {/* ── Timeline ── */}
      <Card className="p-6">
        <p className="mb-5 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted">
          <Sparkles size={13} className="text-metallic" />
          {timelineTitle(businessType)}
        </p>

        {history.length === 0 ? (
          <p className="text-sm text-muted">
            Aún no hay visitas. Cuando registres servicios desde Citas, aparecerán
            aquí automáticamente.
          </p>
        ) : (
          <ol className="relative ml-2 border-l border-border">
            {history.slice(0, 15).map((h, i) => {
              const chips = detailChips(fields, h.techDetail);
              return (
                <motion.li
                  key={h.id}
                  initial={{ opacity: 0, x: -8 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{
                    delay: Math.min(i * 0.05, 0.4),
                    type: "spring",
                    stiffness: 260,
                    damping: 26,
                  }}
                  className="relative mb-5 pl-6 last:mb-0"
                >
                  {/* punto */}
                  <span
                    className={cn(
                      "absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg",
                      i === 0 ? "bg-accent" : "bg-border"
                    )}
                  />
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                    <p className="font-medium">{h.serviceName}</p>
                    <span className="tabular text-sm font-medium text-accent">
                      {formatRD(h.amount)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-muted">
                    {formatDateRD(h.startsAt)} · {h.professionalName}
                  </p>
                  {chips.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {chips.map((c) => (
                        <span
                          key={c.label}
                          className="rounded-md border border-border bg-surface-2/50 px-2 py-0.5 text-[11px]"
                        >
                          <span className="text-muted">{c.label}:</span>{" "}
                          <span className="font-medium">{c.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </motion.li>
              );
            })}
          </ol>
        )}
      </Card>
    </div>
  );
}
