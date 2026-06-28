/** Utilidades de zona horaria de República Dominicana (UTC-4, sin DST). */

export const RD_MS = 4 * 60 * 60 * 1000;

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export type RDParts = {
  y: number;
  m: number; // 0-11
  day: number;
  hour: number;
  min: number;
  weekday: number; // 0=domingo
  minutesOfDay: number;
  dateStr: string; // YYYY-MM-DD
};

/** Componentes de reloj de pared RD para un instante. */
export function rdParts(d: Date): RDParts {
  const s = new Date(d.getTime() - RD_MS);
  return {
    y: s.getUTCFullYear(),
    m: s.getUTCMonth(),
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    min: s.getUTCMinutes(),
    weekday: s.getUTCDay(),
    minutesOfDay: s.getUTCHours() * 60 + s.getUTCMinutes(),
    dateStr: `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`,
  };
}

/** Reloj de pared RD (y,m,day + minutos del día) → instante absoluto. */
export function rdWallToInstant(
  y: number,
  m: number,
  day: number,
  minutesOfDay: number
): Date {
  const h = Math.floor(minutesOfDay / 60);
  const mm = minutesOfDay % 60;
  return new Date(Date.UTC(y, m, day, h, mm) + RD_MS);
}

/** "YYYY-MM-DD" (interpretado como fecha RD) → partes. */
export function dateStrToParts(dateStr: string) {
  const [y, m, day] = dateStr.split("-").map(Number);
  // weekday: construye el instante al mediodía RD para evitar bordes.
  const noon = rdWallToInstant(y, m - 1, day, 12 * 60);
  return { y, m: m - 1, day, weekday: rdParts(noon).weekday };
}

export function rdTodayDateStr(): string {
  return rdParts(new Date()).dateStr;
}
