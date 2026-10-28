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
      <p>
        <Link href="/admin/quizy" className="pomocniczy">
          ← Quizy
        </Link>
      </p>
      <h1>Pijany finał</h1>
      <p className="pomocniczy">
        Dogrywka po finale serią, gdy przy uruchamianiu gry włączysz „Pijany finał”. Wynik jest już ustalony, a gracze
        przez 60 s odpowiadają prawda/fałsz: najpierw na 3 losowe „O piwie” (spokojnie, jak dalszy ciąg finału), potem
        na pytanie z imieniem zza baru (bez imienia na jeszcze jedno „O piwie”), a dalej na „Odklejone” losowo, aż
        skończy się czas. Pytania są wspólne dla wszystkich quizów i nic się nie powtarza.
        Szybki gracz przechodzi ok. 15–20 pytań, więc razem powinno ich być przynajmniej 25. Utrudnienia (drżenie,
        zamienione kolory, uciekające przyciski…) nie zależą od pytania: zawsze narastają w tej samej kolejności. Po
        każdej odpowiedzi telefon reaguje coraz dłużej i pokazuje komentarz (własny z pól poniżej albo ogólny, np.
        „Serio?”). Gracze o tym nie wiedzą: telefon wygląda jak dalsza seria, a TV dalej pokazuje finał, tylko wszystko
        się psuje. Na koniec telefony gasną, muzyka cichnie, a na TV wybucha szklanka. Wstawki:{" "}
        <code>{"{za_barem}"}</code> (imię z kreatora gry; bez niego pytanie odpada) i <code>{"{lokal}"}</code>, także w
        komentarzach.
      </p>
      <form action={testPijanegoFinalu} className="pijany-test">
        <button type="submit">Test na ekranie</button>
        <span className="pomocniczy">
          Zakłada grę testową z 5 botami (bez lokalu, widzi ją tylko główny): krótka seria finału rusza za 15 s, potem
          pijany finał, werble i podium. Na stronie gry otwórz od razu ekran w przeglądarce, którą chcesz sprawdzić
          (boty odpowiadają, gdy ekran jest otwarty). Po teście usuń grę.
        </span>
      </form>
      {error ? (
        <p className="blad">Nie udało się pobrać pytań: {error.message}</p>
      ) : (
        <FormularzPijany pytania={data ?? []} />
      )}
    </main>
  );
}
