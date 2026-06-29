import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppProviders } from "@/components/providers/AppProviders";
import { MoneyProvider } from "@/components/providers/MoneyProvider";
import { isBusinessType } from "@/lib/skins";
import { AppShell } from "@/components/app/AppShell";

/**
 * Layout del área autenticada. Lee el perfil de la cuenta EN EL SERVIDOR y
 * amarra la piel (data-skin) según su business_type. El cliente no la elige.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, business_type, role, business_name, is_active, access_expires_at"
    )
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Acceso temporal REAL: si la cuenta está inactiva o vencida, cerrar sesión.
  // (También se valida en el login; esto cubre la expiración a mitad de sesión.)
  if (!profile.is_active) {
    await supabase.auth.signOut();
    redirect("/login?estado=inactivo");
  }
  if (
    profile.access_expires_at &&
    new Date(profile.access_expires_at).getTime() < Date.now()
  ) {
    await supabase.auth.signOut();
    redirect("/login?estado=vencido");
  }

  const skin = isBusinessType(profile.business_type)
    ? profile.business_type
    : "salon";
  const role = profile.role === "admin" ? "admin" : "cliente";

  return (
    <AppProviders
      initialSkin={skin}
      role={role}
      username={profile.username}
      businessName={profile.business_name}
    >
      {/* Aplica la piel de la cuenta antes del primer paint (sin parpadeo). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-skin','${skin}');`,
        }}
      />
      <MoneyProvider>
        <AppShell username={profile.username}>{children}</AppShell>
      </MoneyProvider>
    </AppProviders>
  );
}
