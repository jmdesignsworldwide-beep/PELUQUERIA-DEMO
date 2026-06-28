"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CreditCard,
  IdCard,
  Mail,
  Pencil,
  Phone,
  Star,
} from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { cn } from "@/lib/cn";
import { formatCedula, formatPhone } from "@/lib/validation";
import { formatDateRD, formatRD } from "@/lib/format";
import { permanentFieldsFor, permanentTitle } from "@/lib/techSheet";
import { Avatar } from "./Avatar";
import { ClientForm } from "./ClientForm";
import { TechHistory } from "./TechHistory";
import type { ClientFull } from "@/lib/clients";

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-accent">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="truncate font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export function ClientDetail({ client }: { client: ClientFull }) {
  const { skin, businessType } = useApp();
  const v = skin.vocab;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const baseFields = permanentFieldsFor(businessType);

  return (
    <div className="space-y-6">
      <Link
        href="/app/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-accent"
      >
        <ArrowLeft size={16} /> {v.customerPlural}
      </Link>

      <Reveal className="space-y-5">
        {/* Cabecera */}
        <RevealItem>
          <Card className="p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <Avatar
                  name={client.name}
                  photoUrl={client.photoUrl}
                  size={72}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-semibold tracking-tight">
                      {client.name}
                    </h1>
                    {client.isVip && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-metallic/15 px-2 py-0.5 text-xs font-medium text-metallic">
                        <Star size={12} className="fill-metallic" /> VIP
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted">
                    Cliente desde {formatDateRD(client.createdAt)}
                  </p>
                </div>
              </div>
              <Button variant="secondary" onClick={() => setEditing(true)}>
                <Pencil size={16} /> Editar
              </Button>
            </div>
          </Card>
        </RevealItem>

        {/* Datos + balance */}
        <RevealItem>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">
                Datos personales
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Row
                  icon={Phone}
                  label="Teléfono"
                  value={client.phone ? formatPhone(client.phone) : ""}
                />
                <Row
                  icon={IdCard}
                  label="Cédula"
                  value={client.cedula ? formatCedula(client.cedula) : ""}
                />
                <Row icon={Mail} label="Correo" value={client.email ?? ""} />
                <Row
                  icon={CalendarClock}
                  label="Nacimiento"
                  value={client.birthdate ? formatDateRD(client.birthdate) : ""}
                />
              </div>
            </Card>

            <Card className="flex flex-col justify-center p-6">
              <p className="mb-1 inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] text-muted">
                <CreditCard size={13} /> Balance
              </p>
              {client.balance === 0 ? (
                <p className="font-display text-2xl font-semibold">Al día</p>
              ) : (
                <p
                  className={cn(
                    "font-display text-2xl font-semibold tabular",
                    client.balance < 0 ? "text-red-500" : "text-emerald-500"
                  )}
                >
                  {client.balance < 0 ? "Debe " : "A favor "}
                  {formatRD(Math.abs(client.balance))}
                </p>
              )}
            </Card>
          </div>
        </RevealItem>

        {/* Ficha técnica por piel */}
        <RevealItem>
          <Card className="p-6">
            <p className="mb-4 text-xs uppercase tracking-[0.18em] text-muted">
              {permanentTitle(businessType)}
            </p>
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {baseFields.map((f) => (
                <div
                  key={f.key}
                  className="flex items-start justify-between gap-4 border-b border-border/60 pb-3"
                >
                  <span className="text-sm text-muted">{f.label}</span>
                  <span className="text-right text-sm font-medium">
                    {client.techSheet[f.key] || "—"}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </RevealItem>

        {/* Historial técnico: señales útiles + timeline */}
        <RevealItem>
          <TechHistory history={client.history} createdAt={client.createdAt} />
        </RevealItem>

        {/* Notas */}
        <RevealItem>
          <Card className="p-6">
            <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
              Notas internas
            </p>
            <p className="text-sm leading-relaxed text-fg/90">
              {client.notes || "Sin notas."}
            </p>
          </Card>
        </RevealItem>
      </Reveal>

      <ClientForm
        open={editing}
        onClose={() => setEditing(false)}
        initial={client}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
