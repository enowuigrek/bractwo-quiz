import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { lokalRoli, wymagajAdmina } from "@/lib/admin";
import { filtrGier, wymagajQuizu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Etap, Zadanie } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { ListaGier, ZAPYTANIE_GIER, type GraNaLiscie } from "../../../gry/lista-gier";

export const metadata: Metadata = { title: "Statystyki quizu · Bractwo Quiz" };

type StatPytania = {
  zadanie_id: string;
  odpowiedzi: number;
  trafnosc: number;
  sredni_czas_ms: number;
  najszybciej_dobrze_ms: number | null;
};

const procent = (x: number) => `${Math.round(x * 100)}%`;
const sekundy = (ms: number) => `${(ms / 1000).toLocaleString("pl-PL", { maximumFractionDigits: 1 })} s`;
const data = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Warsaw" });

/** Kolor paska trafności: zielony łatwe, złoty średnie, czerwony trudne. */
const poziom = (t: number) => (t >= 0.7 ? "latwe" : t >= 0.4 ? "srednie" : "trudne");

/**
 * Statystyki quizu (30.10, Łukasz: tytuł na liście prowadzi tutaj, ołówek do edycji): ile razy i gdzie był grany,
 * ilu graczy, trafność i czas odpowiedzi na każde pytanie ze wszystkich gier (bez botów) i lista rozgrywek.
 */
