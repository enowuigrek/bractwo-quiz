import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrLokaliRoli, filtrQuizow } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { IkonaEdytuj, IkonaKosz, IkonaOko, IkonaOkoPrzekreslone } from "@/components/ikony";
import { FiltryListy, ZakladkiRodzaju, type WybraneFiltry } from "../_komponenty/filtry-listy";
import {
  BRACTWO,
  wybraneMiasto,
  wybranyLokal,
  ZnaczekLokalu,
  ZnaczekOsoby,
  type Osoba,
  type LokalAutor,
} from "../_komponenty/lokale-autorzy";
import { PrzyciskPotwierdz } from "../_komponenty/przycisk-potwierdz";
import { usunQuiz, ustawWidocznoscQuizu } from "./akcje";
import { wszystkieTagi, type RodzajQuizu } from "@/lib/tagi";

export const metadata: Metadata = { title: "Quizy · Bractwo Quiz" };

type QuizNaLiscie = {
  id: string;
  tytul: string;
  opis: string | null;
  tylko_glowny: boolean;
  tagi: string[];
  lokal_id: string | null;
  lokale: LokalAutor | null;
  konta: Osoba | null;
  zadania: { count: number }[];
  etapy: { count: number }[];
};

const BLEDY: Record<string, string> = {
  usuwanie: "Nie udało się przenieść quizu do kosza.",
};

