"use client";

import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function CitasPage() {
  return (
    <ComingSoon
      title="Citas"
      icon={CalendarDays}
      description="Agenda con vista de día y semana, reprogramar arrastrando, estados (confirmada, en curso, completada) y recordatorios. Se construye en su tanda."
    />
  );
}
