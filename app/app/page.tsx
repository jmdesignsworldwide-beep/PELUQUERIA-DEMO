import {
  CalendarDays,
  Scissors,
  Users,
  Wallet,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSkin } from "@/lib/skins";
import { Card } from "@/components/ui/Card";
import { Reveal } from "@/components/ui/Reveal";

export default async function AppHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_type, business_name, role")
    .eq("id", user!.id)
    .single();

  const skin = getSkin(profile?.business_type as never);
  const v = skin.vocab;

  const modules = [
    { label: "Citas", icon: CalendarDays },
    { label: v.customerPlural, icon: Users },
    { label: v.professionalPlural, icon: Briefcase },
    { label: "Servicios", icon: Scissors },
    { label: "Pagos", icon: Wallet },
    { label: "Caja", icon: Sparkles },
  ];

  return (
    <Reveal className="space-y-8">
      <Reveal.Item>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs text-muted">
          <Sparkles size={13} className="text-metallic" />
          Sesión iniciada · piel amarrada a tu cuenta
        </span>
      </Reveal.Item>

      <Reveal.Item>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Bienvenida a{" "}
          <span className="text-accent">{skin.businessName}</span>.
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Tu cuenta está configurada como{" "}
          <span className="text-fg">{skin.label}</span>. Todo el sistema usa el
          vocabulario y los colores de esta piel.
        </p>
      </Reveal.Item>

      {/* Prueba visual del vocabulario por piel */}
      <Reveal.Item>
        <Card className="p-6">
          <p className="mb-4 text-xs uppercase tracking-[0.2em] text-muted">
            Vocabulario de tu piel
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted">Profesional</p>
              <p className="mt-1 font-display text-2xl font-semibold text-accent">
                {v.professional}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted">Persona atendida</p>
              <p className="mt-1 font-display text-2xl font-semibold text-accent">
                {v.customer}
              </p>
            </div>
          </div>
        </Card>
      </Reveal.Item>

      {/* Teaser de módulos — el layout completo (sidebar) llega en la próxima sub-pieza */}
      <Reveal.Item>
        <p className="mb-3 text-sm text-muted">
          Módulos del sistema (navegación completa en la próxima entrega):
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {modules.map((m) => {
            const Icon = m.icon;
            return (
              <Card key={m.label} className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-surface-2 text-accent">
                  <Icon size={18} />
                </span>
                <span className="font-medium">{m.label}</span>
              </Card>
            );
          })}
        </div>
      </Reveal.Item>
    </Reveal>
  );
}
