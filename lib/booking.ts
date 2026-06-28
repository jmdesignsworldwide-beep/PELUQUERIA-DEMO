import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { dateStrToParts, rdParts, rdWallToInstant } from "@/lib/rd";
import { digits, isValidPhone } from "@/lib/validation";
import type { BusinessType } from "@/lib/skins";

/**
 * Capa de servidor de la RESERVA PÚBLICA. Usa service_role (solo servidor) y
 * SIEMPRE acota por owner_id resuelto del slug — nunca confía en el navegador
 * para decidir la cuenta. Expone solo lo mínimo: leer opciones + crear cita.
 */

const SLOT_STEP = 30; // minutos
const RATE_WINDOW_SEC = 60;
const RATE_MAX = 6;

export type PublicAccount = {
  ownerId: string;
  businessType: BusinessType;
  businessName: string;
  publicPhone: string | null;
  slug: string;
};

export type Location = {
  id: string;
  name: string;
  address: string | null;
  openMin: number;
  closeMin: number;
  closedWeekdays: number[];
  isPrimary: boolean;
};

export type Professional = {
  id: string;
  name: string;
  specialty: string | null;
  locationId: string | null;
};

export type Service = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  category: string | null;
};

export type BookingOptions = {
  locations: Location[];
  professionals: Professional[];
  services: Service[];
};

export async function getAccountBySlug(
  slug: string
): Promise<PublicAccount | null> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, business_type, business_name, public_phone, slug, is_active")
    .eq("slug", slug)
    .maybeSingle();
  if (!data || !data.is_active) return null;
  return {
    ownerId: data.id,
    businessType: (data.business_type as BusinessType) ?? "salon",
    businessName: data.business_name,
    publicPhone: data.public_phone,
    slug: data.slug,
  };
}

export async function getBookingOptions(
  ownerId: string
): Promise<BookingOptions> {
  const svc = createServiceClient();
  const [loc, pro, srv] = await Promise.all([
    svc
      .from("locations")
      .select("id, name, address, open_min, close_min, closed_weekdays, is_primary, sort")
      .eq("owner_id", ownerId)
      .order("sort"),
    svc
      .from("professionals")
      .select("id, name, specialty, location_id")
      .eq("owner_id", ownerId)
      .order("name"),
    svc
      .from("services")
      .select("id, name, price, duration_min, category, sort")
      .eq("owner_id", ownerId)
      .order("sort"),
  ]);

  return {
    locations: (loc.data ?? []).map((l) => ({
      id: l.id,
      name: l.name,
      address: l.address,
      openMin: l.open_min,
      closeMin: l.close_min,
      closedWeekdays: l.closed_weekdays ?? [0],
      isPrimary: l.is_primary,
    })),
    professionals: (pro.data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      specialty: p.specialty,
      locationId: p.location_id,
    })),
    services: (srv.data ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      price: Number(s.price),
      durationMin: s.duration_min,
      category: s.category,
    })),
  };
}

type ApptBusy = { professional_id: string | null; s: number; e: number };

async function busyOnDate(
  ownerId: string,
  dateStr: string
): Promise<ApptBusy[]> {
  const svc = createServiceClient();
  const { y, m, day } = dateStrToParts(dateStr);
  const dayStart = rdWallToInstant(y, m, day, 0).toISOString();
  const dayEnd = rdWallToInstant(y, m, day, 24 * 60).toISOString();
  const { data } = await svc
    .from("appointments")
    .select("professional_id, starts_at, ends_at, is_cancelled")
    .eq("owner_id", ownerId)
    .gte("starts_at", dayStart)
    .lt("starts_at", dayEnd);
  return (data ?? [])
    .filter((a) => !a.is_cancelled)
    .map((a) => ({
      professional_id: a.professional_id,
      s: new Date(a.starts_at).getTime(),
      e: new Date(a.ends_at).getTime(),
    }));
}

function overlaps(busy: ApptBusy[], proId: string, s: number, e: number) {
  return busy.some((b) => b.professional_id === proId && s < b.e && e > b.s);
}

export type Slot = { timeMin: number; iso: string };

export async function getAvailableSlots(params: {
  ownerId: string;
  locationId: string;
  professionalId: string | null;
  serviceId: string;
  dateStr: string;
}): Promise<Slot[]> {
  const { ownerId, locationId, professionalId, serviceId, dateStr } = params;
  const svc = createServiceClient();

  const { data: loc } = await svc
    .from("locations")
    .select("open_min, close_min, closed_weekdays")
    .eq("owner_id", ownerId)
    .eq("id", locationId)
    .maybeSingle();
  if (!loc) return [];

  const { y, m, day, weekday } = dateStrToParts(dateStr);
  if ((loc.closed_weekdays ?? [0]).includes(weekday)) return [];

  const { data: service } = await svc
    .from("services")
    .select("duration_min")
    .eq("owner_id", ownerId)
    .eq("id", serviceId)
    .maybeSingle();
  if (!service) return [];
  const dur = service.duration_min as number;

  // Profesionales elegibles (el escogido, o todos los de la ubicación).
  const { data: pros } = await svc
    .from("professionals")
    .select("id, location_id")
    .eq("owner_id", ownerId);
  let eligible = (pros ?? [])
    .filter((p) => !p.location_id || p.location_id === locationId)
    .map((p) => p.id);
  if (professionalId) eligible = eligible.filter((id) => id === professionalId);
  if (!eligible.length) return [];

  const busy = await busyOnDate(ownerId, dateStr);
  const nowMs = Date.now() + 15 * 60 * 1000; // margen 15 min

  const slots: Slot[] = [];
  for (let t = loc.open_min; t + dur <= loc.close_min; t += SLOT_STEP) {
    const start = rdWallToInstant(y, m, day, t);
    const sMs = start.getTime();
    const eMs = sMs + dur * 60000;
    if (sMs < nowMs) continue;
    const free = eligible.some((pid) => !overlaps(busy, pid, sMs, eMs));
    if (free) slots.push({ timeMin: t, iso: start.toISOString() });
  }
  return slots;
}

