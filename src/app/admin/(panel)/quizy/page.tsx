import type { Metadata } from "next";
import Link from "next/link";
import { lokalRoli, mozePijanyFinal, widziWszystko, wymagajAdmina } from "@/lib/admin";
import { filtrQuizow } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { IkonaEdytuj, IkonaKlodka, IkonaKosz, IkonaOko } from "@/components/ikony";
import { BRACTWO, FiltrLokali, wybranyLokal, ZnaczekLokalu, type LokalAutor } from "../_komponenty/lokale-autorzy";
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
  lokal_id: string | null;
  lokale: LokalAutor | null;
  zadania: { count: number }[];
  etapy: { count: number }[];
};

const BLEDY: Record<string, string> = {
  usuwanie: "Nie udało się przenieść quizu do kosza.",
};

export default async function Quizy({ searchParams }: PageProps<"/admin/quizy">) {
  const rola = await wymagajAdmina();
  const { blad, rodzaj: rodzajZAdresu, tag, kosz, lokal: lokalZAdresu } = await searchParams;
  const db = supabaseAdmin();
  const glowny = widziWszystko(rola);
  // główny widzi, kto założył quiz (logo lokalu albo Bractwa), i filtruje po autorze (26.10)
  const { data: lokale } = glowny
    ? await db.from("lokale").select("id, nazwa, logo_url").order("nazwa").returns<LokalAutor[]>()
    : { data: [] as LokalAutor[] };
  const autor = wybranyLokal(lokalZAdresu, lokale ?? [], true);
  // dwie zakładki: wyścig po piwo (quiz z etapami) i klasyczny pub quiz (bez etapów); w każdej filtr tematów
  const rodzaj: RodzajQuizu = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  let zapytanie = filtrQuizow(
    db
      .from("quizy")
      .select(
        "id, tytul, opis, tylko_glowny, tagi, lokal_id, lokale(id, nazwa, logo_url), zadania(count), etapy(count)",
      ),
    rola,
  ).is("usunieto", null);
  if (autor === BRACTWO) zapytanie = zapytanie.is("lokal_id", null);
  else if (autor) zapytanie = zapytanie.eq("lokal_id", autor);
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
  const adres = (r: RodzajQuizu, t: string | null = null, a: string | null = autor) =>
    `/admin/quizy?${new URLSearchParams({
      ...(r === "klasyczny" ? { rodzaj: r } : {}),
      ...(t ? { tag: t } : {}),
      ...(a ? { lokal: a } : {}),
    })}`;
  // lokal: quizy Bractwa są tylko do grania (podgląd bez zmian i bez kosza)
  const mojLokal = lokalRoli(rola);
  const tylkoPodglad = (q: QuizNaLiscie) => !!mojLokal && q.lokal_id !== mojLokal;

  return (
    <main>
      <h1>Quizy</h1>
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
      <FiltrLokali lokale={lokale ?? []} wybrany={autor} adres={(a) => adres(rodzaj, wybranyTag, a)} zBractwem />
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
                  {/* autor: u głównego zawsze, u lokalu tylko przy quizach Bractwa */}
                  {(glowny || tylkoPodglad(q)) && <ZnaczekLokalu lokal={q.lokale} />}
                  <Link href={`/admin/quizy/${q.id}`}>{q.tytul}</Link>
                </div>
                <div className="lista-opis">
                  {/* lokale takich nie widzą, więc znacznik ma sens tylko u głównego */}
                  {glowny && q.tylko_glowny && (
                    <>
                      <IkonaKlodka /> tylko dla mnie ·{" "}
                    </>
                  )}
                  {tylkoPodglad(q) && "quiz Bractwa, tylko do grania · "}
                  {liczbaPytan(q.zadania[0]?.count ?? 0)}
                  {q.tagi.length > 0 && ` · ${q.tagi.join(", ")}`}
                  {/* opis to notatka autora, lokal nie widzi jej przy quizach Bractwa */}
                  {q.opis && !tylkoPodglad(q) && ` · ${q.opis}`}
                </div>
              </div>
              <div className="lista-akcje">
                {tylkoPodglad(q) ? (
                  <Link
                    href={`/admin/quizy/${q.id}`}
                    className="przycisk-maly ikona"
                    aria-label={`Podgląd quizu ${q.tytul}`}
                    data-podpis="Podgląd"
                  >
                    <IkonaOko />
                  </Link>
                ) : (
                  <>
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

      <p className="panel-sekcja" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
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
      </p>
    </main>
  );
}
