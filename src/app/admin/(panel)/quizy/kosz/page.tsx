import type { Metadata } from "next";
import Link from "next/link";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { NAZWY_RODZAJOW } from "@/lib/tagi";
import { IkonaKlodka, IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../../_komponenty/przycisk-potwierdz";
import { przywrocQuiz, usunQuizNaZawsze } from "../akcje";
import { liczbaPytan } from "../limity";

export const metadata: Metadata = { title: "Kosz · Bractwo Quiz" };

type QuizWKoszu = {
  id: string;
  tytul: string;
  tylko_glowny: boolean;
  usunieto: string;
  zadania: { count: number }[];
  etapy: { count: number }[];
};

const BLEDY: Record<string, string> = {
  gry: "Tego quizu nie da się usunąć na dobre, bo były na nim rozegrane gry. Najpierw usuń te gry w zakładce „Rozgrywki”.",
  usuwanie: "Nie udało się usunąć quizu.",
};

/**
 * Kosz na quizy (26.10): quizy usunięte z listy czekają tu na przywrócenie albo usunięcie na dobre (razem
 * z pytaniami i grafikami). Najnowsze na górze.
 */
export default async function Kosz({ searchParams }: PageProps<"/admin/quizy/kosz">) {
  const rola = await wymagajAdmina();
  const { blad } = await searchParams;
  const { data, error } = await supabaseAdmin()
    .from("quizy")
    .select("id, tytul, tylko_glowny, usunieto, zadania(count), etapy(count)")
    .in("tylko_glowny", widoczne(rola))
    .not("usunieto", "is", null)
    .order("usunieto", { ascending: false })
    .returns<QuizWKoszu[]>();

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <h1>Kosz</h1>
      <p className="pomocniczy">
        Usunięte quizy czekają tu, aż je przywrócisz albo usuniesz na dobre. Usunięcia na dobre nie da się cofnąć.
      </p>
      {typeof blad === "string" && BLEDY[blad] && (
        <p className="blad" role="alert">
          {BLEDY[blad]}
        </p>
      )}
      {error && <p className="blad">Nie udało się pobrać kosza: {error.message}</p>}
      {data && data.length > 0 ? (
        <ul className="lista">
          {data.map((q) => (
            <li key={q.id}>
              <div className="lista-glowna">
                <div className="lista-tytul">{q.tytul}</div>
                <div className="lista-opis">
                  {widziWszystko(rola) && q.tylko_glowny && (
                    <>
                      <IkonaKlodka /> tylko dla mnie ·{" "}
                    </>
                  )}
                  {NAZWY_RODZAJOW[(q.etapy[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny"]} ·{" "}
                  {liczbaPytan(q.zadania[0]?.count ?? 0)} · w koszu od{" "}
                  {new Date(q.usunieto).toLocaleString("pl-PL", {
                    timeZone: "Europe/Warsaw",
                    day: "numeric",
                    month: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              <div className="lista-akcje">
                <form action={przywrocQuiz.bind(null, q.id)}>
                  <button type="submit" className="przycisk-maly">
                    Przywróć
                  </button>
                </form>
                <PrzyciskPotwierdz
                  akcja={usunQuizNaZawsze.bind(null, q.id)}
                  pytanie={`Usunąć quiz „${q.tytul}” na dobre, razem ze wszystkimi pytaniami? Tego nie da się cofnąć.`}
                  tytul="Usuń na dobre"
                  tak="Usuń na dobre"
                  className="przycisk-maly ikona niebezpieczny"
                >
                  <IkonaKosz />
                </PrzyciskPotwierdz>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && <p className="lista-pusta">Kosz jest pusty.</p>
      )}
    </main>
  );
}
