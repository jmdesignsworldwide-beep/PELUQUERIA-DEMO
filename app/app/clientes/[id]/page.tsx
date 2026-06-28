import { notFound } from "next/navigation";
import { getClient } from "@/lib/clients";
import { ClientDetail } from "@/components/clients/ClientDetail";

export const dynamic = "force-dynamic";

export default async function ClientePage({
  params,
}: {
  params: { id: string };
}) {
  const client = await getClient(params.id);
  if (!client) notFound();
  return <ClientDetail client={client} />;
}
