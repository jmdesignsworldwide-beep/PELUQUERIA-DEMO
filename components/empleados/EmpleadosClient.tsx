"use client";

/**
 * EMPLEADOS (demo navegable). Todo el staff. Clic = ficha con rol, horario,
 * asistencia, nómina SIMULADA (las comisiones de los profesionales se estiman
 * de los cobros reales del demo) y vacaciones.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UsersRound, Clock, Wallet, CalendarCheck, Percent, Plane } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { cn } from "@/lib/cn";
import { fromCents } from "@/lib/money/calc";
import { Employee, employeesFor } from "@/lib/catalog/employees";
import { initials } from "@/components/citas/data";

function rd(p: number) {
  return `RD$ ${Math.round(p).toLocaleString("es-DO")}`;
}

function Avatar({ name, hue, size = 44 }: { name: string; hue: number; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full font-semibold text-fg/90"
      style={{ width: size, height: size, fontSize: size * 0.36, background: `hsl(${hue} 42% 50% / 0.22)`, boxShadow: `inset 0 0 0 1px hsl(${hue} 42% 55% / 0.45)` }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function EmpleadosClient() {
  const { businessType, skin } = useApp();
  const { payments } = useMoney();
  const employees = useMemo(() => employeesFor(businessType), [businessType]);
  const [openId, setOpenId] = useState<string | null>(null);
  const open = employees.find((e) => e.id === openId) ?? null;

  // Comisiones estimadas del mes (de los cobros) por profesional.
  const commissionByPro = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const p of payments) {
      if (p.status === "pagado" && p.commission > 0)
        acc[p.professionalId] = (acc[p.professionalId] ?? 0) + p.commission;
    }
    return acc;
  }, [payments]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
          <UsersRound size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Empleados</h1>
          <p className="text-xs text-muted">{employees.length} en el equipo · {skin.label}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {employees.map((e, i) => (
          <motion.button
            key={e.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.22 }}
            onClick={() => setOpenId(e.id)}
            className="group flex items-center gap-3 rounded-2xl border border-border glass p-4 text-left shadow-soft transition-premium hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop sm:p-5"
          >
            <Avatar name={e.name} hue={e.hue} size={46} />
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold tracking-tight">{e.name}</p>
              <p className="truncate text-[11px] text-muted">{e.role}</p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-surface-2/60 px-2 py-0.5 text-[10px] text-muted">
                <CalendarCheck size={10} /> {e.asistenciaPct}% asistencia
              </p>
            </div>
          </motion.button>
        ))}
      </div>

      <Modal open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ""}>
        {open && (
          <Ficha employee={open} comision={fromCents(commissionByPro[open.id] ?? 0)} />
        )}
      </Modal>
    </div>
  );
}

function Ficha({ employee: e, comision }: { employee: Employee; comision: number }) {
  const total = e.salarioBase + e.bono + (e.tipo === "profesional" ? comision : 0);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Avatar name={e.name} hue={e.hue} size={52} />
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">{e.name}</p>
          <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent-soft/40 px-2 py-0.5 text-[11px] font-medium text-accent">
            {e.role}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><Clock size={12} /> Horario</p>
          <p className="text-sm font-medium">{e.horarioDias}</p>
          <p className="text-[11px] text-muted tabular">{e.horarioHoras}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><CalendarCheck size={12} /> Asistencia</p>
          <p className="font-display text-xl font-semibold tabular">{e.asistenciaPct}%</p>
          <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-surface-2">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${e.asistenciaPct}%` }} />
          </span>
        </div>
      </div>

      {/* Nómina simulada */}
      <div className="rounded-xl border border-border bg-surface-2/40 p-3">
        <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><Wallet size={12} /> Nómina del mes (simulada)</p>
        <Row label="Salario base" value={rd(e.salarioBase)} />
        {e.tipo === "profesional" && (
          <Row label={`Comisiones (${e.commissionPct ?? 0}%)`} value={rd(comision)} />
        )}
        <Row label="Bono" value={rd(e.bono)} />
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm text-muted">Total estimado</span>
          <span className="font-display text-xl font-semibold tabular">{rd(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {e.tipo === "profesional" && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm">
            <Percent size={15} className="text-accent" />
            <span className="text-muted">Comisión</span>
            <span className="ml-auto font-medium tabular">{e.commissionPct}%</span>
          </div>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm">
          <Plane size={15} className="text-accent" />
          <span className="text-muted">Vacaciones</span>
          <span className="ml-auto font-medium tabular">{e.vacacionesDias} días</span>
        </div>
      </div>

      <p className="text-center text-[11px] text-muted">Nómina y asistencia simuladas para la demostración.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-sm">
      <span className="text-muted">{label}</span>
      <span className="tabular font-medium">{value}</span>
    </div>
  );
}
