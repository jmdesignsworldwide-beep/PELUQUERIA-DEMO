"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  Clock,
  MapPin,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/clients/Avatar";
import { cn } from "@/lib/cn";
import { formatRD } from "@/lib/format";
import { DateTimeStep } from "./DateTimeStep";
import { Confirmation } from "./Confirmation";
import { bookingAction } from "@/app/reservar/[slug]/actions";
import { formatPhone } from "@/lib/validation";
import type {
  BookingOptions,
  Confirmation as Conf,
  Slot,
} from "@/lib/booking";

type Account = {
  slug: string;
  businessName: string;
  publicPhone: string | null;
};

type Sel = {
  locationId: string;
  professionalId: string | null;
  serviceId: string | null;
  dateStr: string | null;
  slot: Slot | null;
  name: string;
  phone: string;
  email: string;
};

export function BookingFlow({
  account,
  options,
}: {
  account: Account;
  options: BookingOptions;
}) {
  const { skin } = useApp();
  const v = skin.vocab;

  const primaryLoc =
    options.locations.find((l) => l.isPrimary) ?? options.locations[0];
  const multiLoc = options.locations.length > 1;

  const steps = useMemo(
    () =>
      [
        "welcome",
        ...(multiLoc ? ["location"] : []),
        "professional",
        "service",
        "datetime",
        "customer",
        "confirmation",
      ] as const,
    [multiLoc]
  );

  const [idx, setIdx] = useState(0);
  const [sel, setSel] = useState<Sel>({
    locationId: primaryLoc?.id ?? "",
    professionalId: null,
    serviceId: null,
    dateStr: null,
    slot: null,
    name: "",
    phone: "",
    email: "",
  });
  const [conf, setConf] = useState<Conf | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const key = steps[idx];
  const next = () => setIdx((i) => Math.min(i + 1, steps.length - 1));
  const back = () => setIdx((i) => Math.max(i - 1, 0));
  const patch = (p: Partial<Sel>) => setSel((s) => ({ ...s, ...p }));

  const location =
    options.locations.find((l) => l.id === sel.locationId) ?? primaryLoc;
  const professional = options.professionals.find(
    (p) => p.id === sel.professionalId
  );
  const service = options.services.find((s) => s.id === sel.serviceId);
  const proList = options.professionals.filter(
    (p) => !p.locationId || p.locationId === sel.locationId
  );

  const selectionSteps = steps.filter(
    (s) => s !== "welcome" && s !== "confirmation"
  );
  const selPos = selectionSteps.indexOf(key as (typeof selectionSteps)[number]);
  const showProgress = selPos >= 0;

  async function submit() {
    if (!service || !sel.slot || !sel.dateStr) return;
    setSubmitting(true);
    setError(null);
    const res = await bookingAction({
      slug: account.slug,
      locationId: sel.locationId,
      professionalId: sel.professionalId,
      serviceId: service.id,
      dateStr: sel.dateStr,
      timeMin: sel.slot.timeMin,
      name: sel.name,
      phone: sel.phone,
      email: sel.email || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setConf(res.confirmation);
      setIdx(steps.indexOf("confirmation"));
    } else {
      setError(res.error);
    }
  }

  function reset() {
    setConf(null);
    setError(null);
    setSel({
      locationId: primaryLoc?.id ?? "",
      professionalId: null,
      serviceId: null,
      dateStr: null,
      slot: null,
      name: "",
      phone: "",
      email: "",
    });
    setIdx(0);
  }

  // Agrupar servicios por categoría
  const grouped = useMemo(() => {
    const g = new Map<string, typeof options.services>();
    for (const s of options.services) {
      const c = s.category ?? "Servicios";
      if (!g.has(c)) g.set(c, []);
      g.get(c)!.push(s);
    }
    return Array.from(g.entries());
  }, [options.services]);

  return (
    <main className="relative min-h-dvh">
      <AuroraBackground />

      <div className="mx-auto w-full max-w-2xl px-4 py-6 sm:py-10">
        {/* Marca + progreso */}
        <header className="mb-6">
          <div className="flex items-center gap-3">
            {key !== "welcome" && key !== "confirmation" ? (
              <button
                type="button"
                onClick={back}
                aria-label="Atrás"
                className="grid h-9 w-9 place-items-center rounded-full border border-border glass text-muted transition-colors hover:text-accent"
              >
                <ArrowLeft size={17} />
              </button>
            ) : (
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-accent text-accent-contrast shadow-glow">
                <span className="font-display text-sm font-semibold">
                  {skin.monogram}
                </span>
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-base font-semibold leading-none">
                {account.businessName}
              </p>
              <p className="mt-0.5 text-xs text-muted">Reserva en línea</p>
            </div>
          </div>

          {showProgress && (
            <div className="mt-4">
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>
                  Paso {selPos + 1} de {selectionSteps.length}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  animate={{
                    width: `${((selPos + 1) / selectionSteps.length) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                />
              </div>
            </div>
          )}
        </header>

        <AnimatePresence mode="wait">
          <motion.div
            key={key}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: "spring", stiffness: 280, damping: 30 }}
          >
            {/* ───── BIENVENIDA ───── */}
            {key === "welcome" && (
              <div className="flex flex-col items-center pt-8 text-center">
                <div className="mb-6 grid h-20 w-20 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
                  <span className="font-display text-3xl font-semibold">
                    {skin.monogram}
                  </span>
                </div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
                  Reserva tu cita en{" "}
                  <span className="text-accent">{account.businessName}</span>
                </h1>
                <p className="mt-3 max-w-md text-muted">
                  Agenda en menos de un minuto, a la hora que te convenga.
                  Disponible 24/7.
                </p>
                <Button size="lg" className="mt-8" onClick={next}>
                  Comenzar <ArrowRight size={18} />
                </Button>
                <p className="mt-6 inline-flex items-center gap-1.5 text-xs text-muted">
                  <MapPin size={13} /> {primaryLoc?.name}
                </p>
              </div>
            )}

            {/* ───── UBICACIÓN ───── */}
            {key === "location" && (
              <Step title="¿En cuál sucursal?">
                <div className="grid grid-cols-1 gap-3">
                  {options.locations.map((l) => (
                    <Card
                      key={l.id}
                      className="cursor-pointer p-4"
                      onClick={() => {
                        patch({ locationId: l.id, professionalId: null });
                        next();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 place-items-center rounded-xl bg-surface-2 text-accent">
                          <MapPin size={20} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className="truncate text-xs text-muted">
                            {l.address}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    </Card>
                  ))}
                </div>
              </Step>
            )}

            {/* ───── PROFESIONAL ───── */}
            {key === "professional" && (
              <Step title={`Elige tu ${v.professional.toLowerCase()}`}>
                <div className="grid grid-cols-1 gap-3">
                  <Card
                    className="cursor-pointer p-4"
                    onClick={() => {
                      patch({ professionalId: null });
                      next();
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-12 w-12 place-items-center rounded-full bg-surface-2 text-accent">
                        <Sparkles size={20} />
                      </span>
                      <div className="flex-1">
                        <p className="font-medium">Sin preferencia</p>
                        <p className="text-xs text-muted">
                          El primero disponible
                        </p>
                      </div>
                      <ChevronRight size={18} className="text-muted" />
                    </div>
                  </Card>

                  {proList.map((p) => (
                    <Card
                      key={p.id}
                      className="cursor-pointer p-4"
                      onClick={() => {
                        patch({ professionalId: p.id });
                        next();
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={p.name} size={48} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{p.name}</p>
                          <p className="truncate text-xs text-muted">
                            {p.specialty}
                          </p>
                        </div>
                        <ChevronRight size={18} className="text-muted" />
                      </div>
                    </Card>
                  ))}
                </div>
              </Step>
            )}

            {/* ───── SERVICIO ───── */}
            {key === "service" && (
              <Step title="¿Qué servicio deseas?">
                <div className="space-y-5">
                  {grouped.map(([cat, list]) => (
                    <div key={cat}>
                      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-muted">
                        {cat}
                      </p>
                      <div className="grid grid-cols-1 gap-2.5">
                        {list.map((s) => (
                          <Card
                            key={s.id}
                            className="cursor-pointer p-4"
                            onClick={() => {
                              patch({ serviceId: s.id, slot: null, dateStr: null });
                              next();
                            }}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate font-medium">{s.name}</p>
                                <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted">
                                  <Clock size={11} /> {s.durationMin} min
                                </p>
                              </div>
                              <span className="tabular shrink-0 font-display text-lg font-semibold text-accent">
                                {formatRD(s.price)}
                              </span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </Step>
            )}

            {/* ───── FECHA Y HORA ───── */}
            {key === "datetime" && service && (
              <Step title="Elige fecha y hora">
                <DateTimeStep
                  slug={account.slug}
                  locationId={sel.locationId}
                  professionalId={sel.professionalId}
                  serviceId={service.id}
                  closedWeekdays={location?.closedWeekdays ?? [0]}
                  selectedDate={sel.dateStr}
                  selectedSlotIso={sel.slot?.iso ?? null}
                  onPick={(dateStr, slot) => {
                    patch({ dateStr, slot });
                    next();
                  }}
                />
              </Step>
            )}

            {/* ───── DATOS DEL CLIENTE ───── */}
            {key === "customer" && (
              <Step title="Tus datos">
                {/* Resumen compacto */}
                <Card className="mb-4 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-medium">{service?.name}</span>
                    <span className="text-muted">·</span>
                    <span className="inline-flex items-center gap-1 text-muted">
                      <CalendarDays size={13} />
                      {sel.slot && new Intl.DateTimeFormat("es-DO", {
                        timeZone: "America/Santo_Domingo",
                        day: "numeric",
                        month: "short",
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      }).format(new Date(sel.slot.iso))}
                    </span>
                  </div>
                </Card>

                <div className="space-y-4">
                  <Field label="Nombre completo *">
                    <input
                      value={sel.name}
                      onChange={(e) => patch({ name: e.target.value })}
                      placeholder="Tu nombre"
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Teléfono *">
                    <input
                      value={sel.phone}
                      inputMode="numeric"
                      onChange={(e) => patch({ phone: formatPhone(e.target.value) })}
                      placeholder="809-555-1234"
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Correo (opcional)">
                    <input
                      value={sel.email}
                      type="email"
                      onChange={(e) => patch({ email: e.target.value })}
                      placeholder="correo@gmail.com"
                      className={inputCls()}
                    />
                  </Field>

                  {error && (
                    <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
                      <AlertCircle size={16} className="shrink-0" /> {error}
                    </div>
                  )}

                  <Button
                    size="lg"
                    fullWidth
                    loading={submitting}
                    onClick={submit}
                    disabled={!sel.name.trim() || !sel.phone.trim()}
                  >
                    <UserCheck size={18} /> Confirmar reserva
                  </Button>
                </div>
              </Step>
            )}

            {/* ───── CONFIRMACIÓN ───── */}
            {key === "confirmation" && conf && (
              <Confirmation conf={conf} onReset={reset} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function Step({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 font-display text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </div>
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
    <div>
      <label className="mb-1.5 block text-sm font-medium text-fg/80">
        {label}
      </label>
      {children}
    </div>
  );
}

function inputCls() {
  return "h-12 w-full rounded-xl border border-border bg-surface-2/60 px-4 text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60";
}
