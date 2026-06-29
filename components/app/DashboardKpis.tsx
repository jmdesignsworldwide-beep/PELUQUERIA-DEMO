"use client";

/**
 * KPIs del Dashboard EN VIVO — leen la fuente única del dinero (y la agenda)
 * para que el panel refleje el organismo: citas de hoy, cobros, ingresos y
 * propinas del día. Cada tarjeta enlaza a su módulo.
 */

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, Wallet, Receipt, Coins } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { KpiNumber } from "@/components/ui/KpiNumber";
import { fromCents } from "@/lib/money/calc";
import { dayIncome, dayTips, paymentsOn } from "@/lib/money/selectors";
import { professionalsFor, appointmentsFor } from "@/components/citas/data";

export function DashboardKpis() {
  const { businessType } = useApp();
  const { payments, today, ready } = useMoney();

  const citasHoy = useMemo(
    () =>
      professionalsFor(businessType).reduce(
        (n, p) => n + appointmentsFor(businessType, p.id, today).length,
        0
      ),
    [businessType, today]
  );

  const ingresos = dayIncome(payments, today);
  const cobros = paymentsOn(payments, today).length;
  const propinas = dayTips(payments, today);

  const cards = [
    {
      label: "Citas de hoy",
      icon: CalendarDays,
      value: citasHoy,
      href: "/app/citas",
    },
    {
      label: "Cobros de hoy",
      icon: Receipt,
      value: cobros,
      href: "/app/pagos",
    },
    {
      label: "Ingresos del día",
      icon: Wallet,
      value: fromCents(ingresos),
      prefix: "RD$ ",
      href: "/app/caja",
      highlight: true,
    },
    {
      label: "Propinas del día",
      icon: Coins,
      value: fromCents(propinas),
      prefix: "RD$ ",
      href: "/app/caja",
    },
  ];

  if (!ready) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="h-28 animate-pulse rounded-2xl bg-surface-2/60"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <Link
            key={c.label}
            href={c.href}
            className="group relative overflow-hidden rounded-2xl border border-border glass p-5 shadow-layered transition-colors hover:border-accent/40"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
              }}
            />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-muted">{c.label}</span>
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-accent">
                <Icon size={17} />
              </span>
            </div>
            <KpiNumber
              value={c.value}
              prefix={c.prefix}
              className={
                "font-display text-3xl font-semibold" +
                (c.highlight ? " text-accent" : "")
              }
            />
          </Link>
        );
      })}
    </div>
  );
}
