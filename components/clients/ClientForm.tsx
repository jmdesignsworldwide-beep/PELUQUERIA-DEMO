"use client";

import { useEffect, useRef, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { AlertCircle, Camera, Star } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Avatar } from "./Avatar";
import { techFieldsFor, techSheetTitle } from "@/lib/techSheet";
import { formatCedula, formatPhone } from "@/lib/validation";
import { saveClient, type ClientFormState } from "@/app/app/clientes/actions";
import type { ClientFull } from "@/lib/clients";

const init: ClientFormState = {};

function labelCls() {
  return "mb-1.5 block text-sm font-medium text-fg/80";
}
function inputCls() {
  return "h-11 w-full rounded-xl border border-border bg-surface-2/60 px-3.5 text-fg outline-none transition-colors placeholder:text-muted/60 focus:border-accent/60";
}

function SubmitBar({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <div className="sticky bottom-0 -mx-5 mt-2 flex justify-end gap-3 border-t border-border bg-surface/80 px-5 py-3 backdrop-blur">
      <Button type="submit" loading={pending}>
        {editing ? "Guardar cambios" : "Crear"}
      </Button>
    </div>
  );
}

export function ClientForm({
  open,
  onClose,
  initial,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  initial?: ClientFull | null;
  onSaved?: (id?: string) => void;
}) {
  const { skin, businessType } = useApp();
  const v = skin.vocab;
  const editing = !!initial;
  const [state, formAction] = useFormState(saveClient, init);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      onSaved?.(state.id);
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.ok, state.id]);

  const techFields = techFieldsFor(businessType);
  const ts = initial?.techSheet ?? {};

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        editing
          ? `Editar ${v.customer.toLowerCase()}`
          : `Nueva ${v.customer.toLowerCase()}`
      }
    >
      <form action={formAction} className="space-y-5">
        {initial && <input type="hidden" name="id" value={initial.id} />}

        {/* Foto */}
        <div className="flex items-center gap-4">
          <Avatar
            name={initial?.name ?? "?"}
            photoUrl={preview ?? initial?.photoUrl}
            size={72}
          />
          <div>
            <input
              ref={fileRef}
              type="file"
              name="photo"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Camera size={15} /> Subir foto
            </Button>
            <p className="mt-1 text-xs text-muted">JPG o PNG, hasta 3 MB.</p>
          </div>
        </div>

        {/* Datos personales */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelCls()}>Nombre completo *</label>
            <input
              name="name"
              required
              defaultValue={initial?.name}
              placeholder="Ej. Rosa Mejía"
              className={inputCls()}
            />
          </div>
          <div>
            <label className={labelCls()}>Teléfono</label>
            <input
              name="phone"
              inputMode="numeric"
              defaultValue={initial?.phone ? formatPhone(initial.phone) : ""}
              placeholder="809-555-1234"
              className={inputCls()}
              onInput={(e) => {
                e.currentTarget.value = formatPhone(e.currentTarget.value);
              }}
            />
          </div>
          <div>
            <label className={labelCls()}>Cédula</label>
            <input
              name="cedula"
              inputMode="numeric"
              defaultValue={initial?.cedula ? formatCedula(initial.cedula) : ""}
              placeholder="001-1234567-8"
              className={inputCls()}
              onInput={(e) => {
                e.currentTarget.value = formatCedula(e.currentTarget.value);
              }}
            />
          </div>
          <div>
            <label className={labelCls()}>Correo</label>
            <input
              name="email"
              type="email"
              defaultValue={initial?.email ?? ""}
              placeholder="correo@gmail.com"
              className={inputCls()}
            />
          </div>
          <div>
            <label className={labelCls()}>Fecha de nacimiento</label>
            <input
              name="birthdate"
              type="date"
              defaultValue={initial?.birthdate ?? ""}
              className={inputCls()}
            />
          </div>
          <div>
            <label className={labelCls()}>Balance (RD$)</label>
            <input
              name="balance"
              type="number"
              step="1"
              defaultValue={initial?.balance ?? 0}
              className={inputCls()}
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 self-end pb-1">
            <input
              type="checkbox"
              name="is_vip"
              defaultChecked={initial?.isVip}
              className="h-4 w-4 accent-[rgb(var(--accent))]"
            />
            <span className="inline-flex items-center gap-1 text-sm">
              <Star size={14} className="text-metallic" /> Marcar como VIP
            </span>
          </label>
        </div>

        {/* Ficha técnica por piel */}
        <div>
          <p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted">
            {techSheetTitle(businessType)}
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {techFields.map((f) => (
              <div key={f.key}>
                <label className={labelCls()}>{f.label}</label>
                {f.type === "select" ? (
                  <select
                    name={`tech.${f.key}`}
                    defaultValue={ts[f.key] ?? ""}
                    className={inputCls()}
                  >
                    <option value="">—</option>
                    {f.options?.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    name={`tech.${f.key}`}
                    defaultValue={ts[f.key] ?? ""}
                    placeholder={f.placeholder}
                    className={inputCls()}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Notas */}
        <div>
          <label className={labelCls()}>Notas internas</label>
          <textarea
            name="notes"
            rows={3}
            defaultValue={initial?.notes ?? ""}
            placeholder="Preferencias, observaciones del staff…"
            className={inputCls() + " h-auto py-2.5"}
          />
        </div>

        {state.error && (
          <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-500">
            <AlertCircle size={16} className="shrink-0" />
            {state.error}
          </div>
        )}

        <SubmitBar editing={editing} />
      </form>
    </Modal>
  );
}
