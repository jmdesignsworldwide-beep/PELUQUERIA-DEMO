"use client";

/**
 * MÓDULO PROFESIONALES (estilistas / barberos) — demo en navegador, coherente
 * con la agenda (mismos profesionales) y con pagos (las estadísticas se
 * derivan de la fuente única del dinero). Ficha con patrón "clic = más info".
 */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Scissors,
  Plus,
  Clock,
  Percent,
  CalendarDays,
  TrendingUp,
  Coins,
  Users,
  Star,
  Pencil,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatRD } from "@/lib/money/calc";
import type { Payment } from "@/lib/money/types";
import {
  RichProfessional,
  professionalsRichFor,
} from "@/lib/catalog/professionals";
import { servicesFor } from "@/lib/catalog/services";
import { appointmentsFor, initials } from "@/components/citas/data";

function Avatar({ name, hue, size = 44 }: { name: string; hue: number; size?: number }) {
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

function isoMinus(today: string, n: number): string {
  const [y, m, d] = today.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() - n);
  return `${dt.getFullYear()}-${`${dt.getMonth() + 1}`.padStart(2, "0")}-${`${dt.getDate()}`.padStart(2, "0")}`;
}

type Stats = {
  servicios: number;
  ingresos: number;
  propinas: number;
  clientes: number;
  topService: string;
  serie: number[];
};

function statsFor(payments: Payment[], proId: string, today: string): Stats {
  const ps = payments.filter((p) => p.professionalId === proId && p.status === "pagado");
  const counts: Record<string, number> = {};
  ps.forEach((p) => (counts[p.service] = (counts[p.service] ?? 0) + 1));
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  const serie = Array.from({ length: 7 }, (_, i) => {
    const date = isoMinus(today, 6 - i);
    return ps.filter((p) => p.date === date).reduce((s, p) => s + p.subtotal, 0);
  });
  return {
    servicios: ps.length,
    ingresos: ps.reduce((s, p) => s + p.subtotal, 0),
    propinas: ps.reduce((s, p) => s + p.tip, 0),
    clientes: new Set(ps.map((p) => p.clientName)).size,
    topService: top ? top[0] : "—",
    serie,
  };
}

