"use client";

import { LogOut } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { signOut } from "./actions";

/**
 * Chrome temporal del área autenticada (header + fondo). El layout base
 * completo con sidebar→hamburguesa llega en la próxima sub-pieza (8.5).
 * Aquí lo importante: demostrar que la piel quedó amarrada a la cuenta.
 */
export function AppChrome({
  businessName,
  username,
  children,
}: {
  businessName: string;
  username: string;
  children: React.ReactNode;
}) {
  const { skin } = useApp();

  return (
    <div className="relative min-h-dvh">
      <AuroraBackground />

      <header className="sticky top-0 z-30 border-b border-border glass">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-accent text-accent-contrast shadow-glow">
              <span className="font-display text-base font-semibold">
                {skin.monogram}
              </span>
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-semibold tracking-tight">
                {businessName}
              </p>
              <p className="text-xs text-muted">{skin.label}</p>
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

      <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {children}
      </main>
    </div>
  );
}
