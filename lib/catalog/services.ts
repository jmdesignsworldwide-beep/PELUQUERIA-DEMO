/**
 * ──────────────────────────────────────────────────────────────────────────
 * CATÁLOGO DE SERVICIOS (fuente única · demo)
 * ──────────────────────────────────────────────────────────────────────────
 * Es la autoridad de nombres/precios/duración. El cobro y la reserva leen el
 * precio desde aquí (lib/money/prices.ts deriva de este catálogo), y los
 * nombres coinciden con los servicios de la agenda (components/citas/data.ts),
 * para que TODO cuadre: mismo servicio, mismo precio en todo el sistema.
 *
 * Precios RD$ 2026. Las variantes "por largo" mantienen el precio MEDIANO igual
 * al precio base que usa el cobro, para no descuadrar nada.
 */

import type { BusinessType } from "@/lib/skins";

export type ServiceVariant = { label: string; price: number };

export type CatalogService = {
  id: string;
  name: string;
  category: string; // key de SERVICE_CATEGORIES
  description: string;
  /** Precio base en pesos (coherente con el cobro). */
  price: number;
  /** Duración estimada en minutos. */
  duration: number;
  /** Variantes (ej. por largo de cabello). El precio base = variante media. */
  variants?: ServiceVariant[];
  /** Veces realizado (sembrado, para el mini-stat). */
  timesDone: number;
  popular?: boolean;
};

export const SERVICE_CATEGORIES: Record<
  BusinessType,
  { key: string; label: string }[]
> = {
  salon: [
    { key: "corte", label: "Corte" },
    { key: "color", label: "Color" },
    { key: "mechas", label: "Mechas / Balayage" },
    { key: "tratamiento", label: "Tratamiento" },
    { key: "unas", label: "Uñas" },
    { key: "maquillaje", label: "Maquillaje" },
    { key: "peinado", label: "Peinado" },
    { key: "cejas", label: "Cejas" },
  ],
  barberia: [
    { key: "corte", label: "Corte" },
    { key: "fade", label: "Fade / Degradado" },
    { key: "barba", label: "Barba" },
    { key: "afeitado", label: "Afeitado" },
    { key: "diseno", label: "Diseño" },
    { key: "tratamiento", label: "Tratamiento" },
    { key: "color", label: "Color / Canas" },
  ],
};

const LARGO = (corto: number, mediano: number, largo: number): ServiceVariant[] => [
  { label: "Corto", price: corto },
  { label: "Mediano", price: mediano },
  { label: "Largo", price: largo },
];

