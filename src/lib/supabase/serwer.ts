import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let klient: SupabaseClient | undefined;

/**
 * Klient z kluczem serwisowym (omija RLS). Tylko dla panelu admina,
 * zawsze po `wymagajAdmina()`. Klucz nigdy nie trafia do przeglądarki.
 */
export function supabaseAdmin(): SupabaseClient {
  if (!klient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const klucz = process.env.SUPABASE_SECRET_KEY;
    if (!url || !klucz) {
      throw new Error("Brak NEXT_PUBLIC_SUPABASE_URL lub SUPABASE_SECRET_KEY");
    }
    klient = createClient(url, klucz, { auth: { persistSession: false } });
  }
  return klient;
}
