import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE — SOLO SERVIDOR.
 *
 * Bypassa RLS, así que jamás debe llegar al navegador. El import "server-only"
 * rompe el build si alguien lo importa en un componente cliente.
 * Se usa para el rate-limit del login (tabla login_attempts) antes de auth.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
