import { AppProviders } from "@/components/providers/AppProviders";

/**
 * El login usa la piel NEUTRAL (champagne/grafito de marca JM): antes de
 * autenticarse no sabemos la piel de la cuenta. El script aplica data-skin
 * antes del primer paint para evitar parpadeo desde la piel por defecto.
 */
export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders initialSkin="neutral">
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.setAttribute('data-skin','neutral');`,
        }}
      />
      {children}
    </AppProviders>
  );
}
