"use client";

import { Sparkles } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function ServiciosPage() {
  return (
    <ComingSoon
      title="Servicios"
      icon={Sparkles}
      description="Catálogo de servicios con precios en RD$ y variantes por largo de cabello (corto / mediano / largo). Se precarga según la piel del negocio. Se construye en su tanda."
    />
  );
}
