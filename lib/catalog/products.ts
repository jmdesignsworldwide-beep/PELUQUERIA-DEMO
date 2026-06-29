/**
 * Productos + proveedores (demo navegable). Bi-piel, datos dominicanos
 * creíbles. Compartido por Inventario, Proveedores y Venta de Productos.
 * No persiste (demo). Determinista.
 */

import type { BusinessType } from "@/lib/skins";

export type ProductUse = "interno" | "venta" | "ambos";

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  categoryLabel: string;
  stock: number;
  minStock: number;
  price: number; // pesos
  expiry: string | null; // DD/MM/AAAA
  use: ProductUse;
  supplierId: string;
};

export type Supplier = {
  id: string;
  name: string;
  phone: string;
  surte: string; // qué surte
  lastPurchase: string; // DD/MM/AAAA
  totalBought: number; // pesos
};

const SUPPLIERS: Record<BusinessType, Supplier[]> = {
  salon: [
    { id: "sup-1", name: "Beauty Import RD", phone: "809-555-1042", surte: "Tintes y color", lastPurchase: "18/06/2026", totalBought: 184500 },
    { id: "sup-2", name: "Belleza Dominicana SRL", phone: "829-555-7781", surte: "Tratamientos y keratina", lastPurchase: "22/06/2026", totalBought: 142000 },
    { id: "sup-3", name: "Uñas Pro Import", phone: "849-555-3390", surte: "Productos de uñas", lastPurchase: "10/06/2026", totalBought: 76800 },
    { id: "sup-4", name: "Cuidado Capilar Import", phone: "809-555-9920", surte: "Shampoos y cuidado", lastPurchase: "25/06/2026", totalBought: 98300 },
  ],
  barberia: [
    { id: "sup-1", name: "Barber Supply RD", phone: "809-555-2210", surte: "Pomadas, ceras y peinado", lastPurchase: "20/06/2026", totalBought: 134200 },
    { id: "sup-2", name: "Distribuidora El Barbero", phone: "829-555-6654", surte: "Barba y afeitado", lastPurchase: "23/06/2026", totalBought: 88700 },
    { id: "sup-3", name: "Grooming Import SRL", phone: "849-555-4471", surte: "Insumos y cuidado", lastPurchase: "12/06/2026", totalBought: 64900 },
  ],
};

const PRODUCTS: Record<BusinessType, Product[]> = {
  salon: [
    { id: "p1", name: "Tinte Koleston", brand: "Wella", category: "color", categoryLabel: "Color", stock: 24, minStock: 10, price: 650, expiry: "12/2027", use: "interno", supplierId: "sup-1" },
    { id: "p2", name: "Decolorante en polvo", brand: "Wella", category: "color", categoryLabel: "Color", stock: 5, minStock: 6, price: 1800, expiry: "08/2027", use: "interno", supplierId: "sup-1" },
    { id: "p3", name: "Tinte de cejas", brand: "RefectoCil", category: "color", categoryLabel: "Color", stock: 14, minStock: 6, price: 400, expiry: "05/2027", use: "interno", supplierId: "sup-1" },
    { id: "p4", name: "Keratina alisado", brand: "Brasil Cacau", category: "tratamiento", categoryLabel: "Tratamiento", stock: 8, minStock: 5, price: 3500, expiry: "03/2027", use: "ambos", supplierId: "sup-2" },
    { id: "p5", name: "Tratamiento Olaplex Nº3", brand: "Olaplex", category: "tratamiento", categoryLabel: "Tratamiento", stock: 3, minStock: 4, price: 2200, expiry: "11/2026", use: "ambos", supplierId: "sup-2" },
    { id: "p6", name: "Mascarilla capilar", brand: "Kérastase", category: "tratamiento", categoryLabel: "Tratamiento", stock: 11, minStock: 6, price: 1100, expiry: "01/2027", use: "venta", supplierId: "sup-2" },
    { id: "p7", name: "Shampoo sin sal", brand: "Kérastase", category: "cuidado", categoryLabel: "Cuidado", stock: 18, minStock: 8, price: 850, expiry: null, use: "venta", supplierId: "sup-4" },
    { id: "p8", name: "Acondicionador hidratante", brand: "Kérastase", category: "cuidado", categoryLabel: "Cuidado", stock: 15, minStock: 8, price: 900, expiry: null, use: "venta", supplierId: "sup-4" },
    { id: "p9", name: "Spray protector térmico", brand: "GHD", category: "cuidado", categoryLabel: "Cuidado", stock: 9, minStock: 6, price: 750, expiry: null, use: "venta", supplierId: "sup-4" },
    { id: "p10", name: "Esmalte en gel", brand: "OPI", category: "unas", categoryLabel: "Uñas", stock: 30, minStock: 12, price: 450, expiry: "09/2027", use: "interno", supplierId: "sup-3" },
    { id: "p11", name: "Removedor / acetona", brand: "OPI", category: "unas", categoryLabel: "Uñas", stock: 12, minStock: 5, price: 300, expiry: null, use: "interno", supplierId: "sup-3" },
    { id: "p12", name: "Base + top coat", brand: "OPI", category: "unas", categoryLabel: "Uñas", stock: 4, minStock: 6, price: 520, expiry: "07/2027", use: "interno", supplierId: "sup-3" },
  ],
  barberia: [
    { id: "p1", name: "Cera mate", brand: "Reuzel", category: "peinado", categoryLabel: "Peinado", stock: 20, minStock: 8, price: 550, expiry: null, use: "venta", supplierId: "sup-1" },
    { id: "p2", name: "Pomada brillo fuerte", brand: "Suavecito", category: "peinado", categoryLabel: "Peinado", stock: 16, minStock: 8, price: 600, expiry: null, use: "venta", supplierId: "sup-1" },
    { id: "p3", name: "Tónico capilar", brand: "American Crew", category: "peinado", categoryLabel: "Peinado", stock: 10, minStock: 5, price: 800, expiry: "06/2027", use: "venta", supplierId: "sup-1" },
    { id: "p4", name: "Aceite de barba", brand: "Honest Amish", category: "barba", categoryLabel: "Barba", stock: 12, minStock: 6, price: 700, expiry: "10/2027", use: "venta", supplierId: "sup-2" },
    { id: "p5", name: "Shampoo para barba", brand: "Cremo", category: "barba", categoryLabel: "Barba", stock: 9, minStock: 6, price: 650, expiry: null, use: "venta", supplierId: "sup-2" },
    { id: "p6", name: "Tinte para barba", brand: "Just for Men", category: "barba", categoryLabel: "Barba", stock: 6, minStock: 5, price: 450, expiry: "04/2027", use: "interno", supplierId: "sup-2" },
    { id: "p7", name: "Bálsamo after shave", brand: "Proraso", category: "afeitado", categoryLabel: "Afeitado", stock: 14, minStock: 6, price: 500, expiry: "02/2027", use: "ambos", supplierId: "sup-2" },
    { id: "p8", name: "Gel de afeitar", brand: "Proraso", category: "afeitado", categoryLabel: "Afeitado", stock: 4, minStock: 6, price: 350, expiry: "12/2026", use: "interno", supplierId: "sup-2" },
    { id: "p9", name: "Cuchillas (caja 100)", brand: "Dorco", category: "insumos", categoryLabel: "Insumos", stock: 40, minStock: 20, price: 950, expiry: null, use: "interno", supplierId: "sup-3" },
    { id: "p10", name: "Talco barbero", brand: "Clubman", category: "insumos", categoryLabel: "Insumos", stock: 7, minStock: 5, price: 250, expiry: null, use: "interno", supplierId: "sup-3" },
    { id: "p11", name: "Desinfectante / Barbicide", brand: "Barbicide", category: "insumos", categoryLabel: "Insumos", stock: 3, minStock: 5, price: 600, expiry: "09/2027", use: "interno", supplierId: "sup-3" },
  ],
};

