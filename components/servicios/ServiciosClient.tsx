"use client";

/**
 * MÓDULO SERVICIOS — catálogo premium (demo en navegador). Lee el catálogo
 * único (coherente con cobro/reserva). Buscar, filtrar por categoría, ver
 * detalle (clic = más info), y crear/editar responde visualmente (no persiste,
 * como el resto del demo).
 */

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Scissors,
  Plus,
  Search,
  Clock,
  Star,
  Pencil,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  CatalogService,
  SERVICE_CATEGORIES,
  categoryLabel,
  servicesFor,
} from "@/lib/catalog/services";

function rd(pesos: number): string {
  return `RD$ ${pesos.toLocaleString("es-DO")}`;
}

function durationLabel(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";

export function ServiciosClient() {
  const { businessType, skin } = useApp();
  const cats = SERVICE_CATEGORIES[businessType];

  const [services, setServices] = useState<CatalogService[]>(() =>
    servicesFor(businessType)
  );
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState<string>("todas");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [editor, setEditor] = useState<CatalogService | "nuevo" | null>(null);

  // Al cambiar de piel, recarga el catálogo de esa piel.
  useEffect(() => {
    setServices(servicesFor(businessType));
    setSearch("");
    setCat("todas");
    setDetailId(null);
  }, [businessType]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((s) => {
      if (cat !== "todas" && s.category !== cat) return false;
      if (q && !`${s.name} ${s.description}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [services, search, cat]);

  const detail = services.find((s) => s.id === detailId) ?? null;

  function saveService(data: CatalogService) {
    setServices((prev) => {
      const exists = prev.some((s) => s.id === data.id);
      return exists ? prev.map((s) => (s.id === data.id ? data : s)) : [data, ...prev];
    });
    setEditor(null);
  }

  return (
    <div className="space-y-5">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
              <Scissors size={20} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                Servicios
              </h1>
              <p className="text-xs text-muted">
                Catálogo de {skin.label.toLowerCase()} · {services.length} servicios
              </p>
            </div>
          </div>
          <Button onClick={() => setEditor("nuevo")}>
            <Plus size={16} /> Nuevo servicio
          </Button>
        </div>
      </div>

      {/* Buscar + categorías */}
      <div>
        <div className="space-y-3">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar servicio…"
              className="w-full rounded-xl border border-border bg-surface-2/40 py-2.5 pl-9 pr-3 text-sm outline-none transition-colors focus:border-accent/60"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[{ key: "todas", label: "Todas" }, ...cats].map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setCat(c.key)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                  cat === c.key
                    ? "border-accent bg-accent-soft/50 text-accent"
                    : "border-border text-muted hover:text-fg"
                )}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted">
          No hay servicios con estos filtros.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s, i) => (
              <motion.button
                key={s.id}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}
                onClick={() => setDetailId(s.id)}
                className="group flex h-full w-full flex-col rounded-2xl border border-border glass p-4 text-left shadow-soft transition-premium hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-pop sm:p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-semibold tracking-tight">
                      {s.name}
                    </p>
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {categoryLabel(businessType, s.category)}
                    </p>
                  </div>
                  {s.popular && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent-soft/40 px-2 py-0.5 text-[10px] font-medium text-accent">
                      <Star size={10} /> Popular
                    </span>
                  )}
                </div>
                <p className="mb-3 line-clamp-2 text-xs text-muted">{s.description}</p>
                <div className="mt-auto flex items-center justify-between">
                  <span className="font-display text-lg font-semibold tabular">
                    {s.variants ? `Desde ${rd(Math.min(...s.variants.map((v) => v.price)))}` : rd(s.price)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted">
                    <Clock size={12} /> {durationLabel(s.duration)}
                  </span>
                </div>
              </motion.button>
          ))}
        </div>
      )}

      {/* Detalle */}
      <Modal open={!!detail} onClose={() => setDetailId(null)} title="Detalle del servicio">
        {detail && (
          <div className="space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-display text-xl font-semibold tracking-tight">
                    {detail.name}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-muted">
                    {categoryLabel(businessType, detail.category)}
                  </p>
                </div>
                {detail.popular && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent-soft/40 px-2 py-0.5 text-[11px] font-medium text-accent">
                    <Star size={11} /> Más solicitado
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted">{detail.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted">Precio</p>
                <p className="font-display text-xl font-semibold tabular">
                  {rd(detail.price)}
                </p>
              </div>
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
                  <Clock size={12} /> Duración
                </p>
                <p className="text-sm font-medium">{durationLabel(detail.duration)}</p>
              </div>
            </div>

            {detail.variants && (
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wide text-muted">
                  {businessType === "salon" ? "Precio por largo / variante" : "Variantes"}
                </p>
                <div className="overflow-hidden rounded-xl border border-border">
                  {detail.variants.map((v, i) => (
                    <div
                      key={v.label}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm",
                        i > 0 && "border-t border-border"
                      )}
                    >
                      <span>{v.label}</span>
                      <span className="tabular font-medium">{rd(v.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-sm">
              <TrendingUp size={15} className="text-accent" />
              <span className="text-muted">Realizado</span>
              <span className="ml-auto tabular font-medium">
                {detail.timesDone} veces
              </span>
            </div>

            <Button fullWidth variant="secondary" onClick={() => setEditor(detail)}>
              <Pencil size={15} /> Editar servicio
            </Button>
          </div>
        )}
      </Modal>

      {/* Editor (crear / editar) */}
      <ServicioEditor
        value={editor}
        skin={businessType}
        onClose={() => setEditor(null)}
        onSave={saveService}
      />
    </div>
  );
}

function ServicioEditor({
  value,
  skin,
  onClose,
  onSave,
}: {
  value: CatalogService | "nuevo" | null;
  skin: ReturnType<typeof useApp>["businessType"];
  onClose: () => void;
  onSave: (s: CatalogService) => void;
}) {
  const cats = SERVICE_CATEGORIES[skin];
  const editing = value && value !== "nuevo" ? value : null;
  const [name, setName] = useState("");
  const [category, setCategory] = useState(cats[0].key);
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!value) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setPrice(String(editing.price));
      setDuration(String(editing.duration));
      setDescription(editing.description);
    } else {
      setName("");
      setCategory(cats[0].key);
      setPrice("");
      setDuration("");
      setDescription("");
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  const valid = name.trim() && Number(price) > 0 && Number(duration) > 0;

  return (
    <Modal
      open={!!value}
      onClose={onClose}
      title={editing ? "Editar servicio" : "Nuevo servicio"}
    >
      <div className="space-y-3">
        <Field label="Nombre">
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej. Corte y peinado" />
        </Field>
        <Field label="Categoría">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
            {cats.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Precio (RD$)">
            <input inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} className={cn(inputCls, "tabular")} placeholder="0" />
          </Field>
          <Field label="Duración (min)">
            <input inputMode="numeric" value={duration} onChange={(e) => setDuration(e.target.value)} className={cn(inputCls, "tabular")} placeholder="0" />
          </Field>
        </div>
        <Field label="Descripción">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className={cn(inputCls, "resize-none")}
            placeholder="Breve descripción del servicio"
          />
        </Field>
        <Button
          fullWidth
          disabled={!valid}
          onClick={() =>
            onSave({
              id: editing ? editing.id : `nuevo-${Date.now()}`,
              name: name.trim(),
              category,
              description: description.trim() || "Servicio del catálogo.",
              price: Number(price),
              duration: Number(duration),
              variants: editing?.variants,
              timesDone: editing?.timesDone ?? 0,
              popular: editing?.popular,
            })
          }
        >
          {editing ? "Guardar cambios" : "Crear servicio"}
        </Button>
        <p className="text-center text-[11px] text-muted">
          Demo: los cambios se ven al instante (no persisten al recargar).
        </p>
      </div>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
