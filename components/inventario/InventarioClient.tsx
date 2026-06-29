"use client";

/**
 * INVENTARIO (demo navegable). Productos bi-piel con alertas de bajo stock y
 * vencimiento. Clic = más info (detalle con historial, proveedor, stock).
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Package, Plus, Search, AlertTriangle, Boxes } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  Product,
  PRODUCT_CATEGORIES,
  isLowStock,
  productHistory,
  productsFor,
  supplierById,
} from "@/lib/catalog/products";

function rd(p: number) {
  return `RD$ ${p.toLocaleString("es-DO")}`;
}
const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";
const useLabel: Record<Product["use"], string> = {
  interno: "Uso interno",
  venta: "Venta",
  ambos: "Uso + venta",
};

export function InventarioClient() {
  const { businessType, skin } = useApp();
  const cats = PRODUCT_CATEGORIES[businessType];
  const [items, setItems] = useState<Product[]>(() => productsFor(businessType));
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("todas");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    setItems(productsFor(businessType));
    setSearch("");
    setCat("todas");
  }, [businessType]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      if (cat !== "todas" && p.category !== cat) return false;
      if (q && !`${p.name} ${p.brand}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, search, cat]);

  const lowCount = items.filter(isLowStock).length;
  const detail = items.find((p) => p.id === detailId) ?? null;
  const detailSupplier = detail ? supplierById(businessType, detail.supplierId) : undefined;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <Package size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              Inventario
            </h1>
            <p className="text-xs text-muted">
              {items.length} productos · {skin.label}
            </p>
          </div>
        </div>
        <Button onClick={() => setAdding(true)}>
          <Plus size={16} /> Producto
        </Button>
      </div>

      {lowCount > 0 && (
        <div
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm"
          style={{
            color: "rgb(var(--st-pendiente))",
            background: "rgb(var(--st-pendiente) / 0.1)",
            boxShadow: "inset 0 0 0 1px rgb(var(--st-pendiente) / 0.3)",
          }}
        >
          <AlertTriangle size={15} />
          {lowCount} producto{lowCount === 1 ? "" : "s"} bajo el mínimo de stock.
        </div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" className="w-full rounded-xl border border-border bg-surface-2/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-accent/60" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[{ key: "todas", label: "Todas" }, ...cats].map((c) => (
            <button key={c.key} type="button" onClick={() => setCat(c.key)} className={cn("rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors", cat === c.key ? "border-accent bg-accent-soft/50 text-accent" : "border-border text-muted hover:text-fg")}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.map((p, i) => {
          const low = isLowStock(p);
          return (
            <motion.button
              key={p.id}
              type="button"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.25), duration: 0.22 }}
              onClick={() => setDetailId(p.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl border bg-surface-2/30 p-3 text-left transition-colors hover:border-accent/40",
                low ? "border-[color:rgb(var(--st-pendiente)/0.5)]" : "border-border"
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                <Boxes size={16} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {p.name} <span className="text-muted">· {p.brand}</span>
                </p>
                <p className="truncate text-[11px] text-muted">
                  {p.categoryLabel} · {useLabel[p.use]}
                  {p.expiry ? ` · vence ${p.expiry}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className={cn("tabular text-sm font-semibold", low && "text-[color:rgb(var(--st-pendiente))]")}>
                  {p.stock} <span className="text-[11px] font-normal text-muted">/ {p.minStock} mín</span>
                </p>
                <p className="tabular text-[11px] text-muted">{rd(p.price)}</p>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detalle */}
      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Detalle del producto">
        {detail && (
          <div className="space-y-4">
            <div>
              <p className="font-display text-xl font-semibold tracking-tight">{detail.name}</p>
              <p className="text-sm text-muted">{detail.brand} · {detail.categoryLabel}</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Box label="Stock" value={`${detail.stock}`} alert={isLowStock(detail)} />
              <Box label="Mínimo" value={`${detail.minStock}`} />
              <Box label="Precio" value={rd(detail.price)} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Box label="Uso" value={useLabel[detail.use]} />
              <Box label="Vence" value={detail.expiry ?? "—"} />
            </div>
            <div className="rounded-xl border border-border bg-surface-2/40 p-3">
              <p className="text-[11px] uppercase tracking-wide text-muted">Proveedor</p>
              <p className="text-sm font-medium">{detailSupplier?.name ?? "—"}</p>
              <p className="text-[11px] text-muted tabular">{detailSupplier?.phone}</p>
            </div>
            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">Historial de movimientos</p>
              <div className="overflow-hidden rounded-xl border border-border">
                {productHistory(detail).map((h, i) => (
                  <div key={i} className={cn("flex items-center justify-between px-3 py-2 text-sm", i > 0 && "border-t border-border")}>
                    <span className="tabular text-muted">{h.date}</span>
                    <span>{h.type}</span>
                    <span className="tabular font-medium">{h.qty} u.</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* + Producto (visual) */}
      <AddProductModal
        open={adding}
        cats={cats}
        onClose={() => setAdding(false)}
        onAdd={(p) => {
          setItems((prev) => [p, ...prev]);
          setAdding(false);
        }}
      />
    </div>
  );
}

function Box({ label, value, alert }: { label: string; value: string; alert?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-surface-2/40 p-2.5 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted">{label}</p>
      <p className={cn("tabular text-sm font-semibold", alert && "text-[color:rgb(var(--st-pendiente))]")}>{value}</p>
    </div>
  );
}

function AddProductModal({
  open,
  cats,
  onClose,
  onAdd,
}: {
  open: boolean;
  cats: { key: string; label: string }[];
  onClose: () => void;
  onAdd: (p: Product) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(cats[0].key);
  const [stock, setStock] = useState("");
  const [price, setPrice] = useState("");
  useEffect(() => {
    if (open) { setName(""); setCategory(cats[0].key); setStock(""); setPrice(""); }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const valid = name.trim() && Number(stock) >= 0 && Number(price) > 0;
  return (
    <Modal open={open} onClose={onClose} title="Nuevo producto">
      <div className="space-y-3">
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Nombre</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej. Shampoo sin sal" /></label>
        <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Categoría</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {cats.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select></label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Stock</span>
            <input inputMode="numeric" value={stock} onChange={(e) => setStock(e.target.value)} className={cn(inputCls, "tabular")} placeholder="0" /></label>
          <label className="block"><span className="mb-1 block text-xs font-medium text-muted">Precio (RD$)</span>
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={cn(inputCls, "tabular")} placeholder="0" /></label>
        </div>
        <Button fullWidth disabled={!valid} onClick={() => onAdd({
          id: `nuevo-${Date.now()}`, name: name.trim(), brand: "—",
          category, categoryLabel: cats.find((c) => c.key === category)?.label ?? category,
          stock: Number(stock), minStock: 5, price: Number(price), expiry: null, use: "venta", supplierId: "sup-1",
        })}>Agregar producto</Button>
        <p className="text-center text-[11px] text-muted">Demo: se agrega al instante (no persiste al recargar).</p>
      </div>
    </Modal>
  );
}
