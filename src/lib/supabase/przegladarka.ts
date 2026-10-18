import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let klient: SupabaseClient | undefined;

/** Publiczny klient (klucz publishable). Ma dostęp wyłącznie do funkcji gry i Realtime. */
export function supabase(): SupabaseClient {
  if (!klient) {
    klient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      { auth: { persistSession: false } },
    );
  }
  return klient;
}
