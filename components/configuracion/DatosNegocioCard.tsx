"use client";

/**
 * Datos del negocio + Facturación SIMULADA. Lo que el cliente ajusta de SU
 * negocio. En el demo se guarda en el navegador (localStorage por cuenta);
 * cuando exista backend se reemplaza por una tabla `business_settings`.
 * La facturación es VITRINA con disclaimer (no certificada ante la DGII).
 */

import { useEffect, useState } from "react";
import {
  Building2,
  Check,
  Clock,
  CreditCard,
  Percent,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { METHOD_LABEL, METHODS, PaymentMethod } from "@/lib/money/types";

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";

type Negocio = {
  nombre: string;
  direccion: string;
  telefono: string;
  instagram: string;
  whatsapp: string;
  apertura: number;
  cierre: number;
  metodos: Record<PaymentMethod, boolean>;
  comisionPct: number;
  rnc: string;
  ncfDesde: string;
  ncfHasta: string;
};

function defaults(nombre: string): Negocio {
  return {
    nombre,
    direccion: "",
    telefono: "",
    instagram: "",
    whatsapp: "",
    apertura: 8,
    cierre: 20,
    metodos: { efectivo: true, transferencia: true, tarjeta: true },
    comisionPct: 45,
    rnc: "",
    ncfDesde: "",
    ncfHasta: "",
  };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Building2;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border glass p-5">
      <p className="mb-3 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        <Icon size={13} /> {title}
      </p>
      {children}
    </div>
  );
}

export function DatosNegocioCard() {
  const { username, businessName, skin } = useApp();
  const key = `jm-negocio-v1-${username || "demo"}`;
  const [data, setData] = useState<Negocio>(() => defaults(businessName || skin.businessName));
  const [saved, setSaved] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) setData({ ...defaults(businessName || skin.businessName), ...JSON.parse(raw) });
    } catch {}
    setReady(true);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  function set<K extends keyof Negocio>(k: K, v: Negocio[K]) {
    setData((d) => ({ ...d, [k]: v }));
    setSaved(false);
  }

  function save() {
    try {
      window.localStorage.setItem(key, JSON.stringify(data));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
  }

  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6..22

  if (!ready) {
    return <div className="h-64 animate-pulse rounded-2xl bg-surface-2/60" />;
  }

  return (
    <div className="space-y-4">
      <Section icon={Building2} title="Datos del negocio">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Nombre del negocio">
            <input value={data.nombre} onChange={(e) => set("nombre", e.target.value)} className={inputCls} />
          </Field>
          <Field label="Teléfono">
            <input value={data.telefono} onChange={(e) => set("telefono", e.target.value)} placeholder="809-000-0000" className={inputCls} />
          </Field>
          <Field label="Dirección">
            <input value={data.direccion} onChange={(e) => set("direccion", e.target.value)} placeholder="Calle, sector, ciudad" className={inputCls} />
          </Field>
          <Field label="Instagram">
            <input value={data.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="@minegocio" className={inputCls} />
          </Field>
          <Field label="WhatsApp">
            <input value={data.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="809-000-0000" className={inputCls} />
          </Field>
        </div>
      </Section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section icon={Clock} title="Horario de operación">
          <p className="mb-2 text-xs text-muted">Define el rango de la agenda.</p>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Apertura">
              <select value={data.apertura} onChange={(e) => set("apertura", Number(e.target.value))} className={inputCls}>
                {hours.map((h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
            </Field>
            <Field label="Cierre">
              <select value={data.cierre} onChange={(e) => set("cierre", Number(e.target.value))} className={inputCls}>
                {hours.map((h) => (
                  <option key={h} value={h}>{`${h}:00`}</option>
                ))}
              </select>
            </Field>
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Percent size={13} /> Comisión por defecto del {skin.vocab.professional.toLowerCase()}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <input
              inputMode="numeric"
              value={String(data.comisionPct)}
              onChange={(e) => set("comisionPct", Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
              className={cn(inputCls, "tabular max-w-[100px]")}
            />
            <span className="text-sm text-muted">%</span>
          </div>
        </Section>

        <Section icon={CreditCard} title="Métodos de pago aceptados">
          <div className="space-y-2">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("metodos", { ...data.metodos, [m]: !data.metodos[m] })}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-2/30 px-3 py-2.5 text-sm"
              >
                <span>{METHOD_LABEL[m]}</span>
                <span
                  className={cn(
                    "relative h-5 w-9 rounded-full transition-colors",
                    data.metodos[m] ? "bg-accent" : "bg-surface-2"
                  )}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                      data.metodos[m] ? "left-[18px]" : "left-0.5"
                    )}
                  />
                </span>
              </button>
            ))}
          </div>
        </Section>
      </div>

      {/* Facturación simulada */}
      <Section icon={FileText} title="Facturación (NCF / electrónica)">
        <div
          className="mb-3 flex items-start gap-2 rounded-xl px-3 py-2 text-xs"
          style={{
            color: "rgb(var(--st-pendiente))",
            background: "rgb(var(--st-pendiente) / 0.1)",
            boxShadow: "inset 0 0 0 1px rgb(var(--st-pendiente) / 0.3)",
          }}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            Facturación simulada para demostración. No certificada ante la DGII.
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="RNC (simulado)">
            <input value={data.rnc} onChange={(e) => set("rnc", e.target.value)} placeholder="1-30-00000-0" className={cn(inputCls, "tabular")} />
          </Field>
          <Field label="NCF desde (simulado)">
            <input value={data.ncfDesde} onChange={(e) => set("ncfDesde", e.target.value)} placeholder="B0100000001" className={cn(inputCls, "tabular")} />
          </Field>
          <Field label="NCF hasta (simulado)">
            <input value={data.ncfHasta} onChange={(e) => set("ncfHasta", e.target.value)} placeholder="B0100001000" className={cn(inputCls, "tabular")} />
          </Field>
        </div>
      </Section>

      <div className="flex items-center justify-end gap-3">
        {saved && (
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "rgb(var(--st-completada))" }}>
            <Check size={15} /> Guardado
          </span>
        )}
        <Button onClick={save}>Guardar cambios</Button>
      </div>
    </div>
  );
}
