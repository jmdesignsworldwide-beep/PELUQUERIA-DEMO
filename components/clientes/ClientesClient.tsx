"use client";

/**
 * CLIENTES — ficha e historial alimentados por la FUENTE ÚNICA del dinero.
 * Cada cobro (desde la cita o manual) alimenta el timeline del cliente:
 * servicio + monto + fecha + profesional. (La ficha completa —notas,
 * cumpleaños— llega en su propia tanda; aquí vive el historial técnico.)
 */

import { useMemo, useState } from "react";
import { Users, Search, Clock } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { formatRD } from "@/lib/money/calc";
import { METHOD_LABEL, Payment } from "@/lib/money/types";
import { initials } from "@/components/citas/data";

type ClientRow = {
  name: string;
  visits: number;
  total: number;
  lastAt: string;
  lastService: string;
};

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-accent-soft/60 font-semibold text-accent"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}

export function ClientesClient() {
  const { skin } = useApp();
  const { payments, ready } = useMoney();
  const [search, setSearch] = useState("");
  const [openName, setOpenName] = useState<string | null>(null);

  const clients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    for (const p of payments) {
      if (p.status !== "pagado") continue;
      const cur =
        map.get(p.clientName) ??
        ({ name: p.clientName, visits: 0, total: 0, lastAt: "", lastService: "" } as ClientRow);
      cur.visits += 1;
      cur.total += p.total;
      if (p.createdAt > cur.lastAt) {
        cur.lastAt = p.createdAt;
        cur.lastService = p.service;
      }
      map.set(p.clientName, cur);
    }
    return Array.from(map.values()).sort((a, b) =>
      b.lastAt.localeCompare(a.lastAt)
    );
  }, [payments]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? clients.filter((c) => c.name.toLowerCase().includes(q)) : clients;
  }, [clients, search]);

  const timeline = useMemo<Payment[]>(() => {
    if (!openName) return [];
    return payments
      .filter((p) => p.clientName === openName && p.status === "pagado")
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [payments, openName]);

  const openClient = clients.find((c) => c.name === openName);

  if (!ready) {
    return (
      <div className="space-y-4">
        <div className="h-10 w-48 animate-pulse rounded-xl bg-surface-2" />
        <div className="h-64 animate-pulse rounded-2xl bg-surface-2/60" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
          <Users size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {skin.vocab.customerPlural}
          </h1>
          <p className="text-xs text-muted">
            {clients.length} con historial · alimentado por los cobros
          </p>
        </div>
      </div>

      <div className="relative">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar ${skin.vocab.customer.toLowerCase()}…`}
          className="w-full rounded-xl border border-border bg-surface-2/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent/60"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
          Aún no hay {skin.vocab.customerPlural.toLowerCase()} con cobros.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {filtered.map((c) => (
            <button
              key={c.name}
              type="button"
              onClick={() => setOpenName(c.name)}
              className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-3 text-left transition-colors hover:border-accent/40 hover:bg-surface-2/60"
            >
              <Avatar name={c.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.name}</p>
                <p className="truncate text-[11px] text-muted">
                  {c.visits} {c.visits === 1 ? "visita" : "visitas"} · última:{" "}
                  {c.lastService}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="tabular text-sm font-semibold">{formatRD(c.total)}</p>
                <p className="text-[11px] text-muted">{fmt(c.lastAt)}</p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Timeline del cliente */}
      <Modal
        open={!!openName}
        onClose={() => setOpenName(null)}
        title={openName ?? ""}
      >
        {openClient && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={openClient.name} size={48} />
              <div className="grid flex-1 grid-cols-2 gap-2">
                <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
                  <p className="font-display text-xl font-semibold tabular">
                    {openClient.visits}
                  </p>
                  <p className="text-[11px] text-muted">visitas</p>
                </div>
                <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
                  <p className="font-display text-xl font-semibold tabular">
                    {formatRD(openClient.total)}
                  </p>
                  <p className="text-[11px] text-muted">gastado</p>
                </div>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                <Clock size={12} /> Historial
              </p>
              <div className="relative space-y-3 pl-4">
                <span className="absolute left-[5px] top-1 h-[calc(100%-0.5rem)] w-px bg-border" />
                {timeline.map((p) => (
                  <div key={p.id} className="relative">
                    <span className="absolute -left-4 top-1.5 h-2 w-2 rounded-full bg-accent" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{p.service}</p>
                        <p className="truncate text-[11px] text-muted">
                          {p.professionalName} · {fmt(p.createdAt)} ·{" "}
                          {p.splits.length > 1
                            ? "Mixto"
                            : METHOD_LABEL[p.splits[0]?.method ?? "efectivo"]}
                        </p>
                      </div>
                      <span className="shrink-0 tabular text-sm font-semibold">
                        {formatRD(p.total)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
