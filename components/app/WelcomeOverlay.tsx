"use client";

/**
 * BIENVENIDA CINEMATOGRÁFICA (sello JM Designs). Al entrar en el día aparece un
 * momento de bienvenida breve y premium antes del dashboard — bi-piel, con
 * temática de cabello/belleza:
 *  · Salón → tijera de estilista (logo de piel).
 *  · Barbería → navaja clásica (logo de piel).
 * Flujo: monograma JM + logo de piel → nombre del negocio → entrada.
 * Breve (~2.6s), skippable (toca para entrar) y se muestra UNA vez por día.
 * Respeta prefers-reduced-motion: si está activo, no aparece (entrada directa).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BrandMark } from "@/components/brand/BrandMark";

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

const EASE = [0.16, 1, 0.3, 1] as const;

export function WelcomeOverlay() {
  const { skin, businessType, username } = useApp();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // prefers-reduced-motion → entrada directa, sin bienvenida animada.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const key = `jmbeauty:welcome:${username || "user"}:${todayKey()}`;
    try {
      if (localStorage.getItem(key)) return; // ya se mostró hoy
      localStorage.setItem(key, "1");
    } catch {
      /* sin storage → se muestra esta vez */
    }
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [username]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="welcome"
          role="dialog"
          aria-label={`Bienvenida a ${skin.businessName}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          onClick={() => setShow(false)}
          className="fixed inset-0 z-[70] grid cursor-pointer place-items-center overflow-hidden"
        >
          <AuroraBackground />
          <div className="absolute inset-0 bg-bg/45 backdrop-blur-md" />

          <div className="relative flex flex-col items-center px-6 text-center">
            {/* Monograma */}
            <motion.div
              initial={{ scale: 0.82, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 18 }}
              className="relative grid h-20 w-20 place-items-center overflow-hidden rounded-3xl bg-accent text-accent-contrast shadow-glow"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.75), transparent)",
                }}
              />
              <span className="font-display text-3xl font-semibold tracking-tight">
                {skin.monogram}
              </span>
            </motion.div>

            {/* Logo de piel (complementa el monograma) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 220, damping: 16 }}
              className="mt-6 grid h-14 w-14 place-items-center rounded-2xl border border-border glass text-accent shadow-soft"
            >
              <BrandMark businessType={businessType} size={30} />
            </motion.div>

            {/* Nombre del negocio */}
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55, duration: 0.55, ease: EASE }}
              className="mt-7 text-balance font-display text-3xl font-semibold tracking-tight sm:text-4xl"
            >
              {skin.businessName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.5 }}
              className="mt-2 text-[11px] uppercase tracking-[0.24em] text-muted"
            >
              {skin.label}
            </motion.p>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-9 text-[11px] uppercase tracking-[0.18em] text-muted"
            >
              Toca para entrar
            </motion.span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
