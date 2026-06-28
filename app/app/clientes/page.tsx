"use client";

import { Users } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";
import { useApp } from "@/components/providers/AppProviders";

export default function ClientesPage() {
  const { skin } = useApp();
  return (
    <ComingSoon
      title={skin.vocab.customerPlural}
      icon={Users}
      description={`Ficha de cada ${skin.vocab.customer.toLowerCase()}: historial de visitas, servicios favoritos, notas, contacto y cumpleaños. Se construye en su tanda.`}
    />
  );
}
