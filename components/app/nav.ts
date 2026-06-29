import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  Sparkles,
  Wallet,
  Calculator,
  Settings,
  Package,
  Truck,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import type { SkinVocab } from "@/lib/skins";

export type NavItem = {
  href: string;
  icon: LucideIcon;
  /** Etiqueta; puede depender del vocabulario de la piel. */
  label: (v: SkinVocab) => string;
};

/** Módulos del sistema. Ninguno es botón muerto: cada uno tiene su ruta. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/app", icon: LayoutDashboard, label: () => "Panel" },
  { href: "/app/citas", icon: CalendarDays, label: () => "Citas" },
  { href: "/app/clientes", icon: Users, label: (v) => v.customerPlural },
  {
    href: "/app/profesionales",
    icon: Scissors,
    label: (v) => v.professionalPlural,
  },
  { href: "/app/servicios", icon: Sparkles, label: () => "Servicios" },
  { href: "/app/pagos", icon: Wallet, label: () => "Pagos" },
  { href: "/app/caja", icon: Calculator, label: () => "Caja" },
  { href: "/app/inventario", icon: Package, label: () => "Inventario" },
  { href: "/app/proveedores", icon: Truck, label: () => "Proveedores" },
  { href: "/app/ventas", icon: ShoppingBag, label: () => "Venta de productos" },
  { href: "/app/configuracion", icon: Settings, label: () => "Configuración" },
];
