"use client";

import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/app/ComingSoon";

export default function PagosPage() {
  return (
    <ComingSoon
      title="Pagos"
      icon={Wallet}
      description="Cobros en efectivo, transferencia (con voucher), tarjeta y propinas. NCF/ITBIS 18% simulados con su disclaimer. Se construye en su tanda."
    />
  );
}
