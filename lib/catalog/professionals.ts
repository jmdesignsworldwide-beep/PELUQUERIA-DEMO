/**
 * Datos enriquecidos de profesionales (demo). EXTIENDE la lista de la agenda
 * (components/citas/data.ts) con horario, comisión, servicios que realiza y bio,
 * manteniendo los MISMOS ids/nombres para que cuadre con las columnas de la
 * agenda y con propinas/comisiones en pagos.
 */

import type { BusinessType } from "@/lib/skins";
import { Professional, professionalsFor } from "@/components/citas/data";

export type ProfessionalMeta = {
  horarioDias: string;
  horarioHoras: string;
  commissionPct: number;
  serviceIds: string[];
  bio: string;
};

const META: Record<string, ProfessionalMeta> = {
  // ── Salón ──
  s1: { horarioDias: "Mar – Sáb", horarioHoras: "9:00 – 18:00", commissionPct: 50, serviceIds: ["s-color", "s-mechas", "s-keratina", "s-tratamiento"], bio: "Especialista en color y balayage con técnica de iluminación natural." },
  s2: { horarioDias: "Lun – Sáb", horarioHoras: "8:00 – 17:00", commissionPct: 45, serviceIds: ["s-corte", "s-secado", "s-peinado"], bio: "Cortes y peinados para todo tipo de cabello." },
  s3: { horarioDias: "Mar – Sáb", horarioHoras: "9:00 – 18:00", commissionPct: 45, serviceIds: ["s-mani", "s-mani-gel", "s-pedi"], bio: "Uñas y spa de manos y pies, esmaltado en gel." },
  s4: { horarioDias: "Jue – Dom", horarioHoras: "10:00 – 19:00", commissionPct: 48, serviceIds: ["s-maquillaje", "s-cejas"], bio: "Maquillaje social y de novia." },
  s5: { horarioDias: "Lun – Vie", horarioHoras: "8:00 – 16:00", commissionPct: 45, serviceIds: ["s-tratamiento", "s-keratina", "s-color"], bio: "Tratamientos capilares y alisados." },
  s6: { horarioDias: "Mar – Sáb", horarioHoras: "9:00 – 18:00", commissionPct: 45, serviceIds: ["s-cejas", "s-maquillaje"], bio: "Diseño de cejas y pestañas." },
  s7: { horarioDias: "Mié – Dom", horarioHoras: "9:00 – 18:00", commissionPct: 42, serviceIds: ["s-secado", "s-corte", "s-peinado"], bio: "Secado, brushing y peinados de salida." },
  // ── Barbería ──
  b1: { horarioDias: "Lun – Sáb", horarioHoras: "9:00 – 19:00", commissionPct: 50, serviceIds: ["b-fade", "b-clasico", "b-lineas"], bio: "Degradados y fades a la piel con transiciones limpias." },
  b2: { horarioDias: "Mar – Sáb", horarioHoras: "9:00 – 19:00", commissionPct: 48, serviceIds: ["b-corte-barba", "b-perfilado", "b-afeitado"], bio: "Barba y afeitado clásico a navaja." },
  b3: { horarioDias: "Lun – Sáb", horarioHoras: "8:00 – 18:00", commissionPct: 45, serviceIds: ["b-clasico", "b-corte-barba"], bio: "Corte clásico y caballero." },
  b4: { horarioDias: "Mié – Dom", horarioHoras: "10:00 – 20:00", commissionPct: 48, serviceIds: ["b-lineas", "b-fade"], bio: "Diseños y líneas personalizadas a navaja." },
  b5: { horarioDias: "Lun – Vie", horarioHoras: "9:00 – 18:00", commissionPct: 45, serviceIds: ["b-tinte", "b-clasico"], bio: "Color y cobertura de canas." },
  b6: { horarioDias: "Jue – Dom", horarioHoras: "10:00 – 20:00", commissionPct: 50, serviceIds: ["b-ritual", "b-corte-barba", "b-afeitado"], bio: "Rituales completos y experiencia premium." },
  b7: { horarioDias: "Lun – Sáb", horarioHoras: "9:00 – 17:00", commissionPct: 42, serviceIds: ["b-nino", "b-clasico"], bio: "Cortes infantiles con paciencia." },
};

const FALLBACK: ProfessionalMeta = {
  horarioDias: "Lun – Sáb",
  horarioHoras: "9:00 – 18:00",
  commissionPct: 45,
  serviceIds: [],
  bio: "Profesional del equipo.",
};

export type RichProfessional = Professional & ProfessionalMeta;

export function professionalsRichFor(skin: BusinessType): RichProfessional[] {
  return professionalsFor(skin).map((p) => ({
    ...p,
    ...(META[p.id] ?? FALLBACK),
  }));
}

export function professionalMeta(id: string): ProfessionalMeta {
  return META[id] ?? FALLBACK;
}
