/**
 * ──────────────────────────────────────────────────────────────────────────
 * AGENDA · CAPA DE DATOS (demo)
 * ──────────────────────────────────────────────────────────────────────────
 * No hay backend de citas todavía (Tanda 1 = identidad). Para que la agenda se
 * vea y se sienta como el producto final, generamos datos de muestra
 * DETERMINISTAS (seed = profesional+fecha). Mismo input → mismo output, por lo
 * que no hay desajuste de hidratación y el calendario es estable entre renders.
 *
 * Cuando exista la tabla `appointments`, solo se reemplaza `appointmentsFor()`.
 */

import type { BusinessType } from "@/lib/skins";

/* ===================== Geometría de la rejilla ===================== */

export const START_HOUR = 8; // 8:00 AM
export const END_HOUR = 20; // 8:00 PM
export const HOUR_HEIGHT = 64; // px por hora (densidad cómoda)
export const SLOT_MIN = 15; // resolución del drag (cuartos de hora)

export const GRID_START_MIN = START_HOUR * 60;
export const GRID_END_MIN = END_HOUR * 60;
export const GRID_MINUTES = GRID_END_MIN - GRID_START_MIN;
export const GRID_HEIGHT = (GRID_MINUTES / 60) * HOUR_HEIGHT;

export const COL_MIN_WIDTH = 172; // ancho mínimo de columna de profesional

/** px por minuto, para convertir tiempo ↔ posición vertical. */
export const PX_PER_MIN = HOUR_HEIGHT / 60;

/* ===================== Estados ===================== */

export type StatusKey =
  | "pendiente"
  | "confirmada"
  | "en_proceso"
  | "completada"
  | "no_show"
  | "cancelada";

export type StatusDef = {
  key: StatusKey;
  label: string;
  /** Nombre de la variable CSS con el canal RGB del color (en globals.css). */
  cssVar: string;
};

export const STATUSES: Record<StatusKey, StatusDef> = {
  pendiente: { key: "pendiente", label: "Pendiente", cssVar: "--st-pendiente" },
  confirmada: { key: "confirmada", label: "Confirmada", cssVar: "--st-confirmada" },
  en_proceso: { key: "en_proceso", label: "En proceso", cssVar: "--st-proceso" },
  completada: { key: "completada", label: "Completada", cssVar: "--st-completada" },
  no_show: { key: "no_show", label: "No-show", cssVar: "--st-noshow" },
  cancelada: { key: "cancelada", label: "Cancelada", cssVar: "--st-cancelada" },
};

export const STATUS_ORDER: StatusKey[] = [
  "pendiente",
  "confirmada",
  "en_proceso",
  "completada",
  "no_show",
  "cancelada",
];

/** `rgb(var(--st-x) / a)` listo para usar en estilos inline. */
export function statusColor(key: StatusKey, alpha = 1): string {
  return `rgb(var(${STATUSES[key].cssVar}) / ${alpha})`;
}

/* ===================== Tipos ===================== */

export type Professional = {
  id: string;
  name: string;
  specialty: string;
  /** Tono HSL decorativo para el avatar (no es color de marca). */
  hue: number;
};

export type Appointment = {
  id: string;
  professionalId: string;
  /** Fecha ISO local YYYY-MM-DD. */
  date: string;
  /** Minutos desde medianoche. */
  start: number;
  /** Duración en minutos (define la altura del bloque). */
  duration: number;
  client: string;
  service: string;
  status: StatusKey;
};

/* ===================== Catálogos por piel ===================== */

const PROFESSIONALS: Record<BusinessType, Professional[]> = {
  salon: [
    { id: "s1", name: "Valentina R.", specialty: "Color & Balayage", hue: 338 },
    { id: "s2", name: "Camila S.", specialty: "Cortes & Peinados", hue: 28 },
    { id: "s3", name: "Génesis M.", specialty: "Uñas & Spa", hue: 268 },
    { id: "s4", name: "Paola D.", specialty: "Maquillaje", hue: 350 },
    { id: "s5", name: "Niurka P.", specialty: "Tratamientos", hue: 168 },
    { id: "s6", name: "Massiel V.", specialty: "Cejas & Pestañas", hue: 200 },
    { id: "s7", name: "Scarlett A.", specialty: "Brushing", hue: 312 },
  ],
  barberia: [
    { id: "b1", name: "Carlos M.", specialty: "Degradados", hue: 28 },
    { id: "b2", name: "Luis F.", specialty: "Barba & Navaja", hue: 18 },
    { id: "b3", name: "Pedro G.", specialty: "Clásico", hue: 200 },
    { id: "b4", name: "Ramón T.", specialty: "Diseños", hue: 142 },
    { id: "b5", name: "Félix H.", specialty: "Color", hue: 268 },
    { id: "b6", name: "Wilkin S.", specialty: "Rituales", hue: 38 },
    { id: "b7", name: "Starling R.", specialty: "Infantil", hue: 188 },
  ],
};

export function professionalsFor(skin: BusinessType): Professional[] {
  return PROFESSIONALS[skin];
}

