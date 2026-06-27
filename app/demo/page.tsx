"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Check,
  Scissors,
  Sparkles,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { KpiNumber } from "@/components/ui/KpiNumber";
import { Reveal } from "@/components/ui/Reveal";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { BusinessType } from "@/lib/skins";

function SkinSwitcher() {
  const { businessType, setBusinessType } = useApp();
  const options: { id: BusinessType; label: string; icon: typeof Scissors }[] = [
    { id: "salon", label: "Salón", icon: Sparkles },
    { id: "barberia", label: "Barbería", icon: Scissors },
  ];
  return (
    <div className="relative flex rounded-full border border-border glass p-1">
      {options.map((o) => {
        const active = businessType === o.id;
        const Icon = o.icon;
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => setBusinessType(o.id)}
            className="relative z-10 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium"
          >
            {active && (
              <motion.span
                layoutId="skin-pill"
                className="absolute inset-0 -z-10 rounded-full bg-accent shadow-glow"
                transition={{ type: "spring", stiffness: 360, damping: 30 }}
              />
            )}
            <Icon
              size={15}
              className={active ? "text-accent-contrast" : "text-muted"}
            />
            <span className={active ? "text-accent-contrast" : "text-muted"}>
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function DemoPage() {
  const { skin } = useApp();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const kpis = [
    { label: `${skin.vocab.customerPlural} activas`, value: 248, icon: Users },
    { label: "Citas hoy", value: 17, icon: CalendarDays, suffix: "" },
    {
      label: "Ingresos del día",
      value: 28450,
      icon: Wallet,
      prefix: "RD$ ",
    },
  ];

  return (
    <main className="relative min-h-dvh">
      <AuroraBackground />

      <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* barra superior */}
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-accent text-accent-contrast shadow-glow">
              <span className="font-display text-lg font-semibold">
                {skin.monogram}
              </span>
            </div>
            <div>
              <p className="font-display text-xl font-semibold leading-none tracking-tight">
                {skin.businessName}
              </p>
              <p className="mt-1 text-xs text-muted">{skin.label} · Demo de primitivos</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <SkinSwitcher />
            <ThemeToggle />
          </div>
        </header>

        {/* título */}
        <Reveal className="mb-10 space-y-3">
          <Reveal.Item>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs text-muted">
              <Sparkles size={13} className="text-metallic" />
              Sistema de diseño bi-piel
            </span>
          </Reveal.Item>
          <Reveal.Item>
            <h1 className="max-w-2xl font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
              Una sola plataforma,{" "}
              <span className="text-accent">dos pieles</span> que se visten solas.
            </h1>
          </Reveal.Item>
          <Reveal.Item>
            <p className="max-w-xl text-muted">
              Cambia entre Salón y Barbería arriba a la derecha, y alterna el
              tema claro/oscuro. Todo lo de abajo usa los mismos componentes:
              solo cambian los tokens.
            </p>
          </Reveal.Item>
        </Reveal>

        {/* KPIs */}
        <Reveal className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Reveal.Item key={k.label}>
                <Card className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm text-muted">{k.label}</span>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-accent">
                      <Icon size={17} />
                    </span>
                  </div>
                  <KpiNumber
                    value={k.value}
                    prefix={k.prefix}
                    className="font-display text-3xl font-semibold"
                  />
                </Card>
              </Reveal.Item>
            );
          })}
        </Reveal>

        {/* botones + vocabulario */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-1 font-display text-lg font-semibold">Botones</h3>
            <p className="mb-5 text-sm text-muted">
              Primario, secundario y ghost — con glow en el activo.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                onClick={() => {
                  setLoading(true);
                  setTimeout(() => setLoading(false), 1400);
                }}
                loading={loading}
              >
                <Check size={16} /> Primario
              </Button>
              <Button variant="secondary">Secundario</Button>
              <Button variant="ghost">Ghost</Button>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-1 font-display text-lg font-semibold">
              Vocabulario por piel
            </h3>
            <p className="mb-5 text-sm text-muted">
              El mismo dato, distinta palabra según la piel.
            </p>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-muted">Profesional</dt>
                <dd className="mt-1 font-display text-xl font-semibold text-accent">
                  {skin.vocab.professional}
                </dd>
              </div>
              <div>
                <dt className="text-muted">Persona atendida</dt>
                <dd className="mt-1 font-display text-xl font-semibold text-accent">
                  {skin.vocab.customer}
                </dd>
              </div>
            </dl>
          </Card>
        </div>

        {/* modal + skeleton */}
        <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="mb-1 font-display text-lg font-semibold">
              Panel de detalle
            </h3>
            <p className="mb-5 text-sm text-muted">
              AnimatePresence, scroll interno y bien anclado en móvil.
            </p>
            <Button variant="secondary" onClick={() => setOpen(true)}>
              Abrir panel
            </Button>
          </Card>

          <Card className="p-6">
            <h3 className="mb-1 font-display text-lg font-semibold">
              Carga elegante
            </h3>
            <p className="mb-5 text-sm text-muted">Skeletons con shimmer.</p>
            <div className="space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex gap-3 pt-1">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* tipografía */}
        <Card className="p-6 sm:p-8">
          <p className="mb-2 text-xs uppercase tracking-[0.2em] text-muted">
            Tipografía
          </p>
          <p className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">
            {skin.businessName}
          </p>
          <p className="mt-3 max-w-xl text-muted">
            Fraunces para títulos con presencia editorial; Inter para el cuerpo,
            legible y neutral. Los números usan{" "}
            <span className="tabular text-fg">tabular-nums</span> para que
            RD$&nbsp;<span className="tabular text-fg">1,234.00</span> nunca
            baile.
          </p>
        </Card>

        <footer className="mt-12 text-center text-xs text-muted">
          Tanda 1 · Cimientos · Sistema de diseño bi-piel
        </footer>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Detalle de ejemplo"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => setOpen(false)}>
              <Check size={16} /> Confirmar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Este panel demuestra el primitivo <code>&lt;Modal&gt;</code>: entra
            con spring, bloquea el scroll del fondo, cierra con Escape o tocando
            fuera, y en móvil se ancla abajo con scroll interno.
          </p>
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-xl border border-border bg-surface-2/50 px-4 py-3"
            >
              <span className="text-sm">
                {skin.vocab.professional} #{i + 1}
              </span>
              <span className="tabular text-sm text-accent">
                RD$ {((i + 1) * 850).toLocaleString("es-DO")}
              </span>
            </div>
          ))}
        </div>
      </Modal>
    </main>
  );
}
