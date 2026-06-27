import { AppProviders } from "@/components/providers/AppProviders";

/**
 * La página demo permite cambiar de piel en runtime (allowSkinSwitch) para que
 * la dueña apruebe ambas pieles en una sola pantalla. En la app real la piel
 * viene amarrada a la cuenta y NO se puede cambiar.
 */
export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppProviders initialSkin="salon" allowSkinSwitch>
      {children}
    </AppProviders>
  );
}
