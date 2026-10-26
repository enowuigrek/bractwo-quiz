import type { Metadata } from "next";
import Link from "next/link";
import { mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { IkonaEdytuj, IkonaKlodka, IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../_komponenty/przycisk-potwierdz";
import { usunQuiz } from "./akcje";
import { liczbaPytan } from "./limity";
import { NAZWY_RODZAJOW, wszystkieTagi, type RodzajQuizu } from "@/lib/tagi";

export const metadata: Metadata = { title: "Quizy · Bractwo Quiz" };

type QuizNaLiscie = {
  id: string;
  tytul: string;
  opis: string | null;
  tylko_glowny: boolean;
  tagi: string[];
  zadania: { count: number }[];
  etapy: { count: number }[];
};

const BLEDY: Record<string, string> = {
  gry: "Tego quizu nie da się usunąć, bo były na nim rozegrane gry. Najpierw usuń te gry w zakładce „Gry”.",
  usuwanie: "Nie udało się usunąć quizu.",
};

export default async function Quizy({ searchParams }: PageProps<"/admin/quizy">) {
  const rola = await wymagajAdmina();
  const { blad, rodzaj: rodzajZAdresu, tag } = await searchParams;
  // dwie zakładki: wyścig po piwo (quiz z etapami) i klasyczny pub quiz (bez etapów); w każdej filtr tematów
  const rodzaj: RodzajQuizu = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  const { data: wszystkie, error } = await supabaseAdmin()
    .from("quizy")
    .select("id, tytul, opis, tylko_glowny, tagi, zadania(count), etapy(count)")
    .in("tylko_glowny", widoczne(rola))
    .order("utworzono", { ascending: false })
    .returns<QuizNaLiscie[]>();
  const wRodzaju = (wszystkie ?? []).filter((q) => ((q.etapy[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny") === rodzaj);
  const tagi = wszystkieTagi(wRodzaju);
  const wybranyTag = typeof tag === "string" && tagi.includes(tag) ? tag : null;
  const data = wybranyTag ? wRodzaju.filter((q) => q.tagi.includes(wybranyTag)) : wRodzaju;
  const adres = (r: RodzajQuizu, t: string | null = null) =>
    `/admin/quizy?${new URLSearchParams({ ...(r === "klasyczny" ? { rodzaj: r } : {}), ...(t ? { tag: t } : {}) })}`;

  return (
    <main>
      <h1>Quizy</h1>
      {typeof blad === "string" && BLEDY[blad] && (
        <p className="blad" role="alert">
          {BLEDY[blad]}
        </p>
      )}
      {error && <p className="blad">Nie udało się pobrać quizów: {error.message}</p>}

      <nav className="wybor-czasu quizy-rodzaje" aria-label="Rodzaj quizu">
        {(["wyscig", "klasyczny"] as const).map((r) => (
          <Link
            key={r}
            href={adres(r)}
            className={`wybor-czasu-opcja${rodzaj === r ? " wybrana" : ""}`}
            aria-current={rodzaj === r ? "page" : undefined}
          >
            {NAZWY_RODZAJOW[r]}
          </Link>
        ))}
      </nav>
      {tagi.length > 0 && (
        <p className="tagi quizy-tagi">
          <Link href={adres(rodzaj)} className={`tag${wybranyTag ? "" : " wybrany"}`}>
            wszystkie
          </Link>
          {tagi.map((t) => (
            <Link key={t} href={adres(rodzaj, t)} className={`tag${wybranyTag === t ? " wybrany" : ""}`}>
              {t}
            </Link>
          ))}
        </p>
      )}

      {data && data.length > 0 ? (
        <ul className="lista">
          {data.map((q) => (
            <li key={q.id}>
              <div className="lista-glowna">
                <div className="lista-tytul">
                  <Link href={`/admin/quizy/${q.id}`}>{q.tytul}</Link>
                </div>
                <div className="lista-opis">
                  {/* obsługa takich nie widzi, więc znacznik ma sens tylko u głównego */}
                  {widziWszystko(rola) && q.tylko_glowny && (
                    <>
                      <IkonaKlodka /> tylko dla mnie ·{" "}
                    </>
                  )}
                  {liczbaPytan(q.zadania[0]?.count ?? 0)}
                  {q.tagi.length > 0 && ` · ${q.tagi.join(", ")}`}
                  {q.opis && ` · ${q.opis}`}
                </div>
              </div>
              <div className="lista-akcje">
                <Link
                  href={`/admin/quizy/${q.id}`}
                  className="przycisk-maly ikona"
                  aria-label={`Edytuj quiz ${q.tytul}`}
                  data-podpis="Edytuj"
                >
                  <IkonaEdytuj />
                </Link>
                <PrzyciskPotwierdz
                  akcja={usunQuiz.bind(null, q.id)}
                  pytanie={`Usunąć quiz „${q.tytul}” razem ze wszystkimi pytaniami?`}
                  tytul="Usuń"
                  className="przycisk-maly ikona niebezpieczny"
                >
                  <IkonaKosz />
                </PrzyciskPotwierdz>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        !error && (
          <p className="lista-pusta">
            {wybranyTag ? `Brak quizów z tematem „${wybranyTag}”.` : `Nie ma jeszcze quizu w tym rodzaju.`}
          </p>
        )
      )}

      <p className="panel-sekcja" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <Link href={`/admin/quizy/nowy?rodzaj=${rodzaj}`} className="przycisk zloty">
          {rodzaj === "klasyczny" ? "Nowy klasyczny quiz" : "Nowy wyścig po piwo"}
        </Link>
        {/* pytania dogrywki „Pijany finał” (tylko po finale wyścigu po piwo), wspólne dla wszystkich gier;
            obsługa nie wie o tym trybie */}
        {rodzaj === "wyscig" && mozePijanyFinal(rola) && (
          <Link href="/admin/quizy/pijany-final" className="przycisk">
            Pijany finał: pytania
          </Link>
        )}
      </p>
    </main>
  );
}
