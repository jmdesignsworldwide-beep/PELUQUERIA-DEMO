"use client";

/**
 * CONFIGURACIÓN — panel de control del negocio. Las secciones se construyen
 * pieza por pieza en esta tanda. La sección "Cuentas" SOLO existe para admin
 * (el rol se valida también en el servidor en cada acción).
 */

import { Settings, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { LinkReservasCard } from "./LinkReservasCard";
import { CuentasAdmin } from "./CuentasAdmin";
import { MiCuentaCard } from "./MiCuentaCard";
import { DatosNegocioCard } from "./DatosNegocioCard";

export function ConfiguracionClient() {
  const { role, businessName, skin } = useApp();
  const isAdmin = role === "admin";

  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
              <Settings size={20} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Configuración
              </h1>
              <p className="text-xs text-muted">
                {businessName || skin.businessName}
              </p>
            </div>
          </div>
          {isAdmin && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft/40 px-3 py-1 text-xs font-medium text-accent">
              <ShieldCheck size={13} /> Admin
            </span>
          )}
        </div>
      </RevealItem>

      <RevealItem>
        <LinkReservasCard />
      </RevealItem>

      {/* Gestión de cuentas: SOLO admin (también validado en el servidor). */}
      {isAdmin && (
        <RevealItem>
          <CuentasAdmin />
        </RevealItem>
      )}

      <RevealItem>
        <DatosNegocioCard />
      </RevealItem>

      <RevealItem>
        <MiCuentaCard />
      </RevealItem>
    </Reveal>
  );
}
