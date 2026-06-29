import { Sparkles } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getSkin } from "@/lib/skins";
import { Card } from "@/components/ui/Card";
import { Reveal, RevealItem } from "@/components/ui/Reveal";
import { DashboardKpis } from "@/components/app/DashboardKpis";

export default async function AppHome() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_type")
    .eq("id", user!.id)
    .single();

  const skin = getSkin(profile?.business_type as never);
  const v = skin.vocab;

  return (
    <Reveal className="space-y-8">
      <RevealItem>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border glass px-3 py-1 text-xs text-muted">
          <Sparkles size={13} className="text-metallic" />
          {skin.label} · Panel de control
        </span>
      </RevealItem>

      <RevealItem>
        <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl">
          Bienvenida a <span className="text-accent">{skin.businessName}</span>.
        </h1>
        <p className="mt-3 max-w-xl text-muted">
          Este es tu panel. Usa el menú lateral para moverte entre módulos. Los
          números de abajo son de ejemplo para mostrar el estilo.
        </p>
      </RevealItem>

      <RevealItem>
        <DashboardKpis />
      </RevealItem>

      <RevealItem>
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
      </RevealItem>
    </Reveal>
  );
}
