"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { internalEmail, isValidUsername, normalizeUsername } from "@/lib/auth";

export type LoginState = { error?: string };

// Rate limit server-side POR USUARIO (el límite por-IP de Supabase ve la IP de
// Vercel, no la del atacante). Ventana deslizante respaldada en la base.
const WINDOW_MINUTES = 5;
const MAX_ATTEMPTS = 6;

export async function login(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = normalizeUsername(String(formData.get("username") ?? ""));
  const password = String(formData.get("password") ?? "");

  if (!username || !password) {
    return { error: "Escribe tu usuario y contraseña." };
  }
  if (!isValidUsername(username)) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const service = createServiceClient();
  const since = new Date(
    Date.now() - WINDOW_MINUTES * 60 * 1000
  ).toISOString();

  // 1) ¿demasiados intentos recientes para este usuario?
  const { count } = await service
    .from("login_attempts")
    .select("*", { count: "exact", head: true })
    .eq("username", username)
    .gte("created_at", since);

  if ((count ?? 0) >= MAX_ATTEMPTS) {
    return {
      error: "Demasiados intentos. Espera unos minutos e intenta de nuevo.",
    };
  }

  // 2) Autenticar (usuario → email interno, invisible para el cliente).
  const supabase = createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: internalEmail(username),
    password,
  });

  if (signInError) {
    await service.from("login_attempts").insert({ username });
    return { error: "Usuario o contraseña incorrectos." };
  }

  // 3) Validar estado y vencimiento EN EL SERVIDOR.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_active, access_expires_at")
    .eq("id", user!.id)
    .single();

  if (!profile || !profile.is_active) {
    await supabase.auth.signOut();
    return { error: "Esta cuenta está inactiva. Contacta al administrador." };
  }

  if (
    profile.access_expires_at &&
    new Date(profile.access_expires_at).getTime() < Date.now()
  ) {
    await supabase.auth.signOut();
    return { error: "El acceso de esta cuenta ha vencido." };
  }

  // 4) Éxito: limpiar intentos y entrar.
  await service.from("login_attempts").delete().eq("username", username);
  redirect("/app");
}
