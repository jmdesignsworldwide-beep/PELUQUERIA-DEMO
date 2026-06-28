/** Formato RD$ con separador de miles, sin decimales. */
export function formatRD(n: number): string {
  return "RD$ " + Math.round(n).toLocaleString("es-DO");
}

/** Hora de un ISO en zona RD, formato 12h: "3:00 PM". */
export function formatTimeRD(iso: string): string {
  return new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso));
}
