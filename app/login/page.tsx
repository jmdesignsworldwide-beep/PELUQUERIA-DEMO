import { LoginPanel } from "./LoginPanel";

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

  return <LoginPanel aviso={aviso} />;
}
