"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, Menu, X } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { NAV_ITEMS } from "./nav";
import { signOut } from "@/app/app/actions";

function Brand() {
  const { skin } = useApp();
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-contrast shadow-glow">
        <span className="font-display text-base font-semibold">
          {skin.monogram}
        </span>
      </div>
      <div className="leading-tight">
        <p className="font-display text-base font-semibold tracking-tight">
          {skin.businessName}
        </p>
        <p className="text-xs text-muted">{skin.label}</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const { skin } = useApp();
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        const active =
          item.href === "/app"
            ? pathname === "/app"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-accent-soft/60 font-medium text-accent"
                : "text-muted hover:bg-surface-2 hover:text-fg"
            )}
          >
            {active && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-accent"
              />
            )}
            <Icon
              size={18}
              className={cn(
                "shrink-0 transition-colors",
                active ? "text-accent" : "text-muted group-hover:text-fg"
              )}
            />
            <span>{item.label(skin.vocab)}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBody({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-2 pt-2">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto">
        <NavLinks onNavigate={onNavigate} />
      </div>
      <p className="px-3 text-[11px] text-muted">
        Tanda 1 · Demo · JM Beauty
      </p>
    </div>
  );
}

export function AppShell({
  username,
  children,
}: {
  username: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // La agenda ocupa exactamente la pantalla (scroll interno de la rejilla);
  // el resto de módulos usan el scroll normal del documento.
  const isCitas = pathname.startsWith("/app/citas");

  // Cerrar el drawer al cambiar de ruta (nunca quedar atrapada).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Bloquear scroll del fondo + cerrar con Escape cuando el drawer está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="relative min-h-dvh">
      <AuroraBackground />

      {/* Sidebar fijo en escritorio */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border glass lg:block">
        <SidebarBody />
      </aside>

      {/* Drawer móvil */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 w-[82%] max-w-xs border-r border-border glass lg:hidden"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar menú"
                className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-accent"
              >
                <X size={18} />
              </button>
              <SidebarBody onNavigate={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Columna principal */}
      <div
        className={cn(
          "flex flex-col lg:pl-64",
          isCitas ? "h-dvh overflow-hidden" : "min-h-dvh"
        )}
      >
        <header className="sticky top-0 z-20 border-b border-border glass">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
                className="grid h-10 w-10 place-items-center rounded-xl border border-border glass text-fg/80 transition-colors hover:text-accent lg:hidden"
              >
                <Menu size={18} />
              </button>
              {/* En móvil mostramos la marca en el header; en escritorio ya está en el sidebar */}
              <div className="lg:hidden">
                <Brand />
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <span className="hidden text-sm text-muted sm:inline">
                @{username}
              </span>
              <ThemeToggle />
              <form action={signOut}>
                <Button variant="secondary" size="sm" type="submit">
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Salir</span>
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main
          className={cn(
            "w-full flex-1",
            // La agenda ocupa toda la pantalla (alto y ancho); Pagos y Caja
            // usan un ancho amplio para tablas/tableros; el resto, lectura
            // cómoda centrada.
            isCitas
              ? "flex min-h-0 flex-col p-3 sm:p-4"
              : pathname.startsWith("/app/pagos") ||
                pathname.startsWith("/app/caja")
              ? "mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10"
              : "mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
