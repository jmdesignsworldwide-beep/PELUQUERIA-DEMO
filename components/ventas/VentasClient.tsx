"use client";

/**
 * VENTA DE PRODUCTOS (demo). Catálogo vendible; registrar una venta escribe en
 * la FUENTE ÚNICA del dinero (source "producto") → aparece en Caja (ingresos
 * por productos) y en Pagos. Historial leído de los pagos. Coherente.
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Minus, Plus, Sparkles, Check } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney } from "@/components/providers/MoneyProvider";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { toCents, formatRD } from "@/lib/money/calc";
import { METHOD_LABEL, METHODS, PaymentMethod } from "@/lib/money/types";
import { Product, sellableProducts } from "@/lib/catalog/products";

function rd(p: number) {
  return `RD$ ${p.toLocaleString("es-DO")}`;
}

const RECS: Record<string, string> = {
  salon: "Después de una keratina, recomienda Shampoo sin sal para mantener el alisado.",
  barberia: "Después de un corte + barba, recomienda Aceite de barba para mantener la forma.",
};

export function VentasClient() {
  const { businessType, skin } = useApp();
  const { payments, addPayment, today } = useMoney();
  const products = useMemo(() => sellableProducts(businessType), [businessType]);
  const [sel, setSel] = useState<Product | null>(null);

  const ventas = useMemo(
    () =>
      payments
        .filter((p) => p.source === "producto" && p.status === "pagado")
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [payments]
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
          <ShoppingBag size={20} />
        </span>
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">Venta de productos</h1>
          <p className="text-xs text-muted">Venta directa al cliente · {skin.label}</p>
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm text-muted">
        <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
        {RECS[businessType]}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Catálogo</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p, i) => (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.25), duration: 0.22 }}
              onClick={() => setSel(p)}
              className="group flex items-center justify-between gap-3 rounded-2xl border border-border glass p-4 text-left shadow-soft transition-premium hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop sm:p-5"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{p.name}</p>
                <p className="truncate text-[11px] text-muted">{p.brand} · stock {p.stock}</p>
              </div>
              <span className="shrink-0 font-display text-base font-semibold tabular">{rd(p.price)}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">Ventas recientes</p>
        {ventas.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted">
            Aún no hay ventas de productos. Toca un producto para registrar una.
          </div>
        ) : (
          <div className="space-y-2">
            {ventas.slice(0, 12).map((v) => (
              <div key={v.id} className="flex items-center justify-between rounded-xl border border-border bg-surface-2/30 px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{v.service}</p>
                  <p className="truncate text-[11px] text-muted">{v.clientName} · {new Date(v.createdAt).toLocaleDateString("es-DO", { day: "2-digit", month: "short" })}</p>
                </div>
                <span className="tabular text-sm font-semibold">{formatRD(v.total)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <VentaModal
        product={sel}
        onClose={() => setSel(null)}
        onSell={(method, qty, cliente) => {
          if (!sel) return;
          const totalCents = toCents(sel.price * qty);
          addPayment({
            source: "producto",
            clientName: cliente.trim() || "Cliente de mostrador",
            service: `${sel.name}${qty > 1 ? ` ×${qty}` : ""}`,
            professionalId: "mostrador",
            professionalName: "Mostrador",
            date: today,
            serviceAmount: totalCents,
            discount: 0,
            subtotal: totalCents,
            itbis: 0,
            tip: 0,
            total: totalCents,
            commission: 0,
            commissionPct: 0,
            splits: [{ method, amount: totalCents }],
          });
          // No cerramos aquí: el modal muestra el éxito y "Listo" cierra.
        }}
      />
    </div>
  );
}

function VentaModal({
  product,
  onClose,
  onSell,
}: {
  product: Product | null;
  onClose: () => void;
  onSell: (method: PaymentMethod, qty: number, cliente: string) => void;
}) {
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<PaymentMethod>("efectivo");
  const [cliente, setCliente] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (product) { setQty(1); setMethod("efectivo"); setCliente(""); setDone(false); }
  }, [product]);

  if (!product) return null;
  const total = product.price * qty;

  return (
    <Modal open={!!product} onClose={onClose} title={done ? "" : "Registrar venta"}>
      {done ? (
        <div className="flex flex-col items-center py-6 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow">
            <Check size={32} strokeWidth={3} />
          </span>
          <p className="mt-3 font-display text-xl font-semibold">¡Venta registrada!</p>
          <p className="mt-1 text-sm text-muted">Se sumó a la caja del día.</p>
          <Button className="mt-5" fullWidth onClick={onClose}>Listo</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-2/40 p-3">
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted">{product.brand} · {rd(product.price)} c/u</p>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">Cantidad</span>
            <div className="flex items-center gap-3">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-accent"><Minus size={15} /></button>
              <span className="w-6 text-center tabular text-lg font-semibold">{qty}</span>
              <button type="button" onClick={() => setQty((q) => q + 1)} className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted hover:text-accent"><Plus size={15} /></button>
            </div>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted">Cliente (opcional)</span>
            <input value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Cliente de mostrador" className="w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm outline-none focus:border-accent/60" />
          </label>

          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted">Método de pago</span>
            <div className="grid grid-cols-3 gap-1.5">
              {METHODS.map((m) => (
                <button key={m} type="button" onClick={() => setMethod(m)} className={cn("rounded-xl border px-2 py-2 text-xs font-medium transition-colors", method === m ? "border-accent bg-accent-soft/50 text-accent" : "border-border text-muted hover:text-fg")}>
                  {METHOD_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-border pt-3">
            <span className="text-sm text-muted">Total</span>
            <span className="font-display text-2xl font-semibold tabular">{rd(total)}</span>
          </div>

          <Button fullWidth size="lg" onClick={() => { onSell(method, qty, cliente); setDone(true); }}>
            Cobrar venta {rd(total)}
          </Button>
        </div>
      )}
    </Modal>
  );
}
