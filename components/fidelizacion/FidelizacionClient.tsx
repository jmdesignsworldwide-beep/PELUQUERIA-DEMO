"use client";

/**
 * FIDELIZACIÓN (demo navegable). Puntos por cliente (derivados de sus cobros →
 * coherente con Clientes/Pagos), VIP, cumpleaños del mes, canje de puntos y
 * detalle con historial de puntos. Clic = más info.
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Gift, Star, Crown, Cake, Check } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { fromCents } from "@/lib/money/calc";
import type { Payment } from "@/lib/money/types";
import { initials } from "@/components/citas/data";

function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function birthday(name: string): { month: number; label: string } {
  const h = hash(name);
  const month = (h % 12) + 1;
  const day = (Math.floor(h / 12) % 28) + 1;
  return { month, label: `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}` };
}
function nivelFor(pts: number): { label: string; tone: string } {
  if (pts >= 600) return { label: "Platino", tone: "--st-confirmada" };
  if (pts >= 300) return { label: "Oro", tone: "--st-pendiente" };
  if (pts >= 100) return { label: "Plata", tone: "--st-noshow" };
  return { label: "Bronce", tone: "--metallic" };
}

type Cliente = {
  name: string;
  visits: number;
  total: number;
  puntos: number;
  vip: boolean;
  nivel: { label: string; tone: string };
  cumpleMonth: number;
  cumpleLabel: string;
};

const REWARDS = [
  { pts: 500, premio: "RD$ 250 de descuento" },
  { pts: 1000, premio: "Servicio express gratis" },
  { pts: 2000, premio: "Un servicio a tu elección, gratis" },
  { pts: 3500, premio: "Combo premium (corte + tratamiento)" },
];

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span className="grid shrink-0 place-items-center rounded-full bg-accent-soft/60 font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.36 }} aria-hidden>
      {initials(name)}
    </span>
  );
}

export function FidelizacionClient() {
  const { skin } = useApp();
  const { payments, today } = useMoney();
  const currentMonth = Number(today.split("-")[1]);
  const vocab = skin.vocab;

  const [openName, setOpenName] = useState<string | null>(null);
  const [reward, setReward] = useState<(typeof REWARDS)[number] | null>(null);
  const [canjeado, setCanjeado] = useState(false);

  const clientes = useMemo<Cliente[]>(() => {
    const map = new Map<string, { name: string; visits: number; total: number }>();
    for (const p of payments) {
      if (p.status !== "pagado") continue;
      const c = map.get(p.clientName) ?? { name: p.clientName, visits: 0, total: 0 };
      c.visits += 1; c.total += p.total;
      map.set(p.clientName, c);
    }
    return Array.from(map.values())
      .map((c) => {
        const puntos = Math.floor(fromCents(c.total) / 50);
        const b = birthday(c.name);
        return {
          ...c,
          puntos,
          vip: puntos >= 250 || c.visits >= 6,
          nivel: nivelFor(puntos),
          cumpleMonth: b.month,
          cumpleLabel: b.label,
        };
      })
      .sort((a, b) => b.puntos - a.puntos);
  }, [payments]);

  const vipCount = clientes.filter((c) => c.vip).length;
  const cumpleMes = clientes.filter((c) => c.cumpleMonth === currentMonth);
  const open = clientes.find((c) => c.name === openName) ?? null;

  const historialPuntos = useMemo<{ date: string; service: string; pts: number }[]>(() => {
    if (!openName) return [];
    return payments
      .filter((p) => p.clientName === openName && p.status === "pagado")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((p: Payment) => ({
        date: new Date(p.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short" }),
        service: p.service,
        pts: Math.floor(fromCents(p.subtotal) / 50),
      }));
  }, [payments, openName]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
          <Gift size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Fidelización</h1>
          <p className="text-xs text-muted">{clientes.length} {vocab.customerPlural.toLowerCase()} · {vipCount} VIP</p>
        </div>
      </div>

      {/* Cumpleaños del mes */}
      {cumpleMes.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            <Cake size={13} /> Cumpleaños del mes · 10% de descuento
          </p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {cumpleMes.map((c) => (
              <button key={c.name} type="button" onClick={() => setOpenName(c.name)}
                className="flex shrink-0 items-center gap-2 rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-left transition-colors hover:border-accent/40">
                <Avatar name={c.name} size={32} />
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-[11px] text-muted tabular">{c.cumpleLabel}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Programa de puntos */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Programa de puntos</p>
        <div className="space-y-2">
          {clientes.map((c, i) => (
            <motion.button
              key={c.name}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.22 }}
              onClick={() => setOpenName(c.name)}
              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-3 text-left shadow-soft transition-premium hover:border-accent/40 hover:shadow-pop"
            >
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                  {c.name}
                  {c.vip && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft/40 px-1.5 text-[10px] font-medium text-accent">
                      <Crown size={10} /> VIP
                    </span>
                  )}
                </p>
                <p className="truncate text-[11px] text-muted">{c.visits} visitas · nivel {c.nivel.label}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-base font-semibold text-accent">{c.puntos.toLocaleString("es-DO")}</p>
                <p className="text-[10px] text-muted">puntos</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Canje */}
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Canjear puntos</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {REWARDS.map((r) => (
            <button key={r.pts} type="button" onClick={() => { setReward(r); setCanjeado(false); }}
              className="flex items-center justify-between gap-3 rounded-xl border border-border glass p-3 text-left transition-colors hover:border-accent/40">
              <div>
                <p className="text-sm font-medium">{r.premio}</p>
                <p className="text-[11px] text-muted">{r.pts.toLocaleString("es-DO")} puntos</p>
              </div>
              <Star size={16} className="shrink-0 text-accent" />
            </button>
          ))}
        </div>
      </div>

      {/* Detalle cliente */}
      <Modal open={!!open} onClose={() => setOpenName(null)} title={open?.name ?? ""}>
        {open && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={open.name} size={48} />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
                  <p className="font-display text-xl font-semibold tabular text-accent">{open.puntos.toLocaleString("es-DO")}</p>
                  <p className="text-[11px] text-muted">puntos</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
                  <p className="font-display text-base font-semibold" style={{ color: `rgb(var(${open.nivel.tone}))` }}>{open.nivel.label}</p>
                  <p className="text-[11px] text-muted">nivel{open.vip ? " · VIP" : ""}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm">
              <Cake size={15} className="text-accent" />
              <span className="text-muted">Cumpleaños</span>
              <span className="ml-auto font-medium tabular">{open.cumpleLabel}</span>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Historial de puntos</p>
              <div className="overflow-hidden rounded-xl border border-border">
                {historialPuntos.map((h, i) => (
                  <div key={i} className={cn("flex items-center justify-between px-3 py-2 text-sm", i > 0 && "border-t border-border")}>
                    <span className="tabular text-muted">{h.date}</span>
                    <span className="min-w-0 flex-1 truncate px-2">{h.service}</span>
                    <span className="tabular font-medium text-accent">+{h.pts}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Canje (visual) */}
      <Modal open={!!reward} onClose={() => setReward(null)} title={canjeado ? "" : "Canjear puntos"}>
        {reward && (
          canjeado ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow"><Check size={32} strokeWidth={3} /></span>
              <p className="mt-3 font-display text-xl font-semibold">¡Canje registrado!</p>
              <p className="mt-1 text-sm text-muted">{reward.premio}</p>
              <Button className="mt-5" fullWidth onClick={() => setReward(null)}>Listo</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-surface-2/40 p-4 text-center">
                <p className="font-display text-lg font-semibold">{reward.premio}</p>
                <p className="mt-1 text-sm text-muted">Cuesta {reward.pts.toLocaleString("es-DO")} puntos</p>
              </div>
              <Button fullWidth onClick={() => setCanjeado(true)}>Canjear</Button>
              <p className="text-center text-[11px] text-muted">Demo: el canje es de muestra.</p>
            </div>
          )
        )}
      </Modal>
    </div>
  );
}
