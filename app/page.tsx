import { redirect } from "next/navigation";

export default function Home() {
  // Tanda 1: la raíz lleva al showcase de primitivos para aprobación visual.
  // En tandas siguientes "/" enrutará a login / dashboard según la sesión.
  redirect("/demo");
}
