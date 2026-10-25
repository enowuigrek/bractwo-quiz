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
    .select("nr, tresc, komentarz_prawda, komentarz_falsz, piwne")
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
        przez 60 s odpowiadają prawda/fałsz: najpierw na pytania wejścia quizu (przy quizie, na jego temat), potem na
        złote pytania z tej listy, a na końcu na szare. W każdej grupie kolejność jest losowa i nic się nie powtarza.
        Szybki gracz przechodzi ok. 15–20 pytań, więc razem powinno ich być przynajmniej 25. Utrudnienia (drżenie,
        zamienione kolory, uciekające przyciski…) nie zależą od pytania: zawsze narastają w tej samej kolejności. Po
        każdej odpowiedzi telefon reaguje coraz dłużej i pokazuje komentarz (własny z pól poniżej albo ogólny, np.
        „Serio?”). Gracze o tym nie wiedzą: telefon wygląda jak dalsza seria, a TV dalej pokazuje finał, tylko wszystko
        się psuje. Na koniec telefony gasną, muzyka cichnie, a na TV wybucha szklanka. Wstawki:{" "}
        <code>{"{za_barem}"}</code> (imię z kreatora gry; bez niego pytanie odpada) i <code>{"{lokal}"}</code>, także w
        komentarzach.
      </p>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} />
      )}
    </main>
  );
}
