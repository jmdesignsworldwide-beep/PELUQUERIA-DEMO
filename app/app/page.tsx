import { getDashboardData } from "@/lib/dashboard";
import { DashboardView } from "@/components/dashboard/DashboardView";

export const dynamic = "force-dynamic";

export default async function AppHome() {
  const data = await getDashboardData();

  if (!data) {
    return (
      <p className="text-muted">
        No se pudieron cargar los datos del panel. Recarga la página.
      </p>
    );
  }

  return <DashboardView data={data} />;
}
