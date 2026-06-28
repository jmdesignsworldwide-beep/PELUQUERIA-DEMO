import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico TEMPORAL (runtime Node, como las páginas/acciones).
 * Replica el uso de Supabase en try/catch y devuelve el error REAL.
 */
export async function GET() {
  const out: Record<string, unknown> = { runtime: "nodejs", steps: {} };
  const steps = out.steps as Record<string, unknown>;

  try {
    const s = createClient();
    steps.createServerClient = "ok";
    const { data, error } = await s.auth.getUser();
    steps.getUser = error ? `err: ${error.message}` : `user=${data.user?.id ?? "null"}`;
  } catch (e) {
    steps.serverClientThrow = `THROW: ${(e as Error).message}`;
    out.serverStack = String((e as Error).stack).split("\n").slice(0, 5);
  }

  try {
    const svc = createServiceClient();
    steps.createServiceClient = "ok";
    const { count, error } = await svc
      .from("login_attempts")
      .select("*", { count: "exact", head: true })
      .eq("username", "__diag__");
    steps.serviceQuery = error ? `err: ${error.message}` : `count=${count}`;
  } catch (e) {
    steps.serviceClientThrow = `THROW: ${(e as Error).message}`;
    out.serviceStack = String((e as Error).stack).split("\n").slice(0, 5);
  }

  return NextResponse.json(out);
}