export function productsFor(skin: BusinessType): Product[] {
  return PRODUCTS[skin];
}
export function suppliersFor(skin: BusinessType): Supplier[] {
  return SUPPLIERS[skin];
}
export function supplierById(skin: BusinessType, id: string): Supplier | undefined {
  return SUPPLIERS[skin].find((s) => s.id === id);
}
export function isLowStock(p: Product): boolean {
  return p.stock < p.minStock;
}
/** Productos vendibles al cliente. */
export function sellableProducts(skin: BusinessType): Product[] {
  return PRODUCTS[skin].filter((p) => p.use === "venta" || p.use === "ambos");
}

export const PRODUCT_CATEGORIES: Record<BusinessType, { key: string; label: string }[]> = {
  salon: [
    { key: "color", label: "Color" },
    { key: "tratamiento", label: "Tratamiento" },
    { key: "cuidado", label: "Cuidado" },
    { key: "unas", label: "Uñas" },
  ],
  barberia: [
    { key: "peinado", label: "Peinado" },
    { key: "barba", label: "Barba" },
    { key: "afeitado", label: "Afeitado" },
    { key: "insumos", label: "Insumos" },
  ],
};

/* PRNG determinista para sub-datos sembrados (historial). */
function hash(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function rng(seed: string): () => number {
  let a = hash(seed) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Historial de uso/movimiento sembrado de un producto. */
export function productHistory(p: Product): { date: string; qty: number; type: string }[] {
  const r = rng("hist:" + p.id + p.name);
  const out: { date: string; qty: number; type: string }[] = [];
  for (let i = 0; i < 4; i++) {
    const day = 27 - i * 6;
    out.push({
      date: `${String(day).padStart(2, "0")}/06/2026`,
      qty: 1 + Math.floor(r() * 4),
      type: r() < 0.7 ? (p.use === "venta" ? "Venta" : "Uso en servicio") : "Entrada de stock",
    });
  }
  return out;
}

/** Órdenes de compra sembradas de un proveedor. */
export function supplierOrders(s: Supplier): { id: string; date: string; total: number; estado: string }[] {
  const r = rng("ord:" + s.id + s.name);
  const estados = ["Recibida", "Recibida", "En tránsito", "Pendiente"];
  return Array.from({ length: 4 }, (_, i) => ({
    id: `OC-${1000 + Math.floor(r() * 8999)}`,
    date: `${String(26 - i * 7).padStart(2, "0")}/06/2026`,
    total: (3 + Math.floor(r() * 28)) * 1000,
    estado: estados[i],
  }));
}
