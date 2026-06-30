"use server";

/**
 * ──────────────────────────────────────────────────────────────────────────
 * GESTIÓN DE CUENTAS (REAL · solo admin · validado en el SERVIDOR)
 * ──────────────────────────────────────────────────────────────────────────
 * El acceso temporal es real: las cuentas viven en Supabase Auth + profiles.
 * El rol 'cliente' NUNCA puede ejecutar estas acciones (se verifica el rol del
 * llamante en el servidor con su sesión; las mutaciones usan el service role
 * sólo DESPUÉS de confirmar que quien llama es admin).
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import {
  internalEmail,
  isValidUsername,
  normalizeUsername,
} from "@/lib/auth";
import type { BusinessType } from "@/lib/skins";

export type AccountRow = {
  id: string;
  username: string;
  business_type: BusinessType;
  business_name: string;
  role: "admin" | "cliente";
  access_expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/** ¿La cuenta está vencida por fecha? */
function isExpired(accessExpiresAt: string | null): boolean {
  return (
    !!accessExpiresAt && new Date(accessExpiresAt).getTime() < Date.now()
  );
}

/**
 * Devuelve el usuario actual SOLO si su cuenta sigue VIGENTE (activa y no
 * vencida), validado en el servidor en CADA acción —no solo al hacer login—.
 * Cierra el hueco de una sesión viva cuya cuenta fue desactivada/vencida.
 */
async function requireActiveUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_active, access_expires_at")
    .eq("id", user.id)
    .single();
  if (!profile || !profile.is_active || isExpired(profile.access_expires_at)) {
    return null;
  }
  return { user, role: profile.role as "admin" | "cliente" };
}

/** Devuelve el usuario actual SOLO si es admin y su cuenta está vigente. */
async function requireAdmin() {
  const active = await requireActiveUser();
  return active && active.role === "admin" ? active.user : null;
}

function expiryFromDays(days: number | null): string | null {
  if (days == null) return null; // sin vencimiento
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Crear una cuenta de cliente (admin). */
export async function createClientAccount(input: {
  username: string;
  password: string;
  businessType: BusinessType;
  businessName: string;
  days: number | null;
}): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };

  const username = normalizeUsername(input.username);
  if (!isValidUsername(username)) {
    return {
      ok: false,
      error: "Usuario inválido (3-40: letras, números, punto, guion).",
    };
  }
  if (!input.password || input.password.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  if (!input.businessName.trim()) {
    return { ok: false, error: "Escribe el nombre del negocio." };
  }
  if (input.businessType !== "salon" && input.businessType !== "barberia") {
    return { ok: false, error: "Piel inválida." };
  }

  const service = createServiceClient();

  // Usuario único.
  const { data: existing } = await service
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (existing) return { ok: false, error: "Ese usuario ya existe." };

  const { error } = await service.auth.admin.createUser({
    email: internalEmail(username),
    password: input.password,
    email_confirm: true,
    user_metadata: {
      username,
      business_type: input.businessType,
      role: "cliente",
      business_name: input.businessName.trim(),
      access_expires_at: expiryFromDays(input.days) ?? "",
      is_active: true,
    },
  });
  if (error) {
    return { ok: false, error: "No se pudo crear la cuenta: " + error.message };
  }
  return { ok: true };
}

/** Lista todas las cuentas (admin). */
export async function listAccounts(): Promise<ActionResult<AccountRow[]>> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const service = createServiceClient();
  const { data, error } = await service
    .from("profiles")
    .select(
      "id, username, business_type, business_name, role, access_expires_at, is_active, created_at"
    )
    .order("created_at", { ascending: false });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: (data ?? []) as AccountRow[] };
}

/** Renovar/extender N días (admin). Extiende desde hoy o desde el vencimiento
 *  futuro vigente, lo que sea mayor. */
export async function renewAccount(
  id: string,
  days: number
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  if (!Number.isFinite(days) || days <= 0) {
    return { ok: false, error: "Días inválidos." };
  }
  const service = createServiceClient();
  const { data: current } = await service
    .from("profiles")
    .select("access_expires_at")
    .eq("id", id)
    .single();
  const now = Date.now();
  const base =
    current?.access_expires_at &&
    new Date(current.access_expires_at).getTime() > now
      ? new Date(current.access_expires_at).getTime()
      : now;
  const next = new Date(base + days * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await service
    .from("profiles")
    .update({ access_expires_at: next, is_active: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Quitar el vencimiento (acceso permanente) (admin). */
export async function setNoExpiry(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ access_expires_at: null, is_active: true })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Forzar el vencimiento (para PROBAR el bloqueo por fecha) (admin). */
export async function expireAccountNow(id: string): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ access_expires_at: yesterday })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Activar / desactivar una cuenta (admin). */
export async function setAccountActive(
  id: string,
  active: boolean
): Promise<ActionResult> {
  const admin = await requireAdmin();
  if (!admin) return { ok: false, error: "No autorizado." };
  const service = createServiceClient();
  const { error } = await service
    .from("profiles")
    .update({ is_active: active })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Cambiar la contraseña de la PROPIA cuenta (cualquier rol). */
export async function changeOwnPassword(
  newPassword: string
): Promise<ActionResult> {
  // Solo una cuenta vigente (activa y no vencida) puede cambiar su contraseña.
  const active = await requireActiveUser();
  if (!active) return { ok: false, error: "No autorizado." };
  const supabase = createClient();
  if (!newPassword || newPassword.length < 6) {
    return { ok: false, error: "La contraseña debe tener al menos 6 caracteres." };
  }
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
