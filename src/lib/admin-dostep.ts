import "server-only";
import { notFound } from "next/navigation";
import { widziWszystko, type Rola } from "./admin";
import { supabaseAdmin } from "./supabase/serwer";

// Dostęp do pojedynczego quizu albo gry w panelu. Obsługa nie widzi rzeczy „tylko dla głównego”
// (`quizy.tylko_glowny`, `sesje.tylko_glowny`): strona pokazuje 404, a akcja kończy się błędem.
// Listy filtrują same: `.in("tylko_glowny", widoczne(rola))`.

/** Wartości `tylko_glowny`, które ta rola widzi na listach. */
export const widoczne = (rola: Rola): boolean[] => (widziWszystko(rola) ? [true, false] : [false]);

export async function wymagajQuizu(rola: Rola, quizId: string): Promise<void> {
  if (widziWszystko(rola)) return;
  const { data } = await supabaseAdmin()
    .from("quizy")
    .select("tylko_glowny")
    .eq("id", quizId)
    .maybeSingle<{ tylko_glowny: boolean }>();
  if (!data || data.tylko_glowny) notFound();
}

export async function wymagajGry(rola: Rola, sesjaId: string): Promise<void> {
  if (widziWszystko(rola)) return;
  const { data } = await supabaseAdmin()
    .from("sesje")
    .select("tylko_glowny")
    .eq("id", sesjaId)
    .maybeSingle<{ tylko_glowny: boolean }>();
  if (!data || data.tylko_glowny) notFound();
}
