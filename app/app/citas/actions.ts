"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { dateStrToParts, rdWallToInstant } from "@/lib/rd";
import { digits, isValidPhone } from "@/lib/validation";
import type { AgStatus } from "@/lib/agenda";

export type ActionResult = { ok?: boolean; error?: string };

const STATUSES: AgStatus[] = [
  "pendiente",
  "confirmada",
  "en_proceso",
  "completada",
  "cancelada",
  "no_show",
];

type Busy = { id: string; professional_id: string | null; s: number; e: number };

async function busyFor(
  supabase: ReturnType<typeof createClient>,
  proId: string,
  dateStr: string
): Promise<Busy[]> {
  const { y, m, day } = dateStrToParts(dateStr);
  const dayStart = rdWallToInstant(y, m, day, 0).toISOString();
  const dayEnd = rdWallToInstant(y, m, day, 24 * 60).toISOString();
  const [{ data: appts }, { data: blocks }] = await Promise.all([
    supabase
      .from("appointments")
      .select("id, professional_id, starts_at, ends_at, status")
      .eq("professional_id", proId)
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd),
    supabase
      .from("time_blocks")
      .select("id, professional_id, starts_at, ends_at")
      .eq("professional_id", proId)
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd),
  ]);
  const out: Busy[] = [];
  for (const a of appts ?? []) {
    if (a.status === "cancelada" || a.status === "no_show") continue;
    out.push({
      id: a.id,
      professional_id: a.professional_id,
      s: new Date(a.starts_at).getTime(),
      e: new Date(a.ends_at).getTime(),
    });
  }
  for (const b of blocks ?? []) {
    out.push({
      id: "block:" + b.id,
      professional_id: b.professional_id,
      s: new Date(b.starts_at).getTime(),
      e: new Date(b.ends_at).getTime(),
    });
  }
  return out;
}

function clashes(busy: Busy[], s: number, e: number, exceptId?: string) {
  return busy.some((b) => b.id !== exceptId && s < b.e && e > b.s);
}

export async function setStatus(
  apptId: string,
  status: AgStatus
): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return { error: "Estado inválido." };
  const supabase = createClient();
  const { error } = await supabase
    .from("appointments")
    .update({
      status,
      is_cancelled: status === "cancelada" || status === "no_show",
    })
    .eq("id", apptId);
  if (error) return { error: "No se pudo actualizar el estado." };
  revalidatePath("/app/citas");
  revalidatePath("/app");
  return { ok: true };
}

export async function moveAppointment(input: {
  apptId: string;
  professionalId: string;
  startMin: number;
  dateStr: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const { data: appt } = await supabase
    .from("appointments")
    .select("id, starts_at, ends_at")
    .eq("id", input.apptId)
    .single();
  if (!appt) return { error: "Cita no encontrada." };

  const dur =
    (new Date(appt.ends_at).getTime() - new Date(appt.starts_at).getTime()) /
    60000;
  const { y, m, day } = dateStrToParts(input.dateStr);
  const start = rdWallToInstant(y, m, day, input.startMin);
  const sMs = start.getTime();
  const eMs = sMs + dur * 60000;

  const busy = await busyFor(supabase, input.professionalId, input.dateStr);
  if (clashes(busy, sMs, eMs, input.apptId))
    return { error: "Ese horario choca con otra cita o bloqueo." };

  const { error } = await supabase
    .from("appointments")
    .update({
      professional_id: input.professionalId,
      starts_at: start.toISOString(),
      ends_at: new Date(eMs).toISOString(),
    })
    .eq("id", input.apptId);
  if (error) return { error: "No se pudo mover la cita." };
  revalidatePath("/app/citas");
  revalidatePath("/app");
  return { ok: true };
}

export async function createWalkin(input: {
  name: string;
  phone: string;
  serviceId: string;
  professionalId: string;
  dateStr: string;
  startMin: number;
}): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };

  const name = input.name.trim();
  if (name.length < 2) return { error: "Escribe el nombre del cliente." };
  if (input.phone && !isValidPhone(input.phone))
    return { error: "Teléfono inválido (809/829/849 + 7 dígitos)." };

  const { data: service } = await supabase
    .from("services")
    .select("price, duration_min")
    .eq("id", input.serviceId)
    .single();
  if (!service) return { error: "Servicio no válido." };

  const { y, m, day } = dateStrToParts(input.dateStr);
  const start = rdWallToInstant(y, m, day, input.startMin);
  const sMs = start.getTime();
  const eMs = sMs + service.duration_min * 60000;

  const busy = await busyFor(supabase, input.professionalId, input.dateStr);
  if (clashes(busy, sMs, eMs))
    return { error: "Ese horario choca con otra cita o bloqueo." };

  // Vincular/crear cliente por teléfono.
  let clientId: string | null = null;
  const phoneDigits = input.phone ? digits(input.phone) : null;
  if (phoneDigits) {
    const { data: existing } = await supabase
      .from("clients")
      .select("id")
      .eq("owner_id", user.id)
      .eq("phone", phoneDigits)
      .maybeSingle();
    clientId = existing?.id ?? null;
  }
  if (!clientId) {
    const { data: created } = await supabase
      .from("clients")
      .insert({ owner_id: user.id, name, phone: phoneDigits })
      .select("id")
      .single();
    clientId = created?.id ?? null;
  }

  const { data: loc } = await supabase
    .from("locations")
    .select("id")
    .eq("owner_id", user.id)
    .eq("is_primary", true)
    .maybeSingle();

  const { error } = await supabase.from("appointments").insert({
    owner_id: user.id,
    location_id: loc?.id ?? null,
    client_id: clientId,
    professional_id: input.professionalId,
    service_id: input.serviceId,
    starts_at: start.toISOString(),
    ends_at: new Date(eMs).toISOString(),
    amount: service.price,
    payment_method: "efectivo",
    source: "interna",
    status: "confirmada",
  });
  if (error) return { error: "No se pudo crear la cita." };
  revalidatePath("/app/citas");
  revalidatePath("/app");
  return { ok: true };
}

export async function createBlock(input: {
  professionalId: string;
  dateStr: string;
  startMin: number;
  endMin: number;
  reason: string;
}): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sesión expirada." };
  if (input.endMin <= input.startMin)
    return { error: "El fin debe ser después del inicio." };

  const { y, m, day } = dateStrToParts(input.dateStr);
  const start = rdWallToInstant(y, m, day, input.startMin);
  const end = rdWallToInstant(y, m, day, input.endMin);

  const busy = await busyFor(supabase, input.professionalId, input.dateStr);
  if (clashes(busy, start.getTime(), end.getTime()))
    return { error: "Ese rango choca con una cita existente." };

  const { error } = await supabase.from("time_blocks").insert({
    owner_id: user.id,
    professional_id: input.professionalId,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    reason: input.reason.trim() || "Bloqueado",
  });
  if (error) return { error: "No se pudo bloquear el horario." };
  revalidatePath("/app/citas");
  return { ok: true };
}

export async function deleteBlock(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error } = await supabase.from("time_blocks").delete().eq("id", id);
  if (error) return { error: "No se pudo quitar el bloqueo." };
  revalidatePath("/app/citas");
  return { ok: true };
}
