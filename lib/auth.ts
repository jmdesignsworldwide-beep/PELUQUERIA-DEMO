/**
 * Mapeo usuario ↔ email interno.
 *
 * El cliente solo ve y escribe USUARIO + CONTRASEÑA. Supabase Auth requiere un
 * email internamente, así que lo derivamos de forma determinística por detrás.
 * El cliente nunca ve ni escribe este email.
 */
export const INTERNAL_EMAIL_DOMAIN = "interno.jmbeauty.local";

/** Normaliza el usuario: minúsculas y sin espacios. */
export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

/** Construye el email interno a partir del usuario. */
export function internalEmail(username: string): string {
  return `${normalizeUsername(username)}@${INTERNAL_EMAIL_DOMAIN}`;
}

/** Validación básica de formato de usuario (letras, números, guion, punto). */
export function isValidUsername(username: string): boolean {
  return /^[a-z0-9._-]{3,40}$/.test(normalizeUsername(username));
}
