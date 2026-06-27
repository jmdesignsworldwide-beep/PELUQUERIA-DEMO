# JM · Sistema de Gestión (Salón / Barbería)

Sistema de gestión **bi-piel** (white-label por vertical) para negocios de
belleza en República Dominicana. Un solo motor; dos pieles que se "visten"
según el `business_type` de la cuenta:

- 🌸 **Salón** — "JM Beauty Salón" (rosa empolvado + dorado champagne)
- 💈 **Barbería** — "JM Barbería" (carbón/grafito + cobre envejecido)

Cada piel tiene tema claro y oscuro (4 combinaciones en total). Cambiar de
piel = cambiar el set de tokens; una corrección arregla las dos pieles.

## Stack

- **Next.js 14** (App Router) + **TypeScript** + **Tailwind CSS**
- **Framer Motion** (animación), **lucide-react** (iconos)
- **Supabase** (base de datos, auth, storage)
- **Vercel** (deploy + previews)

## Desarrollo

```bash
npm install
npm run dev      # http://localhost:3000  → /demo (showcase de primitivos)
npm run build
```

### Variables de entorno

Ver `.env.example`. `SUPABASE_SERVICE_ROLE_KEY` es **solo servidor**
(marcar "Sensitive" en Vercel, nunca con prefijo `NEXT_PUBLIC_`).

---

> Demo de ventas premium. Construido por tandas.
