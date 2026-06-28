"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  digits,
  isValidCedula,
  isValidEmail,
  isValidPhone,
} from "@/lib/validation";

const BUCKET = "client-photos";
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;

export type ClientFormState = { ok?: boolean; error?: string; id?: string };

function parseTechSheet(formData: FormData): Record<string, string> {
  const tech: Record<string, string> = {};
  formData.forEach((v, k) => {
    if (k.startsWith("tech.") && typeof v === "string") {
      const val = v.trim();
      if (val) tech[k.slice(5)] = val;
    }
  });
  return tech;
}

async function handlePhoto(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  clientId: string,
  file: File
): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!file.type.startsWith("image/")) {
    throw new Error("La foto debe ser una imagen.");
  }
  if (file.size > MAX_PHOTO_BYTES) {
    throw new Error("La foto no puede pesar más de 3 MB.");
  }
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().slice(0, 5);
  const path = `${userId}/${clientId}/${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error("No se pudo subir la foto.");
  return path;
}

export async function saveClient(
  _prev: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada. Vuelve a entrar." };

  const id = (formData.get("id") as string) || null;
  const name = ((formData.get("name") as string) || "").trim();
  const phoneRaw = ((formData.get("phone") as string) || "").trim();
  const cedulaRaw = ((formData.get("cedula") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim();
  const birthdate = ((formData.get("birthdate") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const isVip = formData.get("is_vip") === "on";
  const balanceRaw = ((formData.get("balance") as string) || "").trim();

  // ── Validación en el SERVIDOR ──
  if (!name) return { error: "El nombre es obligatorio." };
  if (phoneRaw && !isValidPhone(phoneRaw))
    return { error: "Teléfono inválido (debe ser 809/829/849 + 7 dígitos)." };
  if (cedulaRaw && !isValidCedula(cedulaRaw))
    return { error: "La cédula debe tener 11 dígitos." };
  if (email && !isValidEmail(email))
    return { error: "El correo no tiene un formato válido." };

  const row = {
    owner_id: user.id,
    name,
    phone: phoneRaw ? digits(phoneRaw) : null,
    cedula: cedulaRaw ? digits(cedulaRaw) : null,
    email: email || null,
    birthdate: birthdate || null,
    notes: notes || null,
    is_vip: isVip,
    balance: balanceRaw ? Number(balanceRaw) || 0 : 0,
    tech_sheet: parseTechSheet(formData),
    updated_at: new Date().toISOString(),
  };

  let clientId = id;
  if (id) {
    const { error } = await supabase.from("clients").update(row).eq("id", id);
    if (error) return { error: "No se pudo guardar el cambio." };
  } else {
    const { data, error } = await supabase
      .from("clients")
      .insert(row)
      .select("id")
      .single();
    if (error || !data) return { error: "No se pudo crear el cliente." };
    clientId = data.id;
  }

  // ── Foto (opcional) ──
  const file = formData.get("photo") as File | null;
  if (file && file.size > 0 && clientId) {
    try {
      const path = await handlePhoto(supabase, user.id, clientId, file);
      if (path)
        await supabase
          .from("clients")
          .update({ photo_path: path })
          .eq("id", clientId);
    } catch (e) {
      return { error: (e as Error).message, id: clientId ?? undefined };
    }
  }

  revalidatePath("/app/clientes");
  if (clientId) revalidatePath(`/app/clientes/${clientId}`);
  return { ok: true, id: clientId ?? undefined };
}
