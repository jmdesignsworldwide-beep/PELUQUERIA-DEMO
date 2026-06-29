"use client";

/**
 * "Tu link de reservas" — cierra el círculo del link público. Link + copiar
 * con feedback + QR generado en el sistema (sin servicios externos) + compartir
 * por WhatsApp. El QR se puede descargar para imprimir o subir a una historia.
 */

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Copy, Check, Download, MessageCircle, QrCode, Link as LinkIcon } from "lucide-react";
import { useApp } from "@/components/providers/AppProviders";
import { Button } from "@/components/ui/Button";

/** "JM Beauty Salón" → "jm-beauty-salon". */
function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function LinkReservasCard() {
  const { businessName, skin } = useApp();
  const name = businessName || skin.businessName;
  const slug = slugify(name) || "mi-negocio";

  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Origin real solo en el cliente (evita desajuste de hidratación).
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const link = origin ? `${origin}/reservar/${slug}` : `…/reservar/${slug}`;

  // Generar el QR cuando hay link. Módulos oscuros sobre blanco = siempre
  // nítido y escaneable, listo para imprimir (la librería exige color hex).
  useEffect(() => {
    if (!origin || !canvasRef.current) return;
    const opts = {
      margin: 1,
      color: { dark: "#141418", light: "#ffffff" },
      errorCorrectionLevel: "M" as const,
    };
    QRCode.toCanvas(canvasRef.current, link, { ...opts, width: 220 }).catch(
      () => {}
    );
    QRCode.toDataURL(link, { ...opts, width: 600, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => {});
  }, [link, origin]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard no disponible */
    }
  }

  function downloadQR() {
    if (!qrDataUrl) return;
    const a = document.createElement("a");
    a.href = qrDataUrl;
    a.download = `qr-reservas-${slug}.png`;
    a.click();
  }

  function shareWhatsApp() {
    const text = `Reserva tu cita aquí: ${link}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border glass shadow-soft">
      <div
        aria-hidden
        className="pointer-events-none h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(var(--metallic) / 0.6), transparent)",
        }}
      />
      <div className="grid gap-5 p-5 sm:grid-cols-[1fr_auto] sm:p-6">
        {/* Izquierda: link + acciones */}
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
            <LinkIcon size={13} /> Tu link de reservas
          </p>
          <p className="mt-2 max-w-md text-sm text-muted">
            Pega este link en tu Instagram, Facebook o WhatsApp y tus clientes
            reservan solos, 24/7.
          </p>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-surface-2/40 p-2">
            <span className="min-w-0 flex-1 truncate px-2 font-medium tabular">
              {link}
            </span>
            <Button size="sm" onClick={copy} className="shrink-0">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "¡Copiado!" : "Copiar"}
            </Button>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={shareWhatsApp}>
              <MessageCircle size={15} /> Compartir por WhatsApp
            </Button>
            <Button size="sm" variant="secondary" onClick={downloadQR}>
              <Download size={15} /> Descargar QR
            </Button>
          </div>
        </div>

        {/* Derecha: QR */}
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-2xl border border-border bg-white p-3 shadow-layered">
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className="block h-[180px] w-[180px] rounded-lg sm:h-[200px] sm:w-[200px]"
            />
          </div>
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <QrCode size={12} /> Para el mostrador o tu historia
          </p>
        </div>
      </div>
    </div>
  );
}
