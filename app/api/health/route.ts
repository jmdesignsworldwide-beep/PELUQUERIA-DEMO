import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico TEMPORAL: reporta si el servidor VE las variables de entorno,
 * SIN filtrar secretos (solo presencia + longitud; la URL es pública).
 * Se elimina en cuanto el login quede confirmado.
 */
export function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? null;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  return NextResponse.json({
    NEXT_PUBLIC_SUPABASE_URL: {
      present: !!url,
      value: url, // pública, no es secreto
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      present: anon.length > 0,
      length: anon.length,
    },
    SUPABASE_SERVICE_ROLE_KEY: {
      present: service.length > 0,
      length: service.length,
    },
    esperado_url: "https://cctlviwpiconpspsmczg.supabase.co",
    todo_ok:
      url === "https://cctlviwpiconpspsmczg.supabase.co" &&
      anon.length > 50 &&
      service.length > 50,
  });
}
