import type { Metadata } from "next";
import Link from "next/link";
import { wymagajGlownego } from "@/lib/admin";
import type { PijanePytanie } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { testPijanegoFinalu } from "./akcje";
import { FormularzPijany } from "./formularz";

export const metadata: Metadata = { title: "Pijany finał · Bractwo Quiz" };

/** Pytania pijanego finału: wspólne dla wszystkich gier, w których przy uruchamianiu włączono ten tryb. */
export default async function PijanyFinal() {
  await wymagajGlownego();
  const { data, error } = await supabaseAdmin()
    .from("pijane_pytania")
    .select("nr, tresc, komentarz_prawda, komentarz_falsz, piwne")
    .order("nr")
    .returns<PijanePytanie[]>();

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <h1>Pijany finał</h1>
      <p className="pomocniczy">
        Wstawki: <code>{"{za_barem}"}</code> i <code>{"{lokal}"}</code>
      </p>
      <form action={testPijanegoFinalu}>
        <button type="submit" className="przycisk-maly">
          Test na ekranie
        </button>
      </form>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} />
      )}
    </main>
  );
}
