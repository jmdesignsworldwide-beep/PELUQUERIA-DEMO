import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Diagnóstico TEMPORAL (runtime EDGE, como el middleware).
 * Replica createServerClient + getUser en try/catch y devuelve el error REAL.
 */
export async function GET() {
  const out: Record<string, unknown> = {
    runtime: "edge",
    env: {
      url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      anon: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
    steps: {},
  };
  const steps = out.steps as Record<string, unknown>;

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => [], setAll: () => {} } }
    );
    steps.create = "ok";
    const { data, error } = await supabase.auth.getUser();
    steps.getUser = error
      ? `err: ${error.message}`
      : `user=${data.user?.id ?? "null"}`;
  } catch (e) {
    steps.throw = `THROW: ${(e as Error)?.message ?? String(e)}`;
    out.stack = String((e as Error)?.stack).split("\n").slice(0, 6);
  }

  return NextResponse.json(out);
}