export default async function StatystykiQuizu({ params }: PageProps<"/admin/quizy/[id]/statystyki">) {
  const rola = await wymagajAdmina();
  const { id } = await params;
  const { mozeZmieniac } = await wymagajQuizu(rola, id, true);
  const db = supabaseAdmin();

  const [{ data: quiz }, { data: zadania }, { data: etapy }, { data: gryZBazy }] = await Promise.all([
    db
      .from("quizy")
      .select("id, tytul, konta(nazwa)")
      .eq("id", id)
      .maybeSingle<{ id: string; tytul: string; konta: { nazwa: string } | null }>(),
    db.from("zadania").select("*").eq("quiz_id", id).order("nr").returns<Zadanie[]>(),
    db.from("etapy").select("id, nr, nazwa, seria").eq("quiz_id", id).order("nr").returns<Pick<Etap, "id" | "nr" | "nazwa" | "seria">[]>(),
    filtrGier(db.from("sesje").select(ZAPYTANIE_GIER).eq("quiz_id", id), rola, true)
      .order("utworzono", { ascending: false })
      .returns<GraNaLiscie[]>(),
  ]);
  if (!quiz) notFound();
  const gry = gryZBazy ?? [];
  const idGier = gry.map((g) => g.id);

  const [{ data: statystyki }, { count: graczy }] = await Promise.all([
    idGier.length
      ? db.rpc("statystyki_quizu", { p_quiz: id, p_sesje: idGier })
      : Promise.resolve({ data: [] as StatPytania[] }),
    idGier.length
      ? db.from("gracze").select("id", { count: "exact", head: true }).in("sesja_id", idGier).eq("bot", false)
      : Promise.resolve({ count: 0 }),
  ]);
  const stat = new Map(((statystyki ?? []) as StatPytania[]).map((s) => [s.zadanie_id, s]));

  // pytania po kolei jak w quizie (etapami), bez ciekawostek; z puli finału tylko te, na które ktoś odpowiadał
  const kolejnoscEtapu = new Map((etapy ?? []).map((e) => [e.id, e.nr]));
  const seria = new Set((etapy ?? []).filter((e) => e.seria).map((e) => e.id));
  const pytania = (zadania ?? [])
    .filter((z) => z.typ !== "ciekawostka" && (!z.etap_id || !seria.has(z.etap_id) || stat.has(z.id)))
    .sort((a, b) => (kolejnoscEtapu.get(a.etap_id ?? "") ?? 0) - (kolejnoscEtapu.get(b.etap_id ?? "") ?? 0) || a.nr - b.nr);
  const zOdpowiedziami = pytania.filter((z) => stat.has(z.id));
  // w finale serią czas liczy się od startu całej serii, nie od pytania: tam pokazujemy samą trafność
  const wSerii = (z: Zadanie) => !!z.etap_id && seria.has(z.etap_id);
  const zCzasem = zOdpowiedziami.filter((z) => !wSerii(z));

  const odpowiedzi = zOdpowiedziami.reduce((s, z) => s + stat.get(z.id)!.odpowiedzi, 0);
  const sredniaWazona = (pole: "trafnosc" | "sredni_czas_ms", wsrod: Zadanie[]) => {
    const n = wsrod.reduce((s, z) => s + stat.get(z.id)!.odpowiedzi, 0);
    return n ? wsrod.reduce((s, z) => s + stat.get(z.id)![pole] * stat.get(z.id)!.odpowiedzi, 0) / n : 0;
  };
  const zakonczone = gry.filter((g) => g.faza === "koniec");
  const lokale = [...new Set(gry.map((g) => g.lokale?.nazwa).filter((n): n is string => !!n))];
  const ostatnio = gry.map((g) => g.wystartowano ?? g.planowany_start ?? g.utworzono).sort().at(-1);

  // wyróżnienia: co najmniej 3 odpowiedzi, żeby jedna osoba nie robiła „najtrudniejszego”
  const doWyroznien = zOdpowiedziami.filter((z) => stat.get(z.id)!.odpowiedzi >= 3);
  const wedlug = (f: (s: StatPytania) => number) =>
    doWyroznien.length ? [...doWyroznien].sort((a, b) => f(stat.get(a.id)!) - f(stat.get(b.id)!)) : [];
  const najtrudniejsze = wedlug((s) => s.trafnosc)[0];
  const najlatwiejsze = wedlug((s) => -s.trafnosc)[0];
  const najdluzej = wedlug((s) => -s.sredni_czas_ms).filter((z) => !wSerii(z))[0];
  const nrPytania = (z: Zadanie) => pytania.indexOf(z) + 1;

  const dane: [string, string | null][] = [
    ["Rozgrywki", `${zakonczone.length} zakończone${gry.length > zakonczone.length ? `, ${gry.length - zakonczone.length} trwa` : ""}`],
    ["Gdzie", lokale.length ? lokale.join(", ") : null],
    ["Gracze", graczy ? `${graczy}${zakonczone.length > 1 ? `, średnio ${Math.round(graczy / gry.length)} na grę` : ""}` : null],
    ["Ostatnio", ostatnio ? data.format(new Date(ostatnio)) : null],
    ["Trafność", odpowiedzi ? procent(sredniaWazona("trafnosc", zOdpowiedziami)) : null],
    ["Średni czas odpowiedzi", zCzasem.length ? sekundy(sredniaWazona("sredni_czas_ms", zCzasem)) : null],
    ["Autor", quiz.konta?.nazwa ?? null],
  ];

  const wyroznienie = (tytul: string, z: Zadanie | undefined, wartosc: (s: StatPytania) => string) =>
    z && (
      <section className="karta wyroznienie-pytania">
        <p className="etykieta">{tytul}</p>
        <p className="wyroznienie-wartosc">{wartosc(stat.get(z.id)!)}</p>
        <p className="lista-opis">
          {nrPytania(z)}. {z.tresc}
        </p>
      </section>
    );

  return (
    <main>
      <p className="okruchy">
        <Link href="/admin/quizy">← Quizy</Link>
      </p>
      <div className="naglowek-strony">
        <h1>{quiz.tytul}</h1>
        <Link href={`/admin/quizy/${quiz.id}`} className="przycisk-maly">
          {mozeZmieniac ? "Edytuj quiz" : "Podgląd quizu"}
        </Link>
      </div>

      <dl className="dane-gry">
        {dane
          .filter(([, w]) => w)
          .map(([nazwa, wartosc]) => (
            <div key={nazwa}>
              <dt>{nazwa}</dt>
              <dd>{wartosc}</dd>
            </div>
          ))}
      </dl>

      {odpowiedzi === 0 ? (
        <p className="lista-pusta">Brak odpowiedzi graczy (gry z samymi botami się nie liczą).</p>
      ) : (
        <>
          {doWyroznien.length > 0 && (
            // sekcja osobno, siatka w środku: siatka z klasą sekcji dostawała marginesy rytmu (DESIGN-SYSTEM.md)
            <section className="panel-sekcja">
              <div className="wyroznienia">
                {wyroznienie("Najtrudniejsze", najtrudniejsze, (s) => `${procent(s.trafnosc)} dobrze`)}
                {wyroznienie("Najłatwiejsze", najlatwiejsze, (s) => `${procent(s.trafnosc)} dobrze`)}
                {wyroznienie("Najdłużej myśleli", najdluzej, (s) => `średnio ${sekundy(s.sredni_czas_ms)}`)}
              </div>
            </section>
          )}

          <section className="panel-sekcja">
            <h2>Pytania</h2>
            <ol className="lista statystyki-pytan">
              {pytania.map((z, i) => {
                const s = stat.get(z.id);
                return (
                  <li key={z.id}>
                    <span className="krok-nr statystyki-nr">{i + 1}.</span>
                    <div className="lista-glowna">
                      <div className="lista-tytul">{z.tresc}</div>
                      <p className="pytanie-skrot-rodzaj">
                        <span className={`rodzaj-pytania ${z.typ}`}>{NAZWY_TYPOW[z.typ]}</span>
                        <span className="lista-opis">
                          {s
                            ? [
                                `${s.odpowiedzi} odp.`,
                                wSerii(z) ? "finał" : `średnio ${sekundy(s.sredni_czas_ms)}`,
                                !wSerii(z) && s.najszybciej_dobrze_ms !== null
                                  ? `najszybciej dobrze ${sekundy(s.najszybciej_dobrze_ms)}`
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" · ")
                            : "bez odpowiedzi"}
                        </span>
                      </p>
                    </div>
                    {s && (
                      <div className={`trafnosc ${poziom(s.trafnosc)}`} aria-label={`Trafność ${procent(s.trafnosc)}`}>
                        <span className="trafnosc-pasek">
                          <span style={{ width: procent(s.trafnosc) }} />
                        </span>
                        <strong>{procent(s.trafnosc)}</strong>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </>
      )}

      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Rozgrywki <span className="licznik">{gry.length}</span>
        </h2>
        <ListaGier gry={gry} pusta="Ten quiz nie był jeszcze grany." lokal={!!lokalRoli(rola)} />
      </section>
    </main>
  );
}