const SERVICES: Record<BusinessType, CatalogService[]> = {
  salon: [
    {
      id: "s-corte",
      name: "Corte y peinado",
      category: "corte",
      description: "Corte de dama con lavado y peinado de salida.",
      price: 1000,
      duration: 60,
      variants: LARGO(700, 1000, 1400),
      timesDone: 184,
      popular: true,
    },
    {
      id: "s-secado",
      name: "Secado",
      category: "peinado",
      description: "Lavado y secado con cepillo (blower) para un acabado liso o con ondas.",
      price: 600,
      duration: 30,
      variants: LARGO(400, 600, 1000),
      timesDone: 142,
      popular: true,
    },
    {
      id: "s-peinado",
      name: "Peinado / recogido",
      category: "peinado",
      description: "Peinado para eventos: recogidos, ondas, trenzas.",
      price: 1500,
      duration: 60,
      variants: LARGO(800, 1500, 2500),
      timesDone: 63,
    },
    {
      id: "s-color",
      name: "Color completo",
      category: "color",
      description: "Tinte global de raíz a puntas. Incluye lavado y secado.",
      price: 2800,
      duration: 120,
      variants: LARGO(2200, 2800, 3800),
      timesDone: 96,
    },
    {
      id: "s-mechas",
      name: "Mechas / Balayage",
      category: "mechas",
      description: "Iluminación con técnica de mechas o balayage para un degradado natural.",
      price: 7000,
      duration: 180,
      variants: LARGO(5000, 7000, 12000),
      timesDone: 71,
      popular: true,
    },
    {
      id: "s-keratina",
      name: "Keratina",
      category: "tratamiento",
      description: "Alisado y nutrición profunda con keratina. Reduce el frizz por semanas.",
      price: 6000,
      duration: 120,
      variants: LARGO(3500, 6000, 9000),
      timesDone: 54,
    },
    {
      id: "s-tratamiento",
      name: "Tratamiento capilar",
      category: "tratamiento",
      description: "Hidratación y reparación profunda según el tipo de cabello.",
      price: 1500,
      duration: 45,
      timesDone: 88,
    },
    {
      id: "s-mani",
      name: "Manicure",
      category: "unas",
      description: "Limado, cutícula y esmaltado tradicional.",
      price: 450,
      duration: 45,
      timesDone: 210,
      popular: true,
    },
    {
      id: "s-mani-gel",
      name: "Manicure en gel",
      category: "unas",
      description: "Manicure con esmaltado en gel de larga duración.",
      price: 900,
      duration: 60,
      timesDone: 132,
    },
    {
      id: "s-pedi",
      name: "Pedicure",
      category: "unas",
      description: "Spa de pies, limado y esmaltado.",
      price: 600,
      duration: 60,
      timesDone: 121,
    },
    {
      id: "s-maquillaje",
      name: "Maquillaje social",
      category: "maquillaje",
      description: "Maquillaje para eventos, con o sin pestañas.",
      price: 2500,
      duration: 60,
      variants: [
        { label: "Social", price: 2500 },
        { label: "Novia / gala", price: 4000 },
      ],
      timesDone: 47,
    },
    {
      id: "s-cejas",
      name: "Diseño de cejas",
      category: "cejas",
      description: "Diseño y depilación de cejas. Incluye tinte opcional.",
      price: 500,
      duration: 30,
      timesDone: 156,
    },
  ],
  barberia: [
    {
      id: "b-clasico",
      name: "Corte clásico",
      category: "corte",
      description: "Corte a tijera y máquina con acabado y peinado.",
      price: 400,
      duration: 30,
      timesDone: 268,
      popular: true,
    },
    {
      id: "b-fade",
      name: "Degradado",
      category: "fade",
      description: "Fade / degradado a la piel con transición limpia.",
      price: 550,
      duration: 45,
      variants: [
        { label: "Simple", price: 550 },
        { label: "Con diseño", price: 750 },
      ],
      timesDone: 241,
      popular: true,
    },
    {
      id: "b-corte-barba",
      name: "Corte + barba",
      category: "barba",
      description: "Corte completo más perfilado y arreglo de barba.",
      price: 750,
      duration: 45,
      timesDone: 198,
      popular: true,
    },
    {
      id: "b-perfilado",
      name: "Perfilado de barba",
      category: "barba",
      description: "Perfilado y arreglo de barba con navaja y aceite.",
      price: 350,
      duration: 30,
      timesDone: 142,
    },
    {
      id: "b-afeitado",
      name: "Afeitado a navaja",
      category: "afeitado",
      description: "Afeitado clásico con toalla caliente y navaja.",
      price: 500,
      duration: 30,
      timesDone: 96,
    },
    {
      id: "b-nino",
      name: "Corte infantil",
      category: "corte",
      description: "Corte para niños con paciencia y buen acabado.",
      price: 350,
      duration: 30,
      timesDone: 110,
    },
    {
      id: "b-lineas",
      name: "Diseño de líneas",
      category: "diseno",
      description: "Líneas y diseños personalizados a navaja.",
      price: 300,
      duration: 30,
      timesDone: 73,
    },
    {
      id: "b-tinte",
      name: "Tinte",
      category: "color",
      description: "Cobertura de canas o tinte de cabello/barba.",
      price: 700,
      duration: 60,
      variants: [
        { label: "Barba", price: 500 },
        { label: "Cabello", price: 700 },
        { label: "Completo", price: 1100 },
      ],
      timesDone: 58,
    },
    {
      id: "b-ritual",
      name: "Ritual completo",
      category: "tratamiento",
      description: "Corte + barba + mascarilla facial + toalla caliente. La experiencia full.",
      price: 1200,
      duration: 90,
      timesDone: 64,
    },
  ],
};

export function servicesFor(skin: BusinessType): CatalogService[] {
  return SERVICES[skin];
}

/** Mapa nombre → precio base, para el cobro/reserva (coherencia total). */
export function servicePriceMap(skin: BusinessType): Record<string, number> {
  const map: Record<string, number> = {};
  for (const s of SERVICES[skin]) map[s.name] = s.price;
  return map;
}

export function categoryLabel(skin: BusinessType, key: string): string {
  return SERVICE_CATEGORIES[skin].find((c) => c.key === key)?.label ?? key;
}
