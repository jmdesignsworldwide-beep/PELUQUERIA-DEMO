"use client";

import { motion } from "framer-motion";
import {
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  Scissors,
  Sparkles,
  User,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatRD } from "@/lib/format";
import type { Confirmation as Conf } from "@/lib/booking";

function icsStamp(iso: string) {
  return iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function downloadIcs(c: Conf) {
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//JM Beauty//Reserva//ES",
    "BEGIN:VEVENT",
    `UID:${c.code}@jmbeauty`,
    `DTSTART:${icsStamp(c.startISO)}`,
    `DTEND:${icsStamp(c.endISO)}`,
    `SUMMARY:${c.serviceName} · ${c.businessName}`,
    `LOCATION:${(c.locationAddress ?? c.locationName).replace(/,/g, "\\,")}`,
    `DESCRIPTION:Reserva ${c.code} con ${c.professionalName}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reserva-${c.code}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export function Confirmation({
  conf,
  onReset,
}: {
  conf: Conf;
  onReset: () => void;
}) {
  const { skin } = useApp();
  const v = skin.vocab;

  const waMessage = `¡Hola ${conf.clientName}! ✅ Tu cita en ${conf.businessName} quedó confirmada.\n\n📅 ${conf.dateLabel}\n🕐 ${conf.timeLabel}\n💇 ${conf.serviceName} con ${conf.professionalName}\n📍 ${conf.locationName}\n\nComprobante: ${conf.code}\n¡Te esperamos!`;

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      {/* Check animado */}
      <div className="flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 16 }}
          className="relative grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow"
        >
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.18, type: "spring", stiffness: 300, damping: 14 }}
          >
            <Check size={40} strokeWidth={3} />
          </motion.span>
          {[...Array(6)].map((_, i) => (
            <motion.span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-metallic"
              initial={{ opacity: 0, x: 0, y: 0 }}
              animate={{
                opacity: [0, 1, 0],
                x: Math.cos((i / 6) * Math.PI * 2) * 52,
                y: Math.sin((i / 6) * Math.PI * 2) * 52,
              }}
              transition={{ delay: 0.25, duration: 0.7 }}
            />
          ))}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mt-4 font-display text-2xl font-semibold tracking-tight">
            ¡Reserva confirmada!
          </h2>
          <p className="mt-1 text-muted">
            Comprobante{" "}
            <span className="font-semibold text-accent">{conf.code}</span>
          </p>
        </motion.div>
      </div>

      {/* Resumen */}
      <Card className="p-5">
        <div className="space-y-3 text-sm">
          <SummaryRow icon={Scissors} label={conf.serviceName} value={formatRD(conf.price)} />
          <SummaryRow icon={User} label={`${v.professional}`} value={conf.professionalName} />
          <SummaryRow icon={Clock} label="Cuándo" value={`${conf.dateLabel}, ${conf.timeLabel}`} />
          <SummaryRow icon={MapPin} label={conf.locationName} value={conf.locationAddress ?? ""} />
        </div>
      </Card>

      {/* WhatsApp simulado */}
      <div>
        <p className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted">
          <MessageCircle size={15} className="text-emerald-500" />
          Te enviamos la confirmación por WhatsApp
        </p>
        <div className="rounded-2xl border border-border bg-surface-2/40 p-3">
          <div className="rounded-xl rounded-tl-sm bg-emerald-500/10 p-3 text-sm leading-relaxed">
            <p className="whitespace-pre-line text-fg/90">{waMessage}</p>
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">
            Confirmación simulada para demostración.
          </p>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-col gap-3">
        <Button variant="secondary" onClick={() => downloadIcs(conf)} fullWidth>
          <CalendarPlus size={16} /> Agregar a mi calendario
        </Button>
        <Button variant="ghost" onClick={onReset} fullWidth>
          <Sparkles size={15} /> Hacer otra reserva
        </Button>
      </div>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex min-w-0 items-center gap-2 text-muted">
        <Icon size={15} className="shrink-0 text-accent" />
        <span className="truncate">{label}</span>
      </span>
      <span className="shrink-0 text-right font-medium">{value}</span>
    </div>
  );
}
