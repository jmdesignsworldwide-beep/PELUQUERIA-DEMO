import "server-only";
import { createClient } from "@/lib/supabase/server";

/**
 * Capa de datos del Dashboard. LEE de la fuente única (Supabase) y deriva los
 * indicadores. Maneja una "hora de referencia" anclada a horario laboral de RD
 * para que el demo siempre se vea vivo (cita en curso / próxima) a cualquier hora.
 */

const RD_MS = 4 * 60 * 60 * 1000; // RD = UTC-4 (sin horario de verano)
const OPEN_MIN = 9 * 60; // 09:00
const CLOSE_MIN = 18 * 60 + 30; // 18:30

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Componentes de reloj de pared en RD para un instante dado. */
function rdParts(d: Date) {
  const s = new Date(d.getTime() - RD_MS);
  return {
    y: s.getUTCFullYear(),
    m: s.getUTCMonth(),
    day: s.getUTCDate(),
    hour: s.getUTCHours(),
    min: s.getUTCMinutes(),
    minutesOfDay: s.getUTCHours() * 60 + s.getUTCMinutes(),
    dateStr: `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`,
  };
}

/** Convierte un reloj de pared RD a instante absoluto (Date UTC). */
function rdWallToInstant(
  y: number,
  m: number,
  day: number,
  hour: number,
  min: number
) {
  return new Date(Date.UTC(y, m, day, hour, min) + RD_MS);
}

export type ApptLite = {
  id: string;
  startsAt: string;
  endsAt: string;
  amount: number;
  tip: number;
  paymentMethod: "efectivo" | "transferencia" | "tarjeta";
  isCancelled: boolean;
  clientName: string;
  clientPhone: string | null;
  professionalId: string | null;
  professionalName: string;
  serviceName: string;
  status: "completada" | "en_curso" | "pendiente" | "cancelada";
};

export type DashboardData = {
  referenceNowISO: string;
  rdDateLabel: string;
  greeting: string;
  todayCount: number;
  completed: number;
  pending: number;
  cancelled: number;
  cajaToday: number;
  cajaBreakdown: {
    efectivo: number;
    transferencia: number;
    tarjeta: number;
    propinas: number;
  };
  next: ApptLite | null;
  enCurso: ApptLite[];
  professionals: {
    id: string;
    name: string;
    title: string;
    busy: boolean;
    withClient: string | null;
  }[];
  busyCount: number;
  availableCount: number;
  todayList: ApptLite[];
  trend: { label: string; value: number }[];
};

type Row = {
  id: string;
  starts_at: string;
  ends_at: string;
  amount: number | string;
  tip: number | string;
  payment_method: ApptLite["paymentMethod"];
  is_cancelled: boolean;
  professional_id: string | null;
  clients: { name: string; phone: string | null } | null;
  professionals: { id: string; name: string } | null;
  services: { name: string } | null;
};

