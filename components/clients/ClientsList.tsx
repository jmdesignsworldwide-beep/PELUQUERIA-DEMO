"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Search, Star, Phone, ChevronRight } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { formatDateRD, formatRD } from "@/lib/format";
import { formatPhone, digits } from "@/lib/validation";
import { ClientForm } from "./ClientForm";
import { Avatar } from "./Avatar";
import type { ClientListItem } from "@/lib/clients";

type Filter = "todos" | "vip" | "pendiente" | "recientes";

export function ClientsList({ clients }: { clients: ClientListItem[] }) {
  const { skin, businessType } = useApp();
  const v = skin.vocab;
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<Filter>("todos");
  const [creating, setCreating] = useState(false);

  const newLabel =
    businessType === "salon" ? `Nueva ${v.customer}` : `Nuevo ${v.customer}`;

  const recientISO = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const nd = digits(q);
    return clients.filter((c) => {
      if (filter === "vip" && !c.isVip) return false;
      if (filter === "pendiente" && c.balance >= 0) return false;
      if (
        filter === "recientes" &&
        (!c.lastVisitISO || new Date(c.lastVisitISO).getTime() < recientISO)
      )
        return false;
      if (!needle) return true;
      const byName = c.name.toLowerCase().includes(needle);
      const byPhone = nd && c.phone ? c.phone.includes(nd) : false;
      const byCedula = nd && c.cedula ? c.cedula.includes(nd) : false;
      return byName || byPhone || byCedula;
    });
  }, [clients, q, filter, recientISO]);

  const filters: { id: Filter; label: string }[] = [
    { id: "todos", label: "Todas" },
    { id: "vip", label: "VIP" },
    { id: "pendiente", label: "Con balance" },
    { id: "recientes", label: "Recientes" },
  ];

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            {v.customerPlural}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {clients.length} en tu cartera
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus size={18} /> {newLabel}
        </Button>
      </div>

      {/* Búsqueda + filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={17}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, teléfono o cédula…"
            className="h-11 w-full rounded-xl border border-border bg-surface-2/60 pl-10 pr-3.5 text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60"
          />
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                filter === f.id
                  ? "border-accent/50 bg-accent-soft/60 text-accent"
                  : "border-border text-muted hover:text-fg"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted">
          No se encontraron {v.customerPlural.toLowerCase()} con esos criterios.
        </Card>
      ) : (
        <Reveal className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((c) => (
            <RevealItem key={c.id}>
              <Card
                className="cursor-pointer p-4"
                onClick={() => router.push(`/app/clientes/${c.id}`)}
              >
                <div className="flex items-center gap-3">
                  <Avatar name={c.name} photoUrl={c.photoUrl} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate font-medium">{c.name}</p>
                      {c.isVip && (
                        <Star
                          size={13}
                          className="shrink-0 fill-metallic text-metallic"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
                      {c.phone ? (
                        <>
                          <Phone size={11} /> {formatPhone(c.phone)}
                        </>
                      ) : (
                        "Sin teléfono"
                      )}
                    </p>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-muted" />
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
                  <span className="text-muted">
                    {c.lastVisitISO
                      ? `Última visita ${formatDateRD(c.lastVisitISO)}`
                      : "Sin visitas aún"}
                  </span>
                  {c.balance !== 0 && (
                    <span
                      className={cn(
                        "tabular font-medium",
                        c.balance < 0 ? "text-red-500" : "text-emerald-500"
                      )}
                    >
                      {c.balance < 0 ? "Debe " : "A favor "}
                      {formatRD(Math.abs(c.balance))}
                    </span>
                  )}
                </div>
              </Card>
            </RevealItem>
          ))}
        </Reveal>
      )}

      <ClientForm
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