const CLIENTS: Record<BusinessType, string[]> = {
  salon: [
    "María Fernández", "Carla Jiménez", "Génesis Peña", "Rosa Almonte",
    "Yamilet Reyes", "Paola Castillo", "Niurka Vargas", "Dahiana Cruz",
    "Massiel Then", "Scarlett Ureña", "Wendy Polanco", "Yokasta Mejía",
    "Esther Núñez", "Laura Santos", "Camila Rosario",
  ],
  barberia: [
    "José Martínez", "Carlos Rodríguez", "Luis Encarnación", "Pedro Guzmán",
    "Juan De la Cruz", "Ramón Tavárez", "Félix Herrera", "Héctor Díaz",
    "Wilkin Soto", "Starling Ramírez", "Yunior Beltré", "Manuel Acosta",
    "Ángel Pérez", "Frank Castro", "Diego Méndez",
  ],
};

type ServiceDef = { name: string; duration: number };

const SERVICES: Record<BusinessType, ServiceDef[]> = {
  salon: [
    { name: "Brushing", duration: 30 },
    { name: "Diseño de cejas", duration: 30 },
    { name: "Corte y peinado", duration: 60 },
    { name: "Manicure", duration: 45 },
    { name: "Pedicure", duration: 60 },
    { name: "Tratamiento capilar", duration: 45 },
    { name: "Maquillaje social", duration: 60 },
    { name: "Color completo", duration: 120 },
    { name: "Keratina", duration: 120 },
    { name: "Mechas / Balayage", duration: 180 },
  ],
  barberia: [
    { name: "Afeitado a navaja", duration: 30 },
    { name: "Corte clásico", duration: 30 },
    { name: "Corte infantil", duration: 30 },
    { name: "Diseño de líneas", duration: 30 },
    { name: "Corte + barba", duration: 45 },
    { name: "Degradado", duration: 45 },
    { name: "Tinte", duration: 60 },
    { name: "Ritual completo", duration: 90 },
  ],
};

/* ===================== PRNG determinista ===================== */

function hashString(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

/** Estados con peso (suman naturalidad: muchas confirmadas/completadas). */
const STATUS_BAG: StatusKey[] = [
  "confirmada", "confirmada", "confirmada",
  "completada", "completada",
  "pendiente", "pendiente",
  "en_proceso",
  "no_show",
  "cancelada",
];

/* ===================== Utilidades de fecha ===================== */

/** ISO local (no UTC) YYYY-MM-DD. */
export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(iso: string, n: number): string {
  const d = fromISODate(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

const WEEKDAYS_LONG = [
  "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
];
const MONTHS_LONG = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
/** Encabezados de columna del mini-calendario (L a D). */
export const WEEKDAYS_MINI = ["L", "M", "M", "J", "V", "S", "D"];
export const MONTHS = MONTHS_LONG;

export function formatLongDate(iso: string): string {
  const d = fromISODate(iso);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

/** Etiqueta de hora 12h con AM/PM. minutos desde medianoche. */
export function minutesToLabel(min: number): string {
  let h = Math.floor(min / 60);
  const m = min % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  const mm = `${m}`.padStart(2, "0");
  return `${h}:${mm} ${ampm}`;
}

/** Solo la hora redonda: "8:00 AM". */
export function hourLabel(h: number): string {
  return minutesToLabel(h * 60);
}

/** Día de la semana 0=Lunes … 6=Domingo (para la rejilla del mini-cal). */
export function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

/* ===================== Generación de citas ===================== */

export function appointmentsFor(
  skin: BusinessType,
  professionalId: string,
  dateISO: string
): Appointment[] {
  const rng = mulberry32(hashString(`${skin}:${professionalId}:${dateISO}`));
  const clients = CLIENTS[skin];
  const services = SERVICES[skin];
  const dow = fromISODate(dateISO).getDay();

  // Domingo más liviano; demás días con buena carga.
  const baseCount = dow === 0 ? 1 : 3;
  const count = baseCount + Math.floor(rng() * 4); // 1–4 ó 3–6

  const out: Appointment[] = [];
  let cursor = GRID_START_MIN + Math.floor(rng() * 45); // empieza ~8:00–8:45

  for (let i = 0; i < count; i++) {
    const svc = pick(rng, services);
    if (cursor + svc.duration > GRID_END_MIN - 15) break;

    // Cuantizar el inicio a 15 min para que asiente limpio en la rejilla.
    const start = Math.round(cursor / 15) * 15;

    out.push({
      id: `${professionalId}-${dateISO}-${i}`,
      professionalId,
      date: dateISO,
      start,
      duration: svc.duration,
      client: pick(rng, clients),
      service: svc.name,
      status: pick(rng, STATUS_BAG),
    });

    // Hueco entre citas: 5–45 min.
    cursor = start + svc.duration + (5 + Math.floor(rng() * 40));
  }

  return out;
}

/** Cuántas citas tiene un profesional ese día (para contadores). */
export function countFor(
  skin: BusinessType,
  professionalId: string,
  dateISO: string
): number {
  return appointmentsFor(skin, professionalId, dateISO).length;
}

/** ¿El día (cualquier profesional) tiene citas? Para los puntitos del mini-cal. */
export function dayHasAppointments(
  skin: BusinessType,
  professionals: Professional[],
  dateISO: string
): boolean {
  return professionals.some((p) => countFor(skin, p.id, dateISO) > 0);
}

/* ===================== Anti-choque ===================== */

/** ¿`a` se solapa con alguna cita de `others` (mismo profesional)? */
export function hasConflict(
  a: { start: number; duration: number; id: string },
  others: Appointment[]
): boolean {
  const aEnd = a.start + a.duration;
  return others.some((o) => {
    if (o.id === a.id) return false;
    const oEnd = o.start + o.duration;
    return a.start < oEnd && aEnd > o.start;
  });
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? "";
  return (first + second).toUpperCase();
}
