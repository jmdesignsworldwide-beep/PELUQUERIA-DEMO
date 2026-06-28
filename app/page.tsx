import { redirect } from "next/navigation";

export default function Home() {
  // La raíz lleva al área autenticada; el middleware manda a /login si no hay
  // sesión. (/demo sigue público como showcase del sistema de diseño.)
  redirect("/app");
}
