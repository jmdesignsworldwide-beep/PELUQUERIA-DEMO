import { getClients } from "@/lib/clients";
import { ClientsList } from "@/components/clients/ClientsList";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const clients = await getClients();
  return <ClientsList clients={clients} />;
}
