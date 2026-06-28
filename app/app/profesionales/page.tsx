"use client";

import { Scissors } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";
import { useApp } from "@/components/providers/AppProviders";

export default function ProfesionalesPage() {
  const { skin } = useApp();
  return (
    <ComingSoon
      title={skin.vocab.professionalPlural}
      icon={Scissors}
      description={`Gestión de ${skin.vocab.professionalPlural.toLowerCase()}: horarios, servicios que ofrece cada quien, comisiones y desempeño. Se construye en su tanda.`}
    />
  );
}
