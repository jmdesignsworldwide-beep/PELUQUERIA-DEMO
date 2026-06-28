/** Validación y formato de datos dominicanos (cédula, teléfono). */

export function digits(s: string): string {
  return (s || "").replace(/\D/g, "");
}

/** Cédula dominicana: 11 dígitos. Formato visual XXX-XXXXXXX-X. */
export function isValidCedula(s: string): boolean {
  return digits(s).length === 11;
}

export function formatCedula(s: string): string {
  const d = digits(s).slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 10) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 10)}-${d.slice(10)}`;
}

/** Teléfono RD: 10 dígitos con prefijo 809/829/849. Formato XXX-XXX-XXXX. */
export function isValidPhone(s: string): boolean {
  const d = digits(s);
  return d.length === 10 && ["809", "829", "849"].includes(d.slice(0, 3));
}

export function formatPhone(s: string): string {
  const d = digits(s).slice(0, 10);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

export function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
}
