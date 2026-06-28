"use client";

import { Calculator } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function CajaPage() {
  return (
    <ComingSoon
      title="Caja"
      icon={Calculator}
      description="Apertura y cierre de caja, arqueo del día, movimientos de entrada/salida y reportes. Se construye en su tanda."
    />
  );
}
