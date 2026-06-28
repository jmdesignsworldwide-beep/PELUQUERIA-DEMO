import "server-only";
import { createClient } from "@/lib/supabase/server";

const BUCKET = "client-photos";
const SIGNED_TTL = 60 * 60;

export type ClientListItem = {
  id: string;
  name: string;
  phone: string | null;
  cedula: string | null;
  isVip: boolean;
  balance: number;
  photoUrl: string | null;
  lastVisitISO: string | null;
  visitCount: number;
};

export type VisitItem = {
  id: string;
  startsAt: string;
  serviceName: string;
  professionalName: string;
  amount: number;
  techDetail: Record<string, string>;
};

export type ClientFull = {
  id: string;
  name: string;
  phone: string | null;
  cedula: string | null;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  balance: number;
  isVip: boolean;
  techSheet: Record<string, string>;
  photoPath: string | null;
  photoUrl: string | null;
  createdAt: string;
  history: VisitItem[];
};

async function signMany(
  supabase: ReturnType<typeof createClient>,
  paths: string[]
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const clean = paths.filter(Boolean);
  if (!clean.length) return map;
  const { data } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(clean, SIGNED_TTL);
  for (const item of data ?? []) {
    if (item.signedUrl && item.path) map.set(item.path, item.signedUrl);
  }
  return map;
}

export async function getClients(): Promise<ClientListItem[]> {
  const supabase = createClient();
  await supabase.rpc("ensure_demo_data");
  await supabase.rpc("enrich_demo_visits"); // rellena detalle técnico por-visita

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name, phone, cedula, is_vip, balance, photo_path")
    .order("name");

  const { data: appts } = await supabase
    .from("appointments")
    .select("client_id, ends_at, is_cancelled")
    .eq("is_cancelled", false);

  if (!clients) return [];

  const now = Date.now();
  const lastByClient = new Map<string, string>();
  const countByClient = new Map<string, number>();
  for (const a of appts ?? []) {
    if (!a.client_id) continue;
    if (new Date(a.ends_at).getTime() > now) continue; // solo visitas pasadas
    countByClient.set(a.client_id, (countByClient.get(a.client_id) ?? 0) + 1);
    const prev = lastByClient.get(a.client_id);
    if (!prev || new Date(a.ends_at) > new Date(prev))
      lastByClient.set(a.client_id, a.ends_at);
  }

  const signed = await signMany(
    supabase,
    clients.map((c) => c.photo_path).filter(Boolean) as string[]
  );

  return clients.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    cedula: c.cedula,
    isVip: c.is_vip,
    balance: Number(c.balance),
    photoUrl: c.photo_path ? (signed.get(c.photo_path) ?? null) : null,
    lastVisitISO: lastByClient.get(c.id) ?? null,
    visitCount: countByClient.get(c.id) ?? 0,
  }));
}

type ClientRow = {
  id: string;
  name: string;
  phone: string | null;
  cedula: string | null;
  email: string | null;
  birthdate: string | null;
  notes: string | null;
  balance: number | string;
  is_vip: boolean;
  tech_sheet: Record<string, string> | null;
  photo_path: string | null;
  created_at: string;
};

export async function getClient(id: string): Promise<ClientFull | null> {
  const supabase = createClient();

  const { data: c } = await supabase
    .from("clients")
    .select(
      "id, name, phone, cedula, email, birthdate, notes, balance, is_vip, tech_sheet, photo_path, created_at"
    )
    .eq("id", id)
    .single<ClientRow>();

  if (!c) return null;

  const { data: appts } = await supabase
    .from("appointments")
    .select(
      "id, starts_at, ends_at, amount, is_cancelled, tech_detail, professionals(name), services(name)"
    )
    .eq("client_id", id)
    .order("starts_at", { ascending: false })
    .returns<
      {
        id: string;
        starts_at: string;
        ends_at: string;
        amount: number | string;
        is_cancelled: boolean;
        tech_detail: Record<string, string> | null;
        professionals: { name: string } | null;
        services: { name: string } | null;
      }[]
    >();

  const now = Date.now();
  const history: VisitItem[] = (appts ?? [])
    .filter((a) => !a.is_cancelled && new Date(a.ends_at).getTime() <= now)
    .map((a) => ({
      id: a.id,
      startsAt: a.starts_at,
      serviceName: a.services?.name ?? "—",
      professionalName: a.professionals?.name ?? "—",
      amount: Number(a.amount),
      techDetail: a.tech_detail ?? {},
    }));

  let photoUrl: string | null = null;
  if (c.photo_path) {
    const signed = await signMany(supabase, [c.photo_path]);
    photoUrl = signed.get(c.photo_path) ?? null;
  }

  return {
    id: c.id,
    name: c.name,
    phone: c.phone,
    cedula: c.cedula,
    email: c.email,
    birthdate: c.birthdate,
    notes: c.notes,
    balance: Number(c.balance),
    isVip: c.is_vip,
    techSheet: c.tech_sheet ?? {},
    photoPath: c.photo_path,
    photoUrl,
    createdAt: c.created_at,
    history,
  };
}
