"use client";

/**
 * BIENVENIDA CINEMATOGRÁFICA (sello JM Designs). Al entrar en el día aparece un
 * momento de bienvenida breve y premium antes del dashboard — bi-piel, con
 * temática de cabello/belleza:
 *  · Salón → hebras de cabello fluyendo + destellos dorados champagne.
 *  · Barbería → poste de barbero + líneas de fade + tijera.
 * Flujo: monograma JM → motivo temático → nombre del negocio → entrada.
 * Breve (~2.6s), skippable (toca para entrar) y se muestra UNA vez por día.
 * Respeta prefers-reduced-motion: si está activo, no aparece (entrada directa).
 */

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";

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

            {/* Motivo temático */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.5 }}
              className="mt-7 text-accent"
            >
              {businessType === "salon" ? <SalonMotif /> : <BarberiaMotif />}
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

/* ── Motivo SALÓN: hebras de cabello fluyendo + destellos champagne ── */
function SalonMotif() {
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 160 64" className="h-16 w-auto" fill="none" aria-hidden>
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M8 ${22 + i * 9} C 48 ${6 + i * 9}, 92 ${42 + i * 7}, 152 ${18 + i * 9}`}
            stroke="currentColor"
            strokeOpacity={0.6 - i * 0.13}
            strokeWidth={1.6}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.16, duration: 0.95, ease: "easeInOut" }}
          />
        ))}
        {([
          [44, 12],
          [118, 48],
          [86, 9],
        ] as const).map(([x, y], i) => (
          <motion.path
            key={`s${i}`}
            d={`M${x} ${y - 3.5} L${x} ${y + 3.5} M${x - 3.5} ${y} L${x + 3.5} ${y}`}
            stroke="rgb(var(--metallic))"
            strokeWidth={1.4}
            strokeLinecap="round"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1 + i * 0.16, type: "spring", stiffness: 300, damping: 13 }}
            style={{ transformOrigin: `${x}px ${y}px` }}
          />
        ))}
      </svg>
    </div>
  );
}

/* ── Motivo BARBERÍA: poste de barbero + líneas de fade + tijera ── */
function BarberiaMotif() {
  return (
    <div className="flex items-center gap-4">
      {/* líneas de fade */}
      <svg viewBox="0 0 64 64" className="h-16 w-16" fill="none" aria-hidden>
        {[0, 1, 2, 3].map((i) => (
          <motion.line
            key={i}
            x1={6}
            y1={14 + i * 12}
            x2={58}
            y2={14 + i * 12}
            stroke="currentColor"
            strokeOpacity={0.2 + i * 0.13}
            strokeWidth={1.3}
            strokeDasharray="2 6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: 0.3 + i * 0.13, duration: 0.8, ease: "easeInOut" }}
          />
        ))}
      </svg>

      {/* poste de barbero */}
      <motion.div
        initial={{ scaleY: 0.6, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: 0.4, type: "spring", stiffness: 240, damping: 18 }}
        className="relative h-16 w-5 overflow-hidden rounded-full border border-border shadow-soft"
        style={{ background: "rgb(var(--surface))" }}
      >
        <div
          aria-hidden
          className="absolute inset-0 animate-barberpole"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, rgb(var(--accent)) 0 7px, transparent 7px 14px, rgb(var(--metallic)) 14px 21px, transparent 21px 28px)",
            backgroundSize: "100% 28px",
            opacity: 0.85,
          }}
        />
      </motion.div>

      {/* tijera */}
      <motion.div
        initial={{ opacity: 0, rotate: -12 }}
        animate={{ opacity: 1, rotate: 0 }}
        transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 16 }}
      >
        <Scissors size={28} className="text-accent" />
      </motion.div>
    </div>
  );
}
