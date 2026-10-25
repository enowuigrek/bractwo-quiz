import type { Metadata } from "next";
import Link from "next/link";
import { wymagajGlownego } from "@/lib/admin";
import type { PijanePytanie } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { FormularzPijany } from "./formularz";

export const metadata: Metadata = { title: "Pijany finał · Bractwo Quiz" };

/** Pytania pijanego finału: wspólne dla wszystkich gier, w których przy uruchamianiu włączono ten tryb. */
export default async function PijanyFinal() {
  await wymagajGlownego();
  const { data, error } = await supabaseAdmin()
    .from("pijane_pytania")
    .select("nr, tresc, efekt, komentarz_prawda, komentarz_falsz")
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
        przez 60 s odpowiadają prawda/fałsz najpierw na pytania wejścia quizu (ustawiane przy quizie, na jego temat), a
        potem na pytania z tej listy (w każdej grze w trochę innej kolejności, bez powtórek; nic się nie liczy). Szybki
        gracz przechodzi ok. 15–20 pytań, więc lista powinna mieć ich przynajmniej 25. Po każdej odpowiedzi telefon reaguje coraz dłużej: błysk w losowym kolorze,
        drżenie przycisku i komentarz przelatujący przez ekran (własny z pól poniżej albo ogólny, np. „Serio?”). Gracze
        o tym nie wiedzą: telefon wygląda jak dalsza seria (pytanie 15/14, 16/14…), a TV dalej pokazuje finał, tylko
        wszystko się psuje. Na koniec telefony gasną, muzyka cichnie, a na TV wybucha szklanka. Wstawki:{" "}
        <code>{"{za_barem}"}</code> (imię z kreatora gry; bez niego pytanie odpada) i <code>{"{lokal}"}</code>, także
        w komentarzach.
      </p>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} />
      )}
    </main>
  );
}
