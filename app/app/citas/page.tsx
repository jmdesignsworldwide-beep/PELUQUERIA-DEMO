import { getAgendaData } from "@/lib/agenda";
import { AgendaView } from "@/components/agenda/AgendaView";

export const dynamic = "force-dynamic";

export default async function CitasPage({
  searchParams,
}: {
  searchParams: { date?: string };
}) {
  const data = await getAgendaData(searchParams.date);
  if (!data) {
    return <p className="text-muted">No se pudo cargar la agenda.</p>;
  }
  return <AgendaView data={data} />;
}
