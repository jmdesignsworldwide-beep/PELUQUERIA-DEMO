"use client";

/** PROVEEDORES (demo navegable). Lista + detalle con órdenes de compra. */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Truck, Plus, Phone, Package, ChevronRight } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  Supplier,
  productsFor,
  suppliersFor,
  supplierOrders,
} from "@/lib/catalog/products";

function rd(p: number) {
  return `RD$ ${p.toLocaleString("es-DO")}`;
}
const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";

const ORDER_TONE: Record<string, string> = {
  Recibida: "--st-completada",
  "En tránsito": "--st-confirmada",
  Pendiente: "--st-pendiente",
};

export function ProveedoresClient() {
  const { businessType, skin } = useApp();
  const [items, setItems] = useState<Supplier[]>(() => suppliersFor(businessType));
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => setItems(suppliersFor(businessType)), [businessType]);

  const detail = items.find((s) => s.id === detailId) ?? null;
  const productsBySupplier = useMemo(() => {
    if (!detail) return [];
    return productsFor(businessType).filter((p) => p.supplierId === detail.id);
  }, [detail, businessType]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Truck size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Proveedores</h1>
            <p className="text-xs text-muted">{items.length} proveedores · {skin.label}</p>
          </div>
        </div>
        <Button onClick={() => setAdding(true)}><Plus size={16} /> Proveedor</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {items.map((s, i) => (
          <motion.button
            key={s.id}
            type="button"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.22 }}
            onClick={() => setDetailId(s.id)}
            className="group flex items-center gap-3 rounded-2xl border border-border glass p-4 text-left shadow-layered transition-colors hover:border-accent/40"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-2 text-accent"><Truck size={18} /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base font-semibold tracking-tight">{s.name}</p>
              <p className="truncate text-[11px] text-muted">{s.surte}</p>
              <p className="mt-1 flex items-center gap-1 text-[11px] text-muted tabular"><Phone size={11} /> {s.phone}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="tabular text-sm font-semibold">{rd(s.totalBought)}</p>
              <p className="text-[10px] text-muted">últ. {s.lastPurchase}</p>
            </div>
            <ChevronRight size={16} className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        ))}
      </div>

      <Modal open={!!detail} onClose={() => setDetailId(null)} title={detail?.name ?? ""}>
        {detail && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><Phone size={12} /> Contacto</p>
                <p className="text-sm font-medium tabular">{detail.phone}</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Total comprado</p>
                <p className="font-display text-lg font-semibold tabular">{rd(detail.totalBought)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted"><Package size={12} /> Productos que surte</p>
              {productsBySupplier.length === 0 ? (
                <p className="text-sm text-muted">{detail.surte}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {productsBySupplier.map((p) => (
                    <span key={p.id} className="rounded-full border border-border bg-surface-2/40 px-2.5 py-1 text-xs">{p.name}</span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Órdenes de compra</p>
              <div className="overflow-hidden rounded-xl border border-border">
                {supplierOrders(detail).map((o, i) => (
                  <div key={o.id} className={cn("flex items-center justify-between px-3 py-2 text-sm", i > 0 && "border-t border-border")}>
                    <span className="tabular text-muted">{o.id}</span>
                    <span className="tabular text-[11px] text-muted">{o.date}</span>
                    <span className="tabular font-medium">{rd(o.total)}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: `rgb(var(${ORDER_TONE[o.estado] ?? "--st-noshow"}))`, background: `rgb(var(${ORDER_TONE[o.estado] ?? "--st-noshow"}) / 0.12)` }}>{o.estado}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <AddSupplierModal open={adding} onClose={() => setAdding(false)} onAdd={(s) => { setItems((p) => [s, ...p]); setAdding(false); }} />
    </div>
  );
}

function AddSupplierModal({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (s: Supplier) => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [surte, setSurte] = useState("");
  useEffect(() => { if (open) { setName(""); setPhone(""); setSurte(""); } }, [open]);
  const valid = name.trim() && phone.trim();
  return (
    <Modal open={open} onClose={onClose} title="Nuevo proveedor">
      <div className="space-y-3">
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej. Beauty Import RD" /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Teléfono</span>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={cn(inputCls, "tabular")} placeholder="809-555-0000" /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Qué surte</span>
          <input value={surte} onChange={(e) => setSurte(e.target.value)} className={inputCls} placeholder="Ej. Tintes y color" /></label>
        <Button fullWidth disabled={!valid} onClick={() => onAdd({ id: `nuevo-${Date.now()}`, name: name.trim(), phone: phone.trim(), surte: surte.trim() || "Varios", lastPurchase: "—", totalBought: 0 })}>Agregar proveedor</Button>
        <p className="text-center text-[11px] text-muted">Demo: se agrega al instante (no persiste al recargar).</p>
      </div>
    </Modal>
  );
}
