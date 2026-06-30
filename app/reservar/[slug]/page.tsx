"use client";

/**
 * RESERVA PÚBLICA — la página a la que apunta "Tu link de reservas". Pública
 * (sin login), para que el cliente del negocio reserve solo. Bi-piel: la piel
 * se infiere del slug del negocio. Datos del catálogo (servicios/profesionales).
 * Demo: la solicitud se confirma visualmente (no persiste).
 */

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Check, Clock, Scissors } from "lucide-react";
import { AppProviders } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";
import { BrandMark } from "@/components/brand/BrandMark";
import { cn } from "@/lib/cn";
import { getSkin, type BusinessType } from "@/lib/skins";
import { servicesFor } from "@/lib/catalog/services";
import { professionalsFor } from "@/components/citas/data";

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2.5 text-sm text-fg outline-none transition-premium focus:border-accent/60 focus:ring-4 focus:ring-accent/10";

function titleFromSlug(slug: string): string {
  const s = decodeURIComponent(slug).replace(/-/g, " ").trim();
  if (!s) return "Tu negocio";
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Franjas horarias 9:00 AM – 6:30 PM cada 30 min. */
function timeSlots(): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = [];
  for (let m = 9 * 60; m <= 18 * 60 + 30; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 === 0 ? 12 : h % 12;
    out.push({
      value: `${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`,
      label: `${h12}:${String(mm).padStart(2, "0")} ${ampm}`,
    });
  }
  return out;
}

function rd(p: number) {
  return `RD$ ${p.toLocaleString("es-DO")}`;
}

export default function ReservarPage({
  params,
}: {
  params: { slug: string };
}) {
  // La piel se infiere del nombre del negocio en el slug.
  const businessType: BusinessType = /barber/.test(params.slug)
    ? "barberia"
    : "salon";
  const negocio = titleFromSlug(params.slug);

  return (
    <AppProviders initialSkin={businessType}>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-skin','${businessType}');`,
        }}
      />
      <Reserva businessType={businessType} negocio={negocio} />
    </AppProviders>
  );
}

function Reserva({
  businessType,
  negocio,
}: {
  businessType: BusinessType;
  negocio: string;
}) {
  const skin = getSkin(businessType);
  const services = useMemo(() => servicesFor(businessType), [businessType]);
  const pros = useMemo(() => professionalsFor(businessType), [businessType]);
  const slots = useMemo(() => timeSlots(), []);

  const [serviceId, setServiceId] = useState("");
  const [proId, setProId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [done, setDone] = useState(false);

  const service = services.find((s) => s.id === serviceId) ?? null;
  const valid =
    !!serviceId && !!date && !!time && nombre.trim().length >= 2 && telefono.trim().length >= 7;

  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-10">
      <AuroraBackground />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        {/* Marca */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="relative mb-4 grid h-16 w-16 place-items-center overflow-hidden rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.7), transparent)",
              }}
            />
            <span className="font-display text-2xl font-semibold tracking-tight">
              {skin.monogram}
            </span>
          </div>
          <h1 className="text-balance font-display text-3xl font-semibold tracking-tight">
            {negocio}
          </h1>
          <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-muted">
            <BrandMark businessType={businessType} size={14} className="text-accent" />
            Reserva tu cita en línea
          </p>
        </div>

        {/* Tarjeta */}
        <div className="relative overflow-hidden rounded-2xl border border-border glass-strong p-5 shadow-layered sm:p-7">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
            }}
          />

          {done ? (
            <div className="flex flex-col items-center py-6 text-center">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow">
                <Check size={32} strokeWidth={3} />
              </span>
              <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
                ¡Reserva solicitada!
              </p>
              <p className="mt-2 max-w-sm text-sm text-muted">
                {negocio} recibió tu solicitud para{" "}
                <span className="text-fg">{service?.name}</span> el{" "}
                <span className="tabular text-fg">{date}</span> a las{" "}
                <span className="tabular text-fg">
                  {slots.find((s) => s.value === time)?.label}
                </span>
                . Te confirmarán por teléfono.
              </p>
              <Button className="mt-6" fullWidth onClick={() => setDone(false)}>
                Hacer otra reserva
              </Button>
              <p className="mt-3 text-[11px] text-muted">
                Demo: la reserva es de muestra (no se guarda).
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Field label="Servicio">
                <select
                  value={serviceId}
                  onChange={(e) => setServiceId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Elige un servicio…</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} —{" "}
                      {s.variants
                        ? `desde ${rd(Math.min(...s.variants.map((v) => v.price)))}`
                        : rd(s.price)}
                    </option>
                  ))}
                </select>
              </Field>

              {service && (
                <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-[11px] text-muted">
                  <Clock size={13} className="text-accent" />
                  Duración aprox. {service.duration} min
                </div>
              )}

              <Field label={`${skin.vocab.professional} (opcional)`}>
                <select
                  value={proId}
                  onChange={(e) => setProId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Sin preferencia</option>
                  {pros.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.specialty}
                    </option>
                  ))}
                </select>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Fecha">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={cn(inputCls, "tabular")}
                  />
                </Field>
                <Field label="Hora">
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className={inputCls}
                  >
                    <option value="">Elige una hora…</option>
                    {slots.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Tu nombre">
                  <input
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Nombre y apellido"
                    className={inputCls}
                  />
                </Field>
                <Field label="Teléfono">
                  <input
                    inputMode="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="809-000-0000"
                    className={cn(inputCls, "tabular")}
                  />
                </Field>
              </div>

              <Button
                fullWidth
                size="lg"
                disabled={!valid}
                onClick={() => setDone(true)}
              >
                <CalendarDays size={17} /> Solicitar reserva
              </Button>
              <p className="text-center text-[11px] text-muted">
                Demo de {skin.label.toLowerCase()}. La reserva es de muestra.
              </p>
            </div>
          )}
        </div>

        <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <Scissors size={12} /> {negocio} · Reservas en línea
        </p>
      </motion.div>
    </main>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
