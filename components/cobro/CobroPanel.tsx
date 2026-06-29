"use client";

/**
 * Panel de cobro premium. Toda la aritmética pasa por computeCobro (centavos
 * enteros) para que el total, el pago mixto y la devuelta cuadren EXACTOS.
 * Reutilizable: desde la cita (draft precargado) o cobro manual (8.3).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Banknote, CreditCard, ArrowLeftRight, Split } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { useApp } from "@/components/providers/AppProviders";
import { useMoney, NewPayment } from "@/components/providers/MoneyProvider";
import { professionalsFor } from "@/components/citas/data";
import {
  computeCobro,
  fromCents,
  formatRD,
  formatRD2,
} from "@/lib/money/calc";
import {
  METHOD_LABEL,
  PaymentMethod,
  PaymentSource,
  Payment,
} from "@/lib/money/types";

export type CobroDraft = {
  source: PaymentSource;
  appointmentId?: string;
  clientName: string;
  service: string;
  professionalId: string;
  professionalName: string;
  serviceAmount: number; // pesos (precargado)
};

type Mode = PaymentMethod | "mixto";

function num(s: string): number {
  const n = parseFloat(String(s).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm tabular text-fg outline-none transition-colors focus:border-accent/60";

function Seg({
  value,
  onChange,
}: {
  value: "monto" | "porciento";
  onChange: (v: "monto" | "porciento") => void;
}) {
  return (
    <div className="flex rounded-lg border border-border p-0.5 text-xs">
      {(["monto", "porciento"] as const).map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onChange(k)}
          className={cn(
            "rounded-md px-2 py-1 font-medium transition-colors",
            value === k ? "bg-accent text-accent-contrast" : "text-muted hover:text-fg"
          )}
        >
          {k === "monto" ? "RD$" : "%"}
        </button>
      ))}
    </div>
  );
}

const METHOD_ICON: Record<Mode, typeof Banknote> = {
  efectivo: Banknote,
  transferencia: ArrowLeftRight,
  tarjeta: CreditCard,
  mixto: Split,
};

export function CobroPanel({
  open,
  draft,
  onClose,
  onConfirmed,
}: {
  open: boolean;
  draft: CobroDraft | null;
  onClose: () => void;
  onConfirmed?: (payment: Payment) => void;
}) {
  const { addPayment, commissionPctFor, today } = useMoney();
  const { businessType } = useApp();
  const pros = useMemo(() => professionalsFor(businessType), [businessType]);

  // Cobro manual (desde el módulo Pagos): identidad editable.
  const editable = draft?.source === "manual";
  const [clientNameI, setClientNameI] = useState("");
  const [serviceI, setServiceI] = useState("");
  const [proIdI, setProIdI] = useState("");

  const [amount, setAmount] = useState("0");
  const [discKind, setDiscKind] = useState<"monto" | "porciento">("monto");
  const [discVal, setDiscVal] = useState("");
  const [tipKind, setTipKind] = useState<"monto" | "porciento">("porciento");
  const [tipVal, setTipVal] = useState("");
  const [itbis, setItbis] = useState(false);
  const [mode, setMode] = useState<Mode>("efectivo");
  const [mix, setMix] = useState({ efectivo: "", transferencia: "", tarjeta: "" });
  const [cashReceived, setCashReceived] = useState("");
  const [reference, setReference] = useState("");
  const [success, setSuccess] = useState<Payment | null>(null);
  const lastOpen = useRef(false);

  const activeProId = editable ? proIdI : draft?.professionalId;
  const activeProName =
    pros.find((p) => p.id === activeProId)?.name ?? draft?.professionalName ?? "";
  const commissionPct = activeProId ? commissionPctFor(activeProId) : 0;

  // Reinicia el formulario cada vez que se abre con un draft nuevo.
  useEffect(() => {
    if (open && !lastOpen.current && draft) {
      setClientNameI(draft.clientName);
      setServiceI(draft.service);
      setProIdI(draft.professionalId || pros[0]?.id || "");
      setAmount(String(draft.serviceAmount));
      setDiscKind("monto");
      setDiscVal("");
      setTipKind("porciento");
      setTipVal("");
      setItbis(false);
      setMode("efectivo");
      setMix({ efectivo: "", transferencia: "", tarjeta: "" });
      setCashReceived("");
      setReference("");
      setSuccess(null);
    }
    lastOpen.current = open;
  }, [open, draft]);

  // Total base (sin depender de los splits) para el modo simple.
  const baseInput = useMemo(
    () => ({
      serviceAmount: num(amount),
      discountKind: discKind,
      discountValue: num(discVal),
      tipKind,
      tipValue: num(tipVal),
      includeItbis: itbis,
      commissionPct,
      splits: [] as { method: PaymentMethod; amount: number }[],
    }),
    [amount, discKind, discVal, tipKind, tipVal, itbis, commissionPct]
  );

  const baseTotalCents = useMemo(
    () => computeCobro(baseInput).totalCents,
    [baseInput]
  );
  const totalPesos = fromCents(baseTotalCents);

  // Construye los splits según el modo.
  const splits = useMemo(() => {
    if (mode === "mixto") {
      const list = [
        { method: "efectivo" as const, amount: num(mix.efectivo) },
        {
          method: "transferencia" as const,
          amount: num(mix.transferencia),
          reference: reference || undefined,
        },
        { method: "tarjeta" as const, amount: num(mix.tarjeta) },
      ];
      return list.filter((s) => s.amount > 0);
    }
    return [
      {
        method: mode,
        amount: totalPesos,
        reference: mode === "transferencia" ? reference || undefined : undefined,
      },
    ];
  }, [mode, mix, reference, totalPesos]);

  const hasCash =
    mode === "efectivo" || (mode === "mixto" && num(mix.efectivo) > 0);

  const bd = useMemo(
    () =>
      computeCobro({
        ...baseInput,
        splits,
        cashReceived: hasCash ? num(cashReceived) : undefined,
      }),
    [baseInput, splits, hasCash, cashReceived]
  );

  const identityOk =
    !editable || (clientNameI.trim() !== "" && serviceI.trim() !== "" && !!proIdI);
  const canConfirm = bd.totalCents > 0 && bd.isExact && identityOk;

  function confirm() {
    if (!draft || !canConfirm) return;
    const payload: NewPayment = {
      source: draft.source,
      appointmentId: draft.appointmentId,
      clientName: editable ? clientNameI.trim() : draft.clientName,
      service: editable ? serviceI.trim() : draft.service,
      professionalId: activeProId ?? draft.professionalId,
      professionalName: activeProName || draft.professionalName,
      date: today,
      serviceAmount: bd.serviceCents,
      discount: bd.discountCents,
      subtotal: bd.subtotalCents,
      itbis: bd.itbisCents,
      tip: bd.tipCents,
      total: bd.totalCents,
      commission: bd.commissionCents,
      commissionPct,
      splits: bd.splits,
      cashReceived: hasCash ? bd.cashReceivedCents : undefined,
      change: hasCash ? bd.changeCents : undefined,
    };
    const payment = addPayment(payload);
    setSuccess(payment);
    onConfirmed?.(payment);
  }

  if (!draft) return null;

  const mixAssignedCents = bd.paidCents;
  const mixRemainingCents = bd.totalCents - mixAssignedCents;

  return (
    <Modal open={open} onClose={onClose} title={success ? "" : "Cobrar"}>
      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="ok"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              className="grid h-20 w-20 place-items-center rounded-full bg-accent text-accent-contrast shadow-glow"
            >
              <Check size={40} strokeWidth={3} />
            </motion.div>
            <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
              ¡Cobrado!
            </p>
            <p className="mt-1 text-sm text-muted">
              {success.clientName} · {success.service}
            </p>
            <p className="mt-4 font-display text-4xl font-semibold tabular">
              {formatRD(success.total)}
            </p>
            {!!success.change && success.change > 0 && (
              <p className="mt-2 text-sm text-muted">
                Devuelta:{" "}
                <span className="font-semibold tabular text-fg">
                  {formatRD(success.change)}
                </span>
              </p>
            )}
            <p className="mt-3 text-[11px] text-muted">
              NCF {success.ncf} · simulado para demostración
            </p>
            <Button className="mt-6" onClick={onClose} fullWidth>
              Listo
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {/* Resumen de la cita (o identidad editable en cobro manual) */}
            {editable ? (
              <div className="space-y-2 rounded-xl border border-border bg-surface-2/40 p-3">
                <input
                  value={clientNameI}
                  onChange={(e) => setClientNameI(e.target.value)}
                  placeholder="Nombre del cliente"
                  className={inputCls}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={serviceI}
                    onChange={(e) => setServiceI(e.target.value)}
                    placeholder="Servicio o producto"
                    className={inputCls}
                  />
                  <select
                    value={proIdI}
                    onChange={(e) => setProIdI(e.target.value)}
                    className={inputCls}
                  >
                    {pros.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-2/40 p-3">
                <p className="font-display text-base font-semibold tracking-tight">
                  {draft.clientName}
                </p>
                <p className="text-sm text-muted">
                  {draft.service} · {draft.professionalName}
                </p>
              </div>
            )}

            {/* Monto del servicio */}
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">
                Monto del servicio (RD$)
              </span>
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={cn(inputCls, "text-lg font-semibold")}
              />
            </label>

            {/* Descuento + Propina */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Descuento</span>
                  <Seg value={discKind} onChange={setDiscKind} />
                </div>
                <input
                  inputMode="decimal"
                  value={discVal}
                  onChange={(e) => setDiscVal(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-medium text-muted">Propina</span>
                  <Seg value={tipKind} onChange={setTipKind} />
                </div>
                <input
                  inputMode="decimal"
                  value={tipVal}
                  onChange={(e) => setTipVal(e.target.value)}
                  placeholder="0"
                  className={inputCls}
                />
              </div>
            </div>
            {/* Atajos de propina */}
            <div className="flex flex-wrap gap-1.5">
              {[0, 10, 15, 20].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setTipKind("porciento");
                    setTipVal(p === 0 ? "" : String(p));
                  }}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs text-muted transition-colors hover:border-accent/50 hover:text-accent"
                >
                  {p === 0 ? "Sin propina" : `${p}%`}
                </button>
              ))}
            </div>

            {/* ITBIS */}
            <button
              type="button"
              onClick={() => setItbis((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border bg-surface-2/30 px-3 py-2"
            >
              <span className="text-left text-sm">
                ITBIS 18%{" "}
                <span className="text-[11px] text-muted">(simulado)</span>
              </span>
              <span
                className={cn(
                  "relative h-5 w-9 rounded-full transition-colors",
                  itbis ? "bg-accent" : "bg-surface-2"
                )}
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all",
                    itbis ? "left-[18px]" : "left-0.5"
                  )}
                />
              </span>
            </button>

            {/* Método de pago */}
            <div>
              <span className="mb-1.5 block text-xs font-medium text-muted">
                Método de pago
              </span>
              <div className="grid grid-cols-4 gap-1.5">
                {(["efectivo", "transferencia", "tarjeta", "mixto"] as Mode[]).map(
                  (m) => {
                    const Icon = METHOD_ICON[m];
                    const active = mode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMode(m)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-medium transition-colors",
                          active
                            ? "border-accent bg-accent-soft/50 text-accent"
                            : "border-border text-muted hover:text-fg"
                        )}
                      >
                        <Icon size={16} />
                        {m === "mixto" ? "Mixto" : METHOD_LABEL[m as PaymentMethod]}
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Detalle según método */}
            {mode === "mixto" && (
              <div className="space-y-2 rounded-xl border border-border bg-surface-2/30 p-3">
                {(["efectivo", "transferencia", "tarjeta"] as PaymentMethod[]).map(
                  (m) => (
                    <div key={m} className="flex items-center gap-2">
                      <span className="w-28 text-xs text-muted">
                        {METHOD_LABEL[m]}
                      </span>
                      <input
                        inputMode="decimal"
                        value={mix[m]}
                        onChange={(e) =>
                          setMix((p) => ({ ...p, [m]: e.target.value }))
                        }
                        placeholder="0"
                        className={inputCls}
                      />
                    </div>
                  )
                )}
                <p
                  className={cn(
                    "text-right text-xs tabular",
                    mixRemainingCents === 0
                      ? "text-[color:rgb(var(--st-completada))]"
                      : "text-muted"
                  )}
                >
                  {mixRemainingCents === 0
                    ? "✓ Cuadra"
                    : mixRemainingCents > 0
                    ? `Falta ${formatRD(mixRemainingCents)}`
                    : `Sobra ${formatRD(-mixRemainingCents)}`}
                </p>
              </div>
            )}

            {mode === "transferencia" && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-muted">
                  Referencia / voucher{" "}
                  <span className="text-[10px]">(verificación simulada)</span>
                </span>
                <input
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ej. TRX123456"
                  className={inputCls}
                />
              </label>
            )}

            {hasCash && (
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Efectivo recibido
                  </span>
                  <input
                    inputMode="decimal"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    placeholder="0"
                    className={inputCls}
                  />
                </label>
                <div className="block">
                  <span className="mb-1 block text-xs font-medium text-muted">
                    Devuelta
                  </span>
                  <div
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-semibold tabular",
                      bd.insufficientCash
                        ? "border-[color:rgb(var(--st-cancelada))] text-[color:rgb(var(--st-cancelada))]"
                        : "border-border text-fg"
                    )}
                  >
                    {bd.insufficientCash
                      ? "Falta efectivo"
                      : formatRD(bd.changeCents)}
                  </div>
                </div>
              </div>
            )}

            {/* Desglose + total */}
            <div className="rounded-xl border border-border bg-surface-2/40 p-3 text-sm">
              <Line label="Subtotal" value={formatRD2(bd.subtotalCents)} />
              {bd.discountCents > 0 && (
                <Line
                  label="Descuento"
                  value={`− ${formatRD2(bd.discountCents)}`}
                />
              )}
              {bd.itbisCents > 0 && (
                <Line label="ITBIS 18% (sim.)" value={formatRD2(bd.itbisCents)} />
              )}
              {bd.tipCents > 0 && (
                <Line label="Propina" value={formatRD2(bd.tipCents)} />
              )}
              <Line
                label={`Comisión ${commissionPct}% · ${activeProName}`}
                value={formatRD2(bd.commissionCents)}
                muted
              />
              <div className="mt-2 flex items-center justify-between border-t border-border pt-2">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display text-2xl font-semibold tabular">
                  {formatRD(bd.totalCents)}
                </span>
              </div>
            </div>

            <Button
              fullWidth
              size="lg"
              disabled={!canConfirm}
              onClick={confirm}
            >
              Cobrar {formatRD(bd.totalCents)}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </Modal>
  );
}

function Line({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className={cn("text-xs", muted ? "text-muted" : "text-fg/80")}>
        {label}
      </span>
      <span className={cn("tabular text-sm", muted ? "text-muted" : "text-fg")}>
        {value}
      </span>
    </div>
  );
}
