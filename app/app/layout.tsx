import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppProviders } from "@/components/providers/AppProviders";
import { isBusinessType } from "@/lib/skins";
import { AppChrome } from "./AppChrome";

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
    .select("username, business_type, business_name")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  const skin = isBusinessType(profile.business_type)
    ? profile.business_type
    : "salon";

  return (
    <AppProviders initialSkin={skin}>
      {/* Aplica la piel de la cuenta antes del primer paint (sin parpadeo). */}
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-skin','${skin}');`,
        }}
      />
      <AppChrome
        businessName={profile.business_name}
        username={profile.username}
      >
        {children}
      </AppChrome>
    </AppProviders>
  );
}