export function ProfesionalesClient() {
  const { businessType, skin } = useApp();
  const { payments, today } = useMoney();
  const vocab = skin.vocab;

  const [pros, setPros] = useState<RichProfessional[]>(() =>
    professionalsRichFor(businessType)
  );
  const [openId, setOpenId] = useState<string | null>(null);
  const [editor, setEditor] = useState<RichProfessional | "nuevo" | null>(null);

  useEffect(() => {
    setPros(professionalsRichFor(businessType));
    setOpenId(null);
  }, [businessType]);

  const services = useMemo(() => servicesFor(businessType), [businessType]);
  const serviceName = (id: string) => services.find((s) => s.id === id)?.name ?? id;

  const open = pros.find((p) => p.id === openId) ?? null;

  function save(p: RichProfessional) {
    setPros((prev) => {
      const exists = prev.some((x) => x.id === p.id);
      return exists ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
    });
    setEditor(null);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Scissors size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {vocab.professionalPlural}
            </h1>
            <p className="text-xs text-muted">
              {pros.length} en el equipo · {skin.label}
            </p>
          </div>
        </div>
        <Button onClick={() => setEditor("nuevo")}>
          <Plus size={16} /> Nuevo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {pros.map((p, i) => {
          const citasHoy = appointmentsFor(businessType, p.id, today).length;
          return (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
              onClick={() => setOpenId(p.id)}
              className="group flex items-center gap-3 rounded-2xl border border-border glass p-4 text-left shadow-soft transition-premium hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop sm:p-5"
            >
              <Avatar name={p.name} hue={p.hue} size={48} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base font-semibold tracking-tight">
                  {p.name}
                </p>
                <p className="truncate text-[11px] text-muted">{p.specialty}</p>
                <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-2/60 px-2 py-0.5 text-[10px] text-muted">
                  <CalendarDays size={10} />
                  {citasHoy} cita{citasHoy === 1 ? "" : "s"} hoy
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Ficha */}
      <Modal open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""}>
        {open && (
          <FichaProfesional
            pro={open}
            serviceName={serviceName}
            stats={statsFor(payments, open.id, today)}
            onEdit={() => setEditor(open)}
            vocab={vocab.professional}
          />
        )}
      </Modal>

      {/* Editor */}
      <ProfesionalEditor
        value={editor}
        baseHue={pros[0]?.hue ?? 320}
        onClose={() => setEditor(null)}
        onSave={save}
      />
    </div>
  );
}

function FichaProfesional({
  pro,
  serviceName,
  stats,
  onEdit,
  vocab,
}: {
  pro: RichProfessional;
  serviceName: (id: string) => string;
  stats: Stats;
  onEdit: () => void;
  vocab: string;
}) {
  const maxSerie = Math.max(1, ...stats.serie);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={pro.name} hue={pro.hue} size={52} />
        <div className="min-w-0">
          <p className="font-display text-lg font-semibold tracking-tight">{pro.name}</p>
          <p className="text-sm text-muted">{pro.specialty}</p>
        </div>
      </div>
      <p className="text-sm text-muted">{pro.bio}</p>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
            <Clock size={12} /> Horario
          </p>
          <p className="text-sm font-medium">{pro.horarioDias}</p>
          <p className="text-[11px] text-muted tabular">{pro.horarioHoras}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
            <Percent size={12} /> Comisión
          </p>
          <p className="font-display text-xl font-semibold tabular">{pro.commissionPct}%</p>
        </div>
      </div>

      {pro.serviceIds.length > 0 && (
        <div>
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
            Servicios que realiza
          </p>
          <div className="flex flex-wrap gap-1.5">
            {pro.serviceIds.map((id) => (
              <span
                key={id}
                className="rounded-full border border-border bg-surface-2/40 px-2.5 py-1 text-xs"
              >
                {serviceName(id)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Estadísticas (derivadas de pagos) */}
      <div>
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
          Estadísticas
        </p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={Scissors} label="Servicios" value={String(stats.servicios)} />
          <Stat icon={TrendingUp} label="Ingresos" value={formatRD(stats.ingresos)} />
          <Stat icon={Coins} label="Propinas" value={formatRD(stats.propinas)} />
          <Stat icon={Users} label="Clientes" value={String(stats.clientes)} />
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm">
          <Star size={14} className="text-accent" />
          <span className="text-muted">Más realizado</span>
          <span className="ml-auto truncate font-medium">{stats.topService}</span>
        </div>
        {/* Mini-gráfico: ingresos últimos 7 días */}
        <div className="mt-3 rounded-xl border border-border bg-surface-2/30 p-3">
          <p className="mb-2 text-[11px] text-muted">Ingresos · últimos 7 días</p>
          <div className="flex h-16 items-end gap-1.5">
            {stats.serie.map((v, i) => (
              <span
                key={i}
                className="flex-1 rounded-t bg-accent/60"
                style={{ height: `${Math.max(3, (v / maxSerie) * 100)}%` }}
                title={formatRD(v)}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Link href="/app/citas">
          <Button fullWidth variant="secondary">
            <CalendarDays size={15} /> Ver su agenda
          </Button>
        </Link>
        <Button fullWidth variant="secondary" onClick={onEdit}>
          <Pencil size={15} /> Editar
        </Button>
      </div>
      <p className="text-center text-[11px] text-muted">
        Estadísticas reales del demo: se calculan de los cobros de este {vocab.toLowerCase()}.
      </p>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Scissors;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
      <Icon size={14} className="mx-auto mb-1 text-accent" />
      <p className="tabular text-sm font-semibold">{value}</p>
      <p className="text-[10px] text-muted">{label}</p>
    </div>
  );
}

function ProfesionalEditor({
  value,
  baseHue,
  onClose,
  onSave,
}: {
  value: RichProfessional | "nuevo" | null;
  baseHue: number;
  onClose: () => void;
  onSave: (p: RichProfessional) => void;
}) {
  const editing = value && value !== "nuevo" ? value : null;
  const [name, setName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [commission, setCommission] = useState("45");

  useEffect(() => {
    if (!value) return;
    if (editing) {
      setName(editing.name);
      setSpecialty(editing.specialty);
      setCommission(String(editing.commissionPct));
    } else {
      setName("");
      setSpecialty("");
      setCommission("45");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const inputCls =
    "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";
  const valid = name.trim() && specialty.trim();

  return (
    <Modal open={!!value} onClose={onClose} title={editing ? "Editar" : "Nuevo profesional"}>
      <div className="space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej. María R." />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Especialidad</span>
          <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} className={inputCls} placeholder="Ej. Color & Balayage" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Comisión (%)</span>
          <input inputMode="numeric" value={commission} onChange={(e) => setCommission(e.target.value)} className={cn(inputCls, "tabular max-w-[120px]")} />
        </label>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() =>
            onSave({
              id: editing ? editing.id : `nuevo-${Date.now()}`,
              name: name.trim(),
              specialty: specialty.trim(),
              hue: editing?.hue ?? baseHue,
              commissionPct: Math.max(0, Math.min(100, Number(commission) || 45)),
              horarioDias: editing?.horarioDias ?? "Lun – Sáb",
              horarioHoras: editing?.horarioHoras ?? "9:00 – 18:00",
              serviceIds: editing?.serviceIds ?? [],
              bio: editing?.bio ?? "Profesional del equipo.",
            })
          }
        >
          {editing ? "Guardar cambios" : "Crear"}
        </Button>
        <p className="text-center text-[11px] text-muted">
          Demo: los cambios se ven al instante (no persisten al recargar).
        </p>
      </div>
    </Modal>
  );
}
