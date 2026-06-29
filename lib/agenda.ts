import "server-only";
import { createClient } from "@/lib/supabase/server";
import {
  dateStrToParts,
  rdParts,
  rdTodayDateStr,
  rdWallToInstant,
} from "@/lib/rd";

export type AgStatus =
  | "pendiente"
  | "confirmada"
  | "en_proceso"
  | "completada"
  | "cancelada"
  | "no_show";

export type AgProfessional = { id: string; name: string; specialty: string | null };

export type AgAppt = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string | null;
  serviceName: string;
  serviceId: string | null;
  durationMin: number;
  professionalId: string | null;
  startMin: number;
  endMin: number;
  startISO: string;
  status: AgStatus;
  amount: number;
  source: string;
  bookingCode: string | null;
};

export type AgBlock = {
  id: string;
  professionalId: string | null;
  startMin: number;
  endMin: number;
  reason: string | null;
};

export type AgService = { id: string; name: string; price: number };

export type AgendaData = {
  dateStr: string;
  isToday: boolean;
  openMin: number;
  closeMin: number;
  nowMin: number | null;
  locationName: string | null;
  professionals: AgProfessional[];
  appts: AgAppt[];
  blocks: AgBlock[];
  services: AgService[];
  /** Fechas RD (YYYY-MM-DD) con al menos una cita (para el mini-calendario). */
  apptDates: string[];
};

function minOfDay(iso: string): number {
  const p = rdParts(new Date(iso));
  return p.minutesOfDay;
}

export async function getAgendaData(dateStr?: string): Promise<AgendaData | null> {
  const supabase = createClient();
  await supabase.rpc("ensure_demo_data");
  await supabase.rpc("enrich_demo_statuses");

  const date = dateStr || rdTodayDateStr();
  const { y, m, day } = dateStrToParts(date);
  const dayStart = rdWallToInstant(y, m, day, 0).toISOString();
  const dayEnd = rdWallToInstant(y, m, day, 24 * 60).toISOString();

  const [{ data: pros }, { data: loc }, apptsRes, blocksRes, srvRes] =
    await Promise.all([
    supabase.from("professionals").select("id, name, specialty").order("name"),
    supabase
      .from("locations")
      .select("name, open_min, close_min, is_primary")
      .order("sort"),
    supabase
      .from("appointments")
      .select(
        "id, client_id, professional_id, service_id, starts_at, ends_at, amount, status, source, booking_code, clients(name, phone), services(name, duration_min)"
      )
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd)
      .order("starts_at"),
    supabase
      .from("time_blocks")
      .select("id, professional_id, starts_at, ends_at, reason")
      .gte("starts_at", dayStart)
      .lt("starts_at", dayEnd),
    supabase.from("services").select("id, name, price").order("sort"),
  ]);

  if (!pros) return null;

  const primary =
    (loc ?? []).find((l) => l.is_primary) ?? (loc ?? [])[0] ?? null;
  const openMin = primary?.open_min ?? 540;
  const closeMin = primary?.close_min ?? 1140;

  type Row = {
    id: string;
    client_id: string | null;
    professional_id: string | null;
    service_id: string | null;
    starts_at: string;
    ends_at: string;
    amount: number | string;
    status: AgStatus;
    source: string;
    booking_code: string | null;
    clients: { name: string; phone: string | null } | null;
    services: { name: string; duration_min: number } | null;
  };

  const appts: AgAppt[] = ((apptsRes.data ?? []) as unknown as Row[]).map((a) => {
    const startMin = minOfDay(a.starts_at);
    const endMin = minOfDay(a.ends_at);
    return {
      id: a.id,
      clientId: a.client_id,
      clientName: a.clients?.name ?? "Cliente",
      clientPhone: a.clients?.phone ?? null,
      serviceName: a.services?.name ?? "—",
      serviceId: a.service_id,
      durationMin: a.services?.duration_min ?? Math.max(15, endMin - startMin),
      professionalId: a.professional_id,
      startMin,
      endMin: endMin > startMin ? endMin : startMin + 30,
      startISO: a.starts_at,
      status: a.status,
      amount: Number(a.amount),
      source: a.source,
      bookingCode: a.booking_code,
    };
  });

  const blocks: AgBlock[] = (blocksRes.data ?? []).map((b) => ({
    id: b.id,
    professionalId: b.professional_id,
    startMin: minOfDay(b.starts_at),
    endMin: minOfDay(b.ends_at),
    reason: b.reason,
  }));

  // Fechas con citas (ventana -35 .. +95 días) para los puntitos del picker.
  const winStart = new Date(Date.now() - 35 * 86400000).toISOString();
  const winEnd = new Date(Date.now() + 95 * 86400000).toISOString();
  const { data: dateRows } = await supabase
    .from("appointments")
    .select("starts_at, is_cancelled")
    .gte("starts_at", winStart)
    .lt("starts_at", winEnd);
  const apptDates = Array.from(
    new Set(
      (dateRows ?? [])
        .filter((r) => !r.is_cancelled)
        .map((r) => rdParts(new Date(r.starts_at)).dateStr)
    )
  );

  const todayStr = rdTodayDateStr();
  const isToday = date === todayStr;
  const nowMin = isToday ? rdParts(new Date()).minutesOfDay : null;

  return {
    dateStr: date,
    isToday,
    openMin,
    closeMin,
    nowMin,
    locationName: primary?.name ?? null,
    professionals: (pros as AgProfessional[]) ?? [],
    appts,
    blocks,
    services: ((srvRes.data ?? []) as { id: string; name: string; price: number | string }[]).map(
      (s) => ({ id: s.id, name: s.name, price: Number(s.price) })
    ),
    apptDates,
  };
}
