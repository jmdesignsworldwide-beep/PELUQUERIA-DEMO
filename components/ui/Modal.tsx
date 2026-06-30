"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Panel de detalle premium. AnimatePresence para entrada/salida,
 * altura máxima + scroll interno (clave para móvil), cierre con Escape,
 * bloqueo de scroll del fondo y backdrop con blur.
 *
 * Se renderiza con un PORTAL a <body>, fuera de la jerarquía de la lista. Así
 * ningún contenedor padre (overflow-hidden, altura fija, o un `transform` de
 * framer-motion que crea bloque contenedor para position:fixed) puede cortarlo:
 * el modal siempre queda centrado en el viewport, completo.
 */
const SIZE_CLASS = {
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  /** Ancho del panel en escritorio. "lg" para formularios amplios. */
  size?: "md" | "lg";
}) {
  // El portal solo existe en el cliente (document disponible tras montar).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6">
          <motion.div
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className={cn(
              "relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden border border-border glass shadow-layered",
              "rounded-t-2xl sm:rounded-2xl",
              SIZE_CLASS[size],
              className
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
              }}
            />
            {(title || true) && (
              <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
                <h2 className="font-display text-lg font-semibold tracking-tight">
                  {title}
                </h2>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="grid h-9 w-9 place-items-center rounded-full text-fg/70 transition-colors hover:bg-surface-2 hover:text-accent"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              {children}
            </div>
            {footer && (
              <div className="border-t border-border px-5 py-4 sm:px-6">{footer}</div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
