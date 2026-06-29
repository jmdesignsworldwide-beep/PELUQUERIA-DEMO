"use client";

/**
 * Recibo digital de EJEMPLO (premium). Desglose completo + disclaimers.
 * Compartir por WhatsApp (wa.me) o descargar como texto. Sin valor fiscal.
 */

import { MessageCircle, Download } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { formatRD2, formatRD } from "@/lib/money/calc";
import { METHOD_LABEL, Payment } from "@/lib/money/types";

function fmtDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("es-DO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({
  label,
  value,
  strong,
  muted,
}: {
  label: string;
  value: string;
  strong?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className={muted ? "text-xs text-muted" : "text-sm text-fg/80"}>
        {label}
      </span>
      <span
        className={
          strong
            ? "font-display text-xl font-semibold tabular"
            : "tabular text-sm" + (muted ? " text-muted" : "")
        }
      >
        {value}
      </span>
    </div>
  );
}

export function buildReceiptText(p: Payment, businessName: string): string {
  const lines: string[] = [];
  lines.push(`*${businessName}*`);
  lines.push("Recibo de pago (documento de ejemplo)");
  lines.push("");
  lines.push(`Fecha: ${fmtDateTime(p.createdAt)}`);
  lines.push(`NCF: ${p.ncf} (simulado)`);
  lines.push(`Cliente: ${p.clientName}`);
  lines.push(`Servicio: ${p.service}`);
  lines.push(`Atendió: ${p.professionalName}`);
  lines.push("");
  lines.push(`Subtotal: ${formatRD2(p.subtotal)}`);
  if (p.discount > 0) lines.push(`Descuento: -${formatRD2(p.discount)}`);
  if (p.itbis > 0) lines.push(`ITBIS 18% (sim.): ${formatRD2(p.itbis)}`);
  if (p.tip > 0) lines.push(`Propina: ${formatRD2(p.tip)}`);
  lines.push(`TOTAL: ${formatRD2(p.total)}`);
  lines.push("");
  for (const s of p.splits) {
    lines.push(
      `${METHOD_LABEL[s.method]}: ${formatRD2(s.amount)}${
        s.reference ? ` (Ref. ${s.reference})` : ""
      }`
    );
  }
  if (p.change != null && p.change > 0) {
    lines.push(`Devuelta: ${formatRD2(p.change)}`);
  }
  lines.push("");
  lines.push("NCF simulado para demostración. No certificado ante la DGII.");
  lines.push("Documento de ejemplo generado para demostración.");
  return lines.join("\n");
}

export function Recibo({ payment }: { payment: Payment }) {
  const { skin } = useApp();
  const business = skin.businessName;
  const anulado = payment.status === "anulado";

  function shareWhatsApp() {
    const text = buildReceiptText(payment, business);
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }
  function download() {
    const text = buildReceiptText(payment, business);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recibo-${payment.ncf}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-2/40 p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
          }}
        />
        {anulado && (
          <span
            className="absolute right-4 top-4 rotate-6 rounded-md border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-widest"
            style={{
              color: "rgb(var(--st-cancelada))",
              borderColor: "rgb(var(--st-cancelada))",
            }}
          >
            Anulado
          </span>
        )}

        <p className="font-display text-xl font-semibold tracking-tight text-accent">
          {business}
        </p>
        <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
          Recibo de pago · documento de ejemplo
        </p>

        <div className="my-4 space-y-0.5 border-y border-border py-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted">Fecha</span>
            <span className="tabular">{fmtDateTime(payment.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">NCF (simulado)</span>
            <span className="tabular">{payment.ncf}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Cliente</span>
            <span className="font-medium">{payment.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Atendió</span>
            <span>{payment.professionalName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Servicio</span>
            <span>{payment.service}</span>
          </div>
        </div>

        <Row label="Subtotal" value={formatRD2(payment.subtotal)} />
        {payment.discount > 0 && (
          <Row label="Descuento" value={`− ${formatRD2(payment.discount)}`} />
        )}
        {payment.itbis > 0 && (
          <Row label="ITBIS 18% (sim.)" value={formatRD2(payment.itbis)} />
        )}
        {payment.tip > 0 && (
          <Row label="Propina" value={formatRD2(payment.tip)} />
        )}
        <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm text-muted">Total</span>
          <span className="font-display text-2xl font-semibold tabular">
            {formatRD(payment.total)}
          </span>
        </div>

        <div className="mt-3 space-y-1 border-t border-border pt-3">
          {payment.splits.map((s, i) => (
            <Row
              key={i}
              label={`${METHOD_LABEL[s.method]}${s.reference ? ` · Ref. ${s.reference}` : ""}`}
              value={formatRD2(s.amount)}
              muted
            />
          ))}
          {payment.change != null && payment.change > 0 && (
            <Row label="Devuelta" value={formatRD2(payment.change)} muted />
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-2/30 px-3 py-2 text-[11px] leading-relaxed text-muted">
        NCF simulado para demostración. No certificado ante la DGII. Documento de
        ejemplo generado para demostración.
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={shareWhatsApp}>
          <MessageCircle size={16} /> WhatsApp
        </Button>
        <Button variant="secondary" onClick={download}>
          <Download size={16} /> Descargar
        </Button>
      </div>
    </div>
  );
}
