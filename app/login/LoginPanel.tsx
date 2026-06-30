"use client";

/**
 * LOGIN PREMIUM — primera impresión (sello JM Designs). Aurora que respira,
 * monograma con glow + hairline metálico, jerarquía tipográfica con presencia,
 * card glass-strong y entrada animada suave. Respeta prefers-reduced-motion.
 */

import { motion } from "framer-motion";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LoginForm } from "./LoginForm";

export function LoginPanel({ aviso }: { aviso: string | null }) {
  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-10">
      <AuroraBackground />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        {aviso && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgb(var(--st-cancelada) / 0.45)",
              background: "rgb(var(--st-cancelada) / 0.12)",
              color: "rgb(var(--st-cancelada))",
            }}
          >
            {aviso}
          </div>
        )}

        {/* Marca JM */}
        <div className="mb-8 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 17, delay: 0.06 }}
            className="glow-warm relative mb-5 grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-2xl bg-accent text-accent-contrast"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.7), transparent)",
              }}
            />
            <span className="font-display text-2xl font-semibold tracking-tight">
              JM
            </span>
          </motion.div>
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight">
            Sistema de Gestión
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted">
            Bienvenida. Entra con tu usuario y contraseña.
          </p>
        </div>

        {/* Card de acceso */}
        <div className="relative overflow-hidden rounded-2xl border border-border glass-strong p-6 shadow-layered sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
            }}
          />
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs text-muted">
          Acceso privado · JM Designs
        </p>
      </motion.div>
    </main>
  );
}