const DOW = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function greetingFor(minutesOfDay: number) {
  const h = Math.floor(minutesOfDay / 60);
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export async function getDashboardData(): Promise<DashboardData | null> {
  const supabase = createClient();

  // Auto-siembra idempotente (mantiene el día actual vivo).
  await supabase.rpc("ensure_demo_data");

  const sinceISO = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
  const { data: rows } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, amount, tip, payment_method, is_cancelled, professional_id, clients(name, phone), professionals(id, name), services(name)"
    )
    .gte("starts_at", sinceISO)
    .order("starts_at", { ascending: true })
    .returns<Row[]>();

  const { data: pros } = await supabase
    .from("professionals")
    .select("id, name, title")
    .order("name");

  if (!rows || !pros) return null;

  // ── Hora de referencia (anclada a horario laboral si estamos fuera) ──
  const realNow = new Date();
  const np = rdParts(realNow);
  let ref: Date;
  if (np.minutesOfDay >= OPEN_MIN && np.minutesOfDay <= CLOSE_MIN) {
    ref = realNow;
  } else {
    const clampMin = np.minutesOfDay < OPEN_MIN ? 10 * 60 + 30 : 15 * 60;
    ref = rdWallToInstant(
      np.y,
      np.m,
      np.day,
      Math.floor(clampMin / 60),
      clampMin % 60
    );
  }
  const rp = rdParts(ref);
  const refMs = ref.getTime();

  const statusOf = (r: Row): ApptLite["status"] => {
    if (r.is_cancelled) return "cancelada";
    const start = new Date(r.starts_at).getTime();
    const end = new Date(r.ends_at).getTime();
    if (end <= refMs) return "completada";
    if (start <= refMs) return "en_curso";
    return "pendiente";
  };

  const toLite = (r: Row): ApptLite => ({
    id: r.id,
    startsAt: r.starts_at,
    endsAt: r.ends_at,
    amount: Number(r.amount),
    tip: Number(r.tip),
    paymentMethod: r.payment_method,
    isCancelled: r.is_cancelled,
    clientName: r.clients?.name ?? "—",
    clientPhone: r.clients?.phone ?? null,
    professionalId: r.professional_id,
    professionalName: r.professionals?.name ?? "—",
    serviceName: r.services?.name ?? "—",
    status: statusOf(r),
  });

  const todayRows = rows.filter((r) => rdParts(new Date(r.starts_at)).dateStr === rp.dateStr);
  const todayList = todayRows.map(toLite);

  const completed = todayList.filter((a) => a.status === "completada").length;
  const enCursoList = todayList.filter((a) => a.status === "en_curso");
  const pending = todayList.filter((a) => a.status === "pendiente").length;
  const cancelled = todayList.filter((a) => a.status === "cancelada").length;

  // Caja del día = completadas (monto + propina), crece con la hora.
  const completedToday = todayList.filter((a) => a.status === "completada");
  const cajaToday = completedToday.reduce((s, a) => s + a.amount + a.tip, 0);
  const cajaBreakdown = {
    efectivo: completedToday
      .filter((a) => a.paymentMethod === "efectivo")
      .reduce((s, a) => s + a.amount, 0),
    transferencia: completedToday
      .filter((a) => a.paymentMethod === "transferencia")
      .reduce((s, a) => s + a.amount, 0),
    tarjeta: completedToday
      .filter((a) => a.paymentMethod === "tarjeta")
      .reduce((s, a) => s + a.amount, 0),
    propinas: completedToday.reduce((s, a) => s + a.tip, 0),
  };

  const next =
    todayList
      .filter((a) => !a.isCancelled && new Date(a.startsAt).getTime() > refMs)
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
      )[0] ?? null;

  const busyIds = new Set(
    enCursoList.map((a) => a.professionalId).filter(Boolean) as string[]
  );
  const professionals = (pros as { id: string; name: string; title: string }[]).map(
    (p) => {
      const cur = enCursoList.find((a) => a.professionalId === p.id);
      return {
        id: p.id,
        name: p.name,
        title: p.title,
        busy: busyIds.has(p.id),
        withClient: cur?.clientName ?? null,
      };
    }
  );

  // Tendencia: 7 días (ingresos completados por día RD).
  const trend: { label: string; value: number }[] = [];
  for (let d = 6; d >= 0; d--) {
    const dayInstant = new Date(refMs - d * 24 * 60 * 60 * 1000);
    const dp = rdParts(dayInstant);
    const value = rows
      .filter((r) => rdParts(new Date(r.starts_at)).dateStr === dp.dateStr)
      .filter((r) => !r.is_cancelled && new Date(r.ends_at).getTime() <= refMs)
      .reduce((s, r) => s + Number(r.amount) + Number(r.tip), 0);
    const dow = new Date(dayInstant.getTime() - RD_MS).getUTCDay();
    trend.push({ label: DOW[dow], value });
  }

  return {
    referenceNowISO: ref.toISOString(),
    rdDateLabel: `${pad(rp.day)}/${pad(rp.m + 1)}/${rp.y}`,
    greeting: greetingFor(rp.minutesOfDay),
    todayCount: todayList.length,
    completed,
    pending,
    cancelled,
    cajaToday,
    cajaBreakdown,
    next,
    enCurso: enCursoList,
    professionals,
    busyCount: professionals.filter((p) => p.busy).length,
    availableCount: professionals.filter((p) => !p.busy).length,
    todayList,
    trend,
  };
}
