/**
 * Empleados (demo navegable). TODO el staff: profesionales (estilistas/barberos,
 * coherentes con la agenda) + recepción/asistencia/limpieza. Nómina simulada.
 */

import type { BusinessType } from "@/lib/skins";
import { getSkin } from "@/lib/skins";
import { professionalsRichFor } from "@/lib/catalog/professionals";

export type Employee = {
  id: string;
  name: string;
  role: string;
  hue: number;
  tipo: "profesional" | "staff";
  horarioDias: string;
  horarioHoras: string;
  salarioBase: number; // RD$ / mes (nómina simulada)
  commissionPct?: number;
  asistenciaPct: number;
  bono: number; // RD$ del mes
  vacacionesDias: number;
};

const EXTRA_STAFF: Omit<Employee, "id" | "tipo">[] = [
  { name: "Yinet Ramírez", role: "Recepcionista", hue: 200, horarioDias: "Lun – Sáb", horarioHoras: "8:00 – 17:00", salarioBase: 18000, asistenciaPct: 98, bono: 2000, vacacionesDias: 10 },
  { name: "Kelvin Díaz", role: "Asistente", hue: 150, horarioDias: "Mar – Sáb", horarioHoras: "9:00 – 18:00", salarioBase: 14000, asistenciaPct: 95, bono: 1000, vacacionesDias: 8 },
  { name: "Altagracia Núñez", role: "Mantenimiento", hue: 40, horarioDias: "Lun – Vie", horarioHoras: "7:00 – 15:00", salarioBase: 12000, asistenciaPct: 99, bono: 500, vacacionesDias: 12 },
];

function asistenciaSeed(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return 90 + (h % 10); // 90–99%
}

export function employeesFor(skin: BusinessType): Employee[] {
  const roleName = getSkin(skin).vocab.professional;
  const pros: Employee[] = professionalsRichFor(skin).map((p) => ({
    id: p.id,
    name: p.name,
    role: roleName,
    hue: p.hue,
    tipo: "profesional",
    horarioDias: p.horarioDias,
    horarioHoras: p.horarioHoras,
    salarioBase: 12000,
    commissionPct: p.commissionPct,
    asistenciaPct: asistenciaSeed(p.id),
    bono: 1500,
    vacacionesDias: 12,
  }));
  const staff: Employee[] = EXTRA_STAFF.map((s, i) => ({
    ...s,
    id: `staff-${i}`,
    tipo: "staff",
  }));
  return [...pros, ...staff];
}
