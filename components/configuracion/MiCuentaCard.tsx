"use client";

/**
 * "Mi cuenta" — visible para cualquier rol. Muestra el estado del propio
 * acceso (días restantes) y permite cambiar la PROPIA contraseña (importante
 * para que la admin la cambie a una privada antes de entregar el demo).
 */

import { useState } from "react";
import { UserCircle, KeyRound, Check, ShieldCheck } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { changeOwnPassword } from "@/app/app/configuracion/actions";

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2/40 px-3 py-2 text-sm text-fg outline-none transition-colors focus:border-accent/60";

function accessLabel(expiry: string | null): { text: string; tone: string } {
  if (!expiry) return { text: "Sin vencimiento", tone: "--st-completada" };
  const dl = Math.ceil((new Date(expiry).getTime() - Date.now()) / 86_400_000);
  if (dl < 0) return { text: "Vencido", tone: "--st-cancelada" };
  if (dl <= 3)
    return { text: `Vence en ${dl} día${dl === 1 ? "" : "s"}`, tone: "--st-pendiente" };
  return { text: `Vence en ${dl} días`, tone: "--st-completada" };
}

export function MiCuentaCard() {
  const { username, role, accessExpiresAt } = useApp();
  const access = accessLabel(accessExpiresAt);

  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    if (pw.length < 6) {
      setMsg({ ok: false, text: "La contraseña debe tener al menos 6 caracteres." });
      return;
    }
    if (pw !== pw2) {
      setMsg({ ok: false, text: "Las contraseñas no coinciden." });
      return;
    }
    setBusy(true);
    let res;
    try {
      res = await changeOwnPassword(pw);
    } catch {
      res = { ok: false as const, error: "No se pudo actualizar." };
    }
    setBusy(false);
    if (res.ok) {
      setMsg({ ok: true, text: "Contraseña actualizada." });
      setPw("");
      setPw2("");
    } else {
      setMsg({ ok: false, text: res.error });
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border glass p-5">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
        <UserCircle size={13} /> Mi cuenta
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="text-[11px] text-muted">Usuario</p>
          <p className="flex items-center gap-1.5 font-medium">
            {username || "—"}
            {role === "admin" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 px-1.5 text-[10px] text-accent">
                <ShieldCheck size={10} /> admin
              </span>
            )}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface-2/40 p-3">
          <p className="text-[11px] text-muted">Estado del acceso</p>
          <p className="font-medium" style={{ color: `rgb(var(${access.tone}))` }}>
            {access.text}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
          <KeyRound size={13} /> Cambiar contraseña
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Nueva contraseña"
            autoComplete="new-password"
            className={inputCls}
          />
          <input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Confirmar contraseña"
            autoComplete="new-password"
            className={inputCls}
          />
        </div>
        {msg && (
          <p
            className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm"
            style={{
              color: msg.ok ? "rgb(var(--st-completada))" : "rgb(var(--st-cancelada))",
              background: msg.ok
                ? "rgb(var(--st-completada) / 0.1)"
                : "rgb(var(--st-cancelada) / 0.1)",
            }}
          >
            {msg.ok && <Check size={14} />}
            {msg.text}
          </p>
        )}
        <Button
          className={cn("mt-3")}
          loading={busy}
          disabled={!pw || !pw2}
          onClick={submit}
        >
          Actualizar contraseña
        </Button>
      </div>
    </div>
  );
}