export default async function Quizy({ searchParams }: PageProps<"/admin/quizy">) {
  const rola = await wymagajAdmina();
  const { blad, rodzaj: rodzajZAdresu, tag, kosz, lokal: lokalZAdresu, miasto: miastoZAdresu } = await searchParams;
  const db = supabaseAdmin();
  const glowny = widziWszystko(rola);
  // główny widzi, kto założył quiz (logo lokalu albo Bractwa), i filtruje po autorze (26.10)
  const { data: lokale } = glowny
    ? await filtrLokaliRoli(db.from("lokale").select("id, nazwa, logo_url, miasto"), rola)
        .order("nazwa")
        .returns<LokalAutor[]>()
    : { data: [] as LokalAutor[] };
  const miasto = wybraneMiasto(miastoZAdresu, lokale ?? []);
  const autor = wybranyLokal(lokalZAdresu, lokale ?? [], true, miasto);
  // dwie zakładki: wyścig po piwo (quiz z etapami) i klasyczny pub quiz (bez etapów); w każdej filtr tematów
  const rodzaj: RodzajQuizu = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  let zapytanie = filtrQuizow(
    db
      .from("quizy")
      .select(
        "id, tytul, opis, tylko_glowny, tagi, lokal_id, lokale(id, nazwa, logo_url), konta(nazwa, zdjecie_url), zadania(count), etapy(count)",
      ),
    rola,
  ).is("usunieto", null);
  if (autor === BRACTWO) zapytanie = zapytanie.is("lokal_id", null);
  else if (autor) zapytanie = zapytanie.eq("lokal_id", autor);
  else if (miasto)
    zapytanie = zapytanie.in(
      "lokal_id",
      (lokale ?? []).filter((l) => l.miasto === miasto).map((l) => l.id),
    );
  const { data: wszystkie, error } = await zapytanie.order("utworzono", { ascending: false }).returns<QuizNaLiscie[]>();
  const { count: wKoszu } = await filtrQuizow(
    db.from("quizy").select("id", { count: "exact", head: true }),
    rola,
    true,
  ).not("usunieto", "is", null);
  const wRodzaju = (wszystkie ?? []).filter((q) => ((q.etapy[0]?.count ?? 0) > 0 ? "wyscig" : "klasyczny") === rodzaj);
  const tagi = wszystkieTagi(wRodzaju);
  const wybranyTag = typeof tag === "string" && tagi.includes(tag) ? tag : null;
  const data = wybranyTag ? wRodzaju.filter((q) => q.tagi.includes(wybranyTag)) : wRodzaju;
  const wybrane: WybraneFiltry = { miasto, lokal: autor, tag: wybranyTag };
  const adres = (r: RodzajQuizu, f: WybraneFiltry) =>
    `/admin/quizy?${new URLSearchParams({
      ...(r === "klasyczny" ? { rodzaj: r } : {}),
      ...(f.miasto ? { miasto: f.miasto } : {}),
      ...(f.lokal ? { lokal: f.lokal } : {}),
      ...(f.tag ? { tag: f.tag } : {}),
    })}`;
  // lokal: quizy Bractwa są tylko do grania (podgląd bez zmian i bez kosza)
  const mojLokal = lokalRoli(rola);
  const tylkoPodglad = (q: QuizNaLiscie) => !!mojLokal && q.lokal_id !== mojLokal;

  return (
    <main>
      <div className="naglowek-strony">
        <h1>Quizy</h1>
        <Link
          href={rodzaj === "wyscig" ? "/admin/quizy/zasady" : "/admin/quizy/zasady/pub-quiz"}
          className="przycisk-maly"
        >
          Zasady i punktacja
        </Link>
      </div>
      {typeof blad === "string" && BLEDY[blad] && (
        <p className="blad" role="alert">
          {BLEDY[blad]}
        </p>
      )}
      {error && <p className="blad">Nie udało się pobrać quizów: {error.message}</p>}
      {kosz === "1" && (
        <p className="sukces" role="status">
          Quiz trafił do kosza. Możesz go stamtąd przywrócić.
        </p>
      )}

      <ZakladkiRodzaju rodzaj={rodzaj} adres={(r) => adres(r, { ...wybrane, tag: null })} />
      <FiltryListy
        lokale={lokale ?? []}
        tagi={tagi}
        wybrane={wybrane}
        adres={(f) => adres(rodzaj, f)}
        podpisLokalu="Autor"
        zBractwem
      />

      {data && data.length > 0 ? (
        <ul className="lista">
          {data.map((q) => (
            <li key={q.id}>
              {/* kolumna ikon (30.10): kto założył (lokal albo Bractwo) i osoba; tytuł ma resztę wiersza */}
              <span className="lista-ikony">
                <ZnaczekLokalu lokal={q.lokale} />
                <ZnaczekOsoby osoba={q.konta} />
              </span>
              <div className="lista-glowna">
                {/* na liście same tytuły (26.10): liczba pytań, tematy i opis dopiero po wejściu w quiz */}
                <div className="lista-tytul">
                  <Link href={`/admin/quizy/${q.id}`}>{q.tytul}</Link>
                </div>
              </div>
              <div className="lista-akcje">
                {tylkoPodglad(q) ? (
                  <Link href={`/admin/quizy/${q.id}`} className="przycisk-maly">
                    Otwórz
                  </Link>
                ) : (
                  <>
                    {/* widoczność quizu Bractwa dla lokali: oko (widzą) albo przekreślone oko (tylko Bractwo) */}
                    {glowny && !q.lokal_id && (
                      <form action={ustawWidocznoscQuizu.bind(null, q.id, !q.tylko_glowny)}>
                        <button
                          type="submit"
                          className="przycisk-maly ikona"
                          aria-label={q.tylko_glowny ? "Tylko Bractwo: pokaż lokalom" : "Widzą lokale: ukryj przed lokalami"}
                          data-podpis={q.tylko_glowny ? "Tylko Bractwo" : "Widzą lokale"}
                        >
                          {q.tylko_glowny ? <IkonaOkoPrzekreslone /> : <IkonaOko />}
                        </button>
                      </form>
                    )}
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
                      pytanie={`Przenieść quiz „${q.tytul}” do kosza? Możesz go stamtąd przywrócić.`}
                      tytul="Do kosza"
                      tak="Do kosza"
                      className="przycisk-maly ikona niebezpieczny"
                    >
                      <IkonaKosz />
                    </PrzyciskPotwierdz>
                  </>
                )}
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

      <div className="panel-sekcja przyciski">
        <Link href={`/admin/quizy/nowy?rodzaj=${rodzaj}`} className="przycisk zloty">
          {rodzaj === "klasyczny" ? "Nowy klasyczny quiz" : "Nowy wyścig po piwo"}
        </Link>
        {/* pytania dogrywki „Pijany finał” (tylko po finale wyścigu po piwo), wspólne dla wszystkich gier;
            pytania zmienia tylko główny */}
        {rodzaj === "wyscig" && mozePijanyFinal(rola) && (
          <Link href="/admin/quizy/pijany-final" className="przycisk">
            Pijany finał: pytania
          </Link>
        )}
        {/* usunięte quizy czekają w koszu na przywrócenie albo usunięcie na dobre */}
        <Link href="/admin/quizy/kosz" className="przycisk">
          Kosz{wKoszu ? ` (${wKoszu})` : ""}
        </Link>
      </div>
    </main>
  );
}
