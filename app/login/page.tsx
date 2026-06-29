import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Card } from "@/components/ui/Card";
import { LoginForm } from "./LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { estado?: string };
}) {
  const estado = searchParams?.estado;
  const aviso =
    estado === "vencido"
      ? "Tu acceso ha expirado. Contacta a JM Designs para renovarlo."
      : estado === "inactivo"
      ? "Tu cuenta está inactiva. Contacta a JM Designs."
      : null;

  return (
    <main className="relative grid min-h-dvh place-items-center px-4 py-10">
      <AuroraBackground />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {aviso && (
          <div
            className="mb-5 rounded-xl border px-4 py-3 text-sm"
            style={{
              borderColor: "rgb(200 90 90 / 0.45)",
              background: "rgb(200 90 90 / 0.12)",
              color: "rgb(214 120 120)",
            }}
          >
            {aviso}
          </div>
        )}
        {/* Marca neutral JM */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-accent text-accent-contrast shadow-glow">
            <span className="font-display text-2xl font-semibold">JM</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            Sistema de Gestión
          </h1>
          <p className="mt-1 text-sm text-muted">
            Entra con tu usuario y contraseña.
          </p>
        </div>

        <Card interactive={false} className="p-6 sm:p-7">
          <LoginForm />
        </Card>

        <p className="mt-6 text-center text-xs text-muted">
          Acceso privado · JM Beauty
        </p>
      </div>
    </main>
  );
}