export type BookingResult =
  | { ok: true; confirmation: Confirmation }
  | { ok: false; error: string };

export type Confirmation = {
  code: string;
  businessName: string;
  locationName: string;
  locationAddress: string | null;
  professionalName: string;
  serviceName: string;
  price: number;
  dateLabel: string;
  timeLabel: string;
  clientName: string;
  publicPhone: string | null;
  startISO: string;
  endISO: string;
};

export async function createPublicBooking(input: {
  slug: string;
  locationId: string;
  professionalId: string | null;
  serviceId: string;
  dateStr: string;
  timeMin: number;
  name: string;
  phone: string;
  email?: string;
}): Promise<BookingResult> {
  const svc = createServiceClient();

  // ── Rate limit por slug ──
  const since = new Date(Date.now() - RATE_WINDOW_SEC * 1000).toISOString();
  const { count } = await svc
    .from("booking_attempts")
    .select("*", { count: "exact", head: true })
    .eq("slug", input.slug)
    .gte("created_at", since);
  if ((count ?? 0) >= RATE_MAX) {
    return { ok: false, error: "Demasiadas solicitudes. Intenta en un minuto." };
  }
  await svc.from("booking_attempts").insert({ slug: input.slug });

  // ── Validación server-side ──
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, error: "Escribe tu nombre." };
  if (!isValidPhone(input.phone))
    return { ok: false, error: "Teléfono inválido (809/829/849 + 7 dígitos)." };

  const account = await getAccountBySlug(input.slug);
  if (!account) return { ok: false, error: "Negocio no encontrado." };
  const ownerId = account.ownerId;

  const { data: service } = await svc
    .from("services")
    .select("name, price, duration_min")
    .eq("owner_id", ownerId)
    .eq("id", input.serviceId)
    .maybeSingle();
  if (!service) return { ok: false, error: "Servicio no disponible." };

  const { data: loc } = await svc
    .from("locations")
    .select("id, name, address")
    .eq("owner_id", ownerId)
    .eq("id", input.locationId)
    .maybeSingle();
  if (!loc) return { ok: false, error: "Ubicación no disponible." };

  const { y, m, day } = dateStrToParts(input.dateStr);
  const start = rdWallToInstant(y, m, day, input.timeMin);
  const sMs = start.getTime();
  const eMs = sMs + (service.duration_min as number) * 60000;
  if (sMs < Date.now()) return { ok: false, error: "Ese horario ya pasó." };

  // ── Resolver profesional (verificar libre) ──
  const busy = await busyOnDate(ownerId, input.dateStr);
  const { data: pros } = await svc
    .from("professionals")
    .select("id, name, location_id")
    .eq("owner_id", ownerId);
  const candidates = (pros ?? []).filter(
    (p) => !p.location_id || p.location_id === input.locationId
  );
  let chosen = input.professionalId
    ? candidates.find((p) => p.id === input.professionalId)
    : candidates.find((p) => !overlaps(busy, p.id, sMs, eMs));
  if (input.professionalId && chosen && overlaps(busy, chosen.id, sMs, eMs)) {
    chosen = undefined;
  }
  if (!chosen)
    return { ok: false, error: "Ese horario ya no está disponible. Elige otro." };

  // ── Vincular/crear cliente (sin exponer datos) ──
  const phoneDigits = digits(input.phone);
  const { data: existing } = await svc
    .from("clients")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("phone", phoneDigits)
    .maybeSingle();
  let clientId = existing?.id ?? null;
  if (!clientId) {
    const { data: created } = await svc
      .from("clients")
      .insert({
        owner_id: ownerId,
        name,
        phone: phoneDigits,
        email: input.email?.trim() || null,
      })
      .select("id")
      .single();
    clientId = created?.id ?? null;
  }

  // ── Crear la cita ──
  const code =
    "JM-" + String(Math.floor(10000 + Math.random() * 89999));
  const { error: insErr } = await svc.from("appointments").insert({
    owner_id: ownerId,
    location_id: loc.id,
    client_id: clientId,
    professional_id: chosen.id,
    service_id: input.serviceId,
    starts_at: start.toISOString(),
    ends_at: new Date(eMs).toISOString(),
    amount: service.price,
    payment_method: "efectivo",
    source: "publica",
    booking_code: code,
  });
  if (insErr) return { ok: false, error: "No se pudo crear la reserva." };

  const fmtDate = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(start);
  const fmtTime = new Intl.DateTimeFormat("es-DO", {
    timeZone: "America/Santo_Domingo",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(start);

  return {
    ok: true,
    confirmation: {
      code,
      businessName: account.businessName,
      locationName: loc.name,
      locationAddress: loc.address,
      professionalName: chosen.name,
      serviceName: service.name,
      price: Number(service.price),
      dateLabel: fmtDate,
      timeLabel: fmtTime,
      clientName: name,
      publicPhone: account.publicPhone,
      startISO: start.toISOString(),
      endISO: new Date(eMs).toISOString(),
    },
  };
}
