"use client";

/**
 * Gestión de cuentas (SOLO admin). UI sobre las server actions REALES de
 * configuracion/actions.ts. El rol se valida también en el servidor en cada
 * acción, así que esta UI nunca es la única barrera.
 */

import { useCallback, useEffect, useState } from "react";
import {
  UserPlus,
  Users,
  RefreshCw,
  Check,
  Copy,
  ShieldCheck,
  Infinity as InfinityIcon,
  Power,
  CalendarPlus,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { BusinessType } from "@/lib/skins";
import {
  AccountRow,
  createClientAccount,
  listAccounts,
  renewAccount,
  setAccountActive,
  setNoExpiry,
} from "@/app/app/configuracion/actions";

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";

function genPassword(): string {
  const cs = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let p = "";
  const arr = new Uint32Array(16);
  crypto.getRandomValues(arr);
  for (let i = 0; i < 16; i++) p += cs[arr[i] % cs.length];
  return `${p.slice(0, 4)}-${p.slice(4, 8)}-${p.slice(8, 12)}-${p.slice(12, 16)}`;
}

function daysLeft(expiry: string | null): number | null {
  if (!expiry) return null;
  return Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
}

function StatusPill({ acc }: { acc: AccountRow }) {
  const dl = daysLeft(acc.access_expires_at);
  let label: string;
  let color: string;
  if (!acc.is_active) {
    label = "Inactiva";
    color = "--st-noshow";
  } else if (dl !== null && dl < 0) {
    label = "Vencida";
    color = "--st-cancelada";
  } else if (dl !== null && dl <= 3) {
    label = `${dl} día${dl === 1 ? "" : "s"}`;
    color = "--st-pendiente";
  } else if (dl === null) {
    label = "Sin vencimiento";
    color = "--st-completada";
  } else {
    label = `${dl} días`;
    color = "--st-completada";
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: `rgb(var(${color}))`,
        background: `rgb(var(${color}) / 0.12)`,
        boxShadow: `inset 0 0 0 1px rgb(var(${color}) / 0.3)`,
      }}
    >
      {label}
    </span>
  );
}

export function CuentasAdmin() {
  const [accounts, setAccounts] = useState<AccountRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<AccountRow | null>(null);
  const [created, setCreated] = useState<{ username: string; password: string } | null>(
    null
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAccounts();
      if (res.ok) {
        setAccounts(res.data ?? []);
        setError(null);
      } else {
        setError(res.error);
      }
    } catch {
      setError("No se pudo cargar la lista de cuentas.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="overflow-hidden rounded-2xl border border-border glass">
      <div
        aria-hidden
        className="pointer-events-none h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
        }}
      />
      <div className="flex items-center justify-between p-5 pb-3">
        <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
          <Users size={13} /> Gestión de cuentas
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            aria-label="Recargar"
            className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted transition-colors hover:text-accent"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <UserPlus size={15} /> Crear cuenta
          </Button>
        </div>
      </div>

      <div className="px-5 pb-5">
        {error ? (
          <div
            className="rounded-xl px-3 py-2 text-sm"
            style={{
              color: "rgb(var(--st-cancelada))",
              background: "rgb(var(--st-cancelada) / 0.1)",
            }}
          >
            {error === "No autorizado."
              ? "Necesitas entrar como admin para ver las cuentas."
              : error}
          </div>
        ) : loading && accounts.length === 0 ? (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-surface-2/60" />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <p className="py-4 text-sm text-muted">Aún no hay cuentas.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => acc.role !== "admin" && setSelected(acc)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2/30 p-3 text-left transition-colors",
                  acc.role === "admin"
                    ? "cursor-default opacity-90"
                    : "hover:border-accent/40 hover:bg-surface-2/60"
                )}
              >
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {acc.username}
                    {acc.role === "admin" && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-1.5 text-[10px] text-accent">
                        <ShieldCheck size={10} /> admin
                      </span>
                    )}
                  </p>
                  <p className="truncate text-[11px] text-muted">
                    {acc.business_name} ·{" "}
                    {acc.business_type === "salon" ? "Salón" : "Barbería"}
                  </p>
                </div>
                <StatusPill acc={acc} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Crear cuenta */}
      <CrearCuentaModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(creds) => {
          setCreateOpen(false);
          setCreated(creds);
          load();
        }}
      />

      {/* Credenciales recién creadas */}
      <Modal open={!!created} onClose={() => setCreated(null)} title="Cuenta creada">
        {created && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Comparte estas credenciales con tu cliente. La contraseña no se vuelve
              a mostrar.
            </p>
            <CredRow label="Usuario" value={created.username} />
            <CredRow label="Contraseña" value={created.password} />
            <Button fullWidth onClick={() => setCreated(null)}>
              Listo
            </Button>
          </div>
        )}
      </Modal>

      {/* Detalle / acciones de una cuenta */}
      <DetalleCuentaModal
        account={selected}
        onClose={() => setSelected(null)}
        onChanged={() => {
          setSelected(null);
          load();
        }}
      />
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 p-2">
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="truncate font-medium tabular">{value}</p>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
        className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:text-accent"
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
}

const DAY_OPTIONS = [
  { label: "7 días", value: 7 },
  { label: "15 días", value: 15 },
  { label: "30 días", value: 30 },
  { label: "Personalizado", value: -1 },
  { label: "Sin vencimiento", value: 0 },
];

function CrearCuentaModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (creds: { username: string; password: string }) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [businessType, setBusinessType] = useState<BusinessType>("salon");
  const [businessName, setBusinessName] = useState("");
  const [dayChoice, setDayChoice] = useState(7);
  const [customDays, setCustomDays] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setUsername("");
      setPassword(genPassword());
      setBusinessType("salon");
      setBusinessName("");
      setDayChoice(7);
      setCustomDays("");
      setErr(null);
    }
  }, [open]);

  function resolvedDays(): number | null {
    if (dayChoice === 0) return null; // sin vencimiento
    if (dayChoice === -1) return Math.max(1, parseInt(customDays || "0", 10));
    return dayChoice;
  }

  async function submit() {
    setBusy(true);
    setErr(null);
    const res = await createClientAccount({
      username,
      password,
      businessType,
      businessName,
      days: resolvedDays(),
    });
    setBusy(false);
    if (res.ok) onCreated({ username: username.trim().toLowerCase(), password });
    else setErr(res.error);
  }

  return (
    <Modal open={open} onClose={onClose} title="Crear cuenta de cliente">
      <div className="space-y-3">
        <Field label="Usuario">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="ej. salon-maria"
            className={inputCls}
          />
        </Field>
        <Field label="Contraseña">
          <div className="flex gap-2">
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn(inputCls, "tabular")}
            />
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPassword(genPassword())}
              className="shrink-0"
            >
              <RefreshCw size={14} /> Generar
            </Button>
          </div>
        </Field>
        <Field label="Nombre del negocio">
          <input
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ej. Salón María"
            className={inputCls}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Piel">
            <div className="flex rounded-xl border border-border p-0.5 text-sm">
              {(["salon", "barberia"] as BusinessType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setBusinessType(t)}
                  className={cn(
                    "flex-1 rounded-lg px-2 py-1.5 font-medium transition-colors",
                    businessType === t
                      ? "bg-accent text-accent-contrast"
                      : "text-muted hover:text-fg"
                  )}
                >
                  {t === "salon" ? "Salón" : "Barbería"}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Acceso">
            <select
              value={dayChoice}
              onChange={(e) => setDayChoice(Number(e.target.value))}
              className={inputCls}
            >
              {DAY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        {dayChoice === -1 && (
          <Field label="Días personalizados">
            <input
              inputMode="numeric"
              value={customDays}
              onChange={(e) => setCustomDays(e.target.value)}
              placeholder="ej. 45"
              className={cn(inputCls, "tabular")}
            />
          </Field>
        )}

        {err && (
          <p
            className="rounded-lg px-3 py-2 text-sm"
            style={{
              color: "rgb(var(--st-cancelada))",
              background: "rgb(var(--st-cancelada) / 0.1)",
            }}
          >
            {err}
          </p>
        )}

        <Button fullWidth loading={busy} onClick={submit}>
          Crear cuenta
        </Button>
      </div>
    </Modal>
  );
}

function DetalleCuentaModal({
  account,
  onClose,
  onChanged,
}: {
  account: AccountRow | null;
  onClose: () => void;
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [customDays, setCustomDays] = useState("");

  async function run(fn: () => Promise<{ ok: boolean }>) {
    setBusy(true);
    await fn();
    setBusy(false);
    onChanged();
  }

  return (
    <Modal
      open={!!account}
      onClose={onClose}
      title={account ? account.username : ""}
    >
      {account && (
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-surface-2/40 p-3">
            <p className="text-sm font-medium">{account.business_name}</p>
            <p className="text-[11px] text-muted">
              {account.business_type === "salon" ? "Salón" : "Barbería"} ·{" "}
              {account.access_expires_at
                ? `Vence ${new Date(account.access_expires_at).toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" })}`
                : "Sin vencimiento"}
            </p>
            <div className="mt-2">
              <StatusPill acc={account} />
            </div>
          </div>

          <div>
            <p className="mb-2 flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted">
              <CalendarPlus size={12} /> Renovar / extender
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[7, 15, 30].map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant="secondary"
                  disabled={busy}
                  onClick={() => run(() => renewAccount(account.id, d))}
                >
                  +{d} días
                </Button>
              ))}
              <Button
                size="sm"
                variant="secondary"
                disabled={busy}
                onClick={() => run(() => setNoExpiry(account.id))}
              >
                <InfinityIcon size={14} /> Sin vencimiento
              </Button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                inputMode="numeric"
                value={customDays}
                onChange={(e) => setCustomDays(e.target.value)}
                placeholder="Días personalizados"
                className={cn(inputCls, "tabular")}
              />
              <Button
                size="sm"
                disabled={busy || !customDays}
                onClick={() =>
                  run(() => renewAccount(account.id, parseInt(customDays, 10) || 0))
                }
                className="shrink-0"
              >
                Aplicar
              </Button>
            </div>
          </div>

          <div className="border-t border-border pt-3">
            <Button
              fullWidth
              variant="secondary"
              loading={busy}
              onClick={() => run(() => setAccountActive(account.id, !account.is_active))}
            >
              <Power size={15} />
              {account.is_active ? "Desactivar cuenta" : "Activar cuenta"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
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
      <span className="mb-1 block text-xs font-medium text-muted">{label}</span>
      {children}
    </label>
  );
}
