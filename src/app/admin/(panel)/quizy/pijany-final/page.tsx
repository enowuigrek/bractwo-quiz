import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import type { PijanePytanie } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzPijany } from "./formularz";

export const metadata: Metadata = { title: "Pijany finał · Bractwo Quiz" };

/** Pytania pijanego finału: wspólne dla wszystkich gier, w których przy uruchamianiu włączono ten tryb. */
export default async function PijanyFinal() {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("pijane_pytania")
    .select("nr, tresc, efekt")
    .order("nr")
    .returns<PijanePytanie[]>();

  return (
    <main>
      <p>
        <Link href="/admin/quizy" className="pomocniczy">
          ← Quizy
        </Link>
      </p>
      <h1>Pijany finał</h1>
      <p className="pomocniczy">
        Dogrywka po finale serią, gdy przy uruchamianiu gry włączysz „Pijany finał”. Wynik jest już ustalony, a gracze
        odpowiadają prawda/fałsz na te pytania po kolei (90 s, nic się nie liczy). Gracze o tym nie wiedzą: telefon
        wygląda jak dalsza seria (pytanie 15/14, 16/14…), a TV dalej pokazuje finał, tylko wszystko się psuje. Ekran
        telefonu faluje coraz mocniej, a każde pytanie ma swój przeszkadzacz. Wstawki: <code>{"{za_barem}"}</code> (imię
        z kreatora gry; bez niego pytanie odpada) i <code>{"{lokal}"}</code>.
      </p>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} />
      )}
    </main>
  );
}
