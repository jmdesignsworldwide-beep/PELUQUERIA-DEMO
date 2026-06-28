"use client";

import { type LucideIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Reveal, RevealItem } from "@/components/ui/Reveal";

/**
 * Placeholder premium para módulos aún no construidos. Ningún botón muerto:
 * cada ruta del sidebar lleva a una pantalla cuidada y viva (con skeletons).
 */
export function ComingSoon({
  title,
  icon: Icon,
  description,
}: {
  title: string;
  icon: LucideIcon;
  description: string;
}) {
  return (
    <Reveal className="space-y-6">
      <RevealItem>
        <div className="flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Icon size={26} />
          </span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight">
              {title}
            </h1>
            <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-border glass px-2.5 py-0.5 text-xs text-muted">
              <Sparkles size={12} className="text-metallic" />
              Próximamente premium
            </span>
          </div>
        </div>
      </RevealItem>

      <RevealItem>
        <p className="max-w-xl text-muted">{description}</p>
      </RevealItem>

      {/* Vista previa "viva" con skeletons elegantes */}
      <RevealItem>
        <Card className="p-6">
          <div className="mb-5 flex items-center justify-between">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-4 rounded-xl border border-border bg-surface-2/40 p-3"
              >
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </Card>
      </RevealItem>
    </Reveal>
  );
}
