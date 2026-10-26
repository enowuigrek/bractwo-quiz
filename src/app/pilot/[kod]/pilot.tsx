"use client";

import Link from "next/link";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { LogoQuiz } from "@/components/logo-quiz";
import { usePotwierdzenie, type OpcjePotwierdzenia } from "@/components/okno";
import {
  fazaTeraz,
  komunikatBledu,
  pamiec,
  przesuniecieZegara,
  sekundaOdliczania,
  useCzasSerwera,
  useKoniecPytania,
  useNasluch,
  zZegarem,
} from "@/lib/gra/nasluch";
import type { AkcjaPilota, FazaWidoczna, GraczPilota, PilotStan, ZadanieWidoczne } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { kiedyStart, opisOdliczania, useDoStartu } from "@/lib/gra/zapowiedz";
import { napisMnoznika } from "@/lib/etapy";
import { LITERY, NAZWY_TYPOW, jedenWybor, liczbaZJednostka } from "@/lib/zadania";
import { liczbaPytan } from "@/app/admin/(panel)/quizy/limity";
import { krokiFinalu, META_FINALU } from "@/lib/gra/final";
import { GraczePilota } from "./gracze";
import { useAutoProwadzenie } from "./auto";
import { quizKlasyczny } from "@/lib/gra/wyscig";
import { IkonaAutomat, IkonaGlosnik, IkonaWyciszony } from "@/components/ikony";
import { BotyPilota, useBoty } from "./boty";
import { UdostepnijPilota } from "./udostepnij";
import { MenuPanelu, type GraWMenu } from "@/app/admin/(panel)/_komponenty/menu";
import { wylogujAdmina } from "@/app/admin/akcje";

const kluczPilota = (kod: string) => `bractwo-quiz:pilot:${kod}`;

const NAZWY: Record<FazaWidoczna, string> = {
  poczekalnia: "Poczekalnia",
  wstep: "Wstęp",
  etap: "Plansza etapu",
  seria: "Seria trwa",
  pijany: "Pijany finał (nic nie liczy)",
  werble: "Werble przed podium",
  przygotuj: "Odliczanie",
  pytanie: "Pytanie trwa",
  wynik: "Wynik",
  odpowiedzi: "Odpowiedzi graczy",
  ranking: "Ranking",
  podium: "Podium",
  tabela: "Tabela wyników",
  koniec: "Gra zakończona",
};

const bezSubskrypcji = () => () => {};

type Props = { kod: string; tokenZAdresu: string | null };

export function Pilot({ kod, tokenZAdresu }: Props) {
  // Token z linku zapisujemy w localStorage i usuwamy z paska adresu,
  // żeby nie wyciekł przy pokazywaniu ekranu. Odświeżenie strony bierze go z pamięci.
  const zamontowany = useSyncExternalStore(
    bezSubskrypcji,
    () => true,
    () => false,
  );
  const zPamieci = useSyncExternalStore(
    bezSubskrypcji,
    () => pamiec.czytaj(kluczPilota(kod)),
    () => null,
  );
  const token = tokenZAdresu ?? zPamieci;

  // Zapis dopiero po udanym `pilot_stan`, żeby zły link nie nadpisał dobrego tokenu.
  const zapamietany = useRef(false);
  const zapamietaj = useCallback(() => {
    if (zapamietany.current || !tokenZAdresu) return;
    zapamietany.current = true;
    if (pamiec.zapisz(kluczPilota(kod), tokenZAdresu)) {
      window.history.replaceState(null, "", `/pilot/${kod}`);
    }
  }, [kod, tokenZAdresu]);

  const [stan, ustawStan] = useState<PilotStan | null>(null);
  const [gracze, ustawGraczy] = useState<GraczPilota[]>([]);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);
  const [bladDostepu, ustawBladDostepu] = useState<string | null>(null);
  const [bladSieci, ustawBladSieci] = useState<string | null>(null);
  const [bladAkcji, ustawBladAkcji] = useState<string | null>(null);
  const [wysylam, ustawWysylam] = useState(false);

  const pobierz = useCallback(async () => {
    if (!token) return;
    const wyslano = Date.now();
    const [s, g] = await Promise.all([
      supabase().rpc("pilot_stan", { p_kod: kod, p_host_token: token }),
      supabase().rpc("pilot_gracze", { p_kod: kod, p_host_token: token }),
    ]);
    const odebrano = Date.now();
    if (s.error) {
      const komunikat = komunikatBledu(s.error);
      if (komunikat.startsWith("Brak połączenia")) ustawBladSieci(komunikat);
      else ustawBladDostepu(komunikat);
      return;
    }
    const nowy = s.data as PilotStan;
    ustawStan(nowy);
    ustawPrzesuniecie(przesuniecieZegara(nowy.teraz, wyslano, odebrano));
    if (g.data) ustawGraczy(g.data as GraczPilota[]);
    ustawBladDostepu(null);
    ustawBladSieci(null);
    zapamietaj();
  }, [kod, token, zapamietaj]);

  useNasluch(kod, pobierz, ["stan", "gracz", "odpowiedz"]);

  const teraz = useCzasSerwera(przesuniecie, zZegarem(stan?.faza));
  const startZapowiedzi = stan?.faza === "poczekalnia" ? stan.planowany_start : null;
  const doZapowiedzi = useDoStartu(startZapowiedzi, przesuniecie);
  useKoniecPytania(kod, stan, teraz);
  useBoty(kod, token, stan);
  useAutoProwadzenie(kod, token, stan, przesuniecie, ustawStan);
  const [potwierdz, oknoPotwierdzenia] = usePotwierdzenie();

  if (!zamontowany) {
    return <Naglowek />;
  }

  if (!token || (bladDostepu && !stan)) {
    return (
      <>
        <Naglowek />
        <h1>Brak dostępu do pilota</h1>
        <p className="pomocniczy">
          Ten link pilota jest nieprawidłowy albo niepełny. Zeskanuj kod QR pilota z ekranu gry w panelu admina.
        </p>
      </>
    );
  }

  if (!stan) {
    return (
      <>
        <Naglowek />
        <p className="pomocniczy">{bladSieci ?? "Łączę z grą…"}</p>
      </>
    );
  }

  async function akcja(a: AkcjaPilota, pytanie?: string, opcje?: OpcjePotwierdzenia) {
    if (wysylam || !token) return;
    if (pytanie && !(await potwierdz(pytanie, opcje))) return;
    ustawWysylam(true);
    ustawBladAkcji(null);
    const wyslano = Date.now();
    const { data, error } = await supabase().rpc("pilot_akcja", {
      p_kod: kod,
      p_host_token: token,
      p_akcja: a,
    });
    const odebrano = Date.now();
    ustawWysylam(false);
    if (error) {
      ustawBladAkcji(komunikatBledu(error));
      void pobierz();
      return;
    }
    const nowy = data as PilotStan;
    ustawStan(nowy);
    ustawPrzesuniecie(przesuniecieZegara(nowy.teraz, wyslano, odebrano));
  }

  async function przelaczAuto() {
    if (wysylam || !token || !stan) return;
    ustawWysylam(true);
    ustawBladAkcji(null);
    const { data, error } = await supabase().rpc("ustaw_auto", { p_kod: kod, p_host_token: token, p_wlacz: !stan.auto });
    ustawWysylam(false);
    if (error) ustawBladAkcji(komunikatBledu(error));
    else ustawStan(data as PilotStan);
  }

  // `przygotuj` przechodzi w `pytanie` sam, gdy minie `faza_od`; nie czekamy na odpytanie bazy
  const { faza, doStartu, doKonca, bezLimitu } = fazaTeraz(stan, teraz);
  const klasyczny = quizKlasyczny(stan);
  // w finale trójki odpowiadają tylko finaliści, wcześniej wszyscy, którzy nie odpadli
  const grajacy = stan.finalisci?.length ?? stan.w_grze;
  const wszyscy = grajacy > 0 && stan.liczba_odpowiedzi >= grajacy;
  const z = stan.zadanie;
  const liczba = stan.quiz?.liczba_zadan ?? 0;
  const druzyny = stan.tryb === "druzyny";
  const nastepne = stan.ostatnie_zadanie
    ? { akcja: "podium" as const, napis: "Pokaż podium" }
    : {
        akcja: "nastepne" as const,
        napis: stan.nastepny_etap
          ? `Następny etap: ${stan.nastepny_etap.nazwa}`
          : stan.nastepne_typ === "ciekawostka"
            ? "Pokaż ciekawostkę"
            : z
              ? `Następne pytanie (${z.lp + 1}/${liczba})`
              : "Start quizu",
      };
  const etap = stan.etap;

  // Licznik w stałym miejscu nad przyciskami (26.10): stoi zawsze, żeby przyciski pod nim nie skakały, gdy znika
  // (Łukasz: w pilocie przyciski nie mogą zmieniać pozycji), a w każdej fazie pokazuje coś przydatnego. W pytaniu
  // odpowiedzi rosną, a komplet świeci na zielono; przy wyniku i dalej zostaje wynik ostatniego pytania
  const planszaGotowych =
    (faza === "wstep" && !klasyczny) || faza === "etap" || (faza === "wynik" && z?.typ === "ciekawostka");
  const poPytaniu = z && z.typ !== "ciekawostka" && ["przygotuj", "pytanie", "wynik", "odpowiedzi", "ranking"].includes(faza);
  const [napisLicznika, wartoscLicznika, komplet]: [string, string, boolean] =
    planszaGotowych
      ? ["Gotowi do dalszej gry", `${stan.gotowi}/${stan.gotowi_z}`, stan.gotowi >= stan.gotowi_z]
      : poPytaniu
        ? [
            wszyscy ? "Wszyscy odpowiedzieli" : "Odpowiedziało",
            `${stan.liczba_odpowiedzi}/${grajacy}`,
            wszyscy && ["przygotuj", "pytanie", "wynik"].includes(faza),
          ]
        : faza === "seria"
          ? ["Odpowiedzi w serii", String((stan.seria ?? []).reduce((s, g) => s + g.odpowiedzi, 0)), false]
          : faza === "poczekalnia"
            ? ["Graczy w poczekalni", String(stan.liczba_graczy), false]
            : ["Graczy w grze", String(stan.w_grze), false];
  // po prawej w drugim wierszu ramki krótko, co się dzieje z czasem (26.10, Łukasz: zamiast osobnych ramek
  // z informacjami, przez które skakały przyciski); rodzaj następnego pytania ma pierwszeństwo
  const sekundDo = (iso: string | null) => (iso ? Math.max(0, Math.ceil((Date.parse(iso) - teraz) / 1000)) : null);
  const infoStanu =
    faza === "poczekalnia" && startZapowiedzi && doZapowiedzi !== null
      ? `Start ${kiedyStart(startZapowiedzi)} · ${opisOdliczania(doZapowiedzi)}`
      : faza === "wstep" && klasyczny && stan.faza_do
        ? `Start za ${sekundDo(stan.faza_do)} s`
        : faza === "przygotuj"
          ? `Start za ${sekundaOdliczania(doStartu)} s`
          : faza === "pytanie"
            ? bezLimitu
              ? "Bez limitu"
              : doKonca > 0
                ? `Zostało ${Math.ceil(doKonca / 1000)} s`
                : "Czas minął"
            : (faza === "seria" || faza === "pijany") && stan.faza_od && teraz < Date.parse(stan.faza_od)
              ? `Start za ${sekundDo(stan.faza_od)} s`
              : (faza === "seria" || faza === "pijany") && stan.faza_do
                ? `Do końca ${sekundDo(stan.faza_do)} s`
                : faza === "podium" || faza === "tabela"
                  ? "Podium i tabela na TV"
                  : faza === "koniec"
                    ? "Koniec gry"
                    : "";
  // gdzie jesteśmy w quizie: w wyścigu etap i pytanie, w klasycznym samo pytanie (przed startem: ile pytań)
  const postep = !z
    ? liczbaPytan(liczba)
    : etap
      ? `Etap ${etap.nr}/${etap.liczba} · ${z.lp}/${liczba}`
      : `Pytanie ${z.lp}/${liczba}`;
  // rodzaj następnego pytania w kolorze (rodzaje się mieszają, prowadzący uprzedza graczy przed startem)
  const nastepnyRodzaj =
    stan.nastepne_typ && ["poczekalnia", "wynik", "odpowiedzi", "ranking"].includes(faza) ? stan.nastepne_typ : null;
  const licznik = (
    <div className={`pilot-licznik${komplet ? " komplet" : ""}`} role="status">
      <p>
        <span>
          {komplet && (
            <span className="pilot-licznik-znak" aria-hidden>
              ✓
            </span>
          )}{" "}
          {napisLicznika}
        </span>
        <strong>{wartoscLicznika}</strong>
      </p>
      <p className="pilot-licznik-postep">
        <span>{postep}</span>
        {nastepnyRodzaj ? (
          <span className={`rodzaj-pytania ${nastepnyRodzaj}`} title="Następne pytanie">
            {NAZWY_TYPOW[nastepnyRodzaj]}
          </span>
        ) : (
          infoStanu && <span className="pilot-licznik-info">{infoStanu}</span>
        )}
      </p>
    </div>
  );

  return (
    <>
      <Naglowek
        gra={{
          href: `/pilot/${kod}`,
          tytul: stan.quiz?.tytul ?? "Quiz",
          kod,
          faza,
          poczekalniaOtwarta: stan.poczekalnia_otwarta,
          lokal: stan.lokal ?? null,
        }}
      />
      {/* na komputerze dwie kolumny: sterowanie po lewej (zawsze pod ręką), podgląd pytania i graczy po prawej */}
      <div className="pilot">
        <div className="pilot-sterowanie">
          {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
          {/* kod gry na wierzchu, przy tytule: do podania komuś do wpisania (26.10, w nagłówku jest teraz menu) */}
          <div className="pilot-tytul">
            <h1 style={{ marginBottom: 4 }}>{stan.quiz?.tytul ?? "Quiz"}</h1>
            <span className="gra-kod" aria-label={`Kod gry ${kod}`}>
              {kod}
            </span>
          </div>
          {/* lokal i faza, a obok przełączniki samymi ikonami (26.10: bez podpisów, mieszczą się w jednym wierszu);
              włączony świeci na złoto, nazwa w podpowiedzi i dla czytnika ekranu. Muzyka i efekty grają tylko na TV,
              klasyczny pub quiz na razie nie ma muzyki. Automat klika kolejne kroki sam (auto.tsx) */}
          <div className="pilot-pasek">
            <p className="pomocniczy">{[stan.lokal?.nazwa, NAZWY[faza]].filter(Boolean).join(" · ")}</p>
            <div className="pilot-przelaczniki">
              {!klasyczny && (
                <button
                  type="button"
                  className={`pilot-ikona${stan.muzyka ? " wlaczony" : ""}`}
                  aria-pressed={stan.muzyka}
                  aria-label="Muzyka i dźwięki na TV"
                  title={stan.muzyka ? "Muzyka i dźwięki na TV: grają" : "Muzyka i dźwięki na TV: wyłączone"}
                  disabled={wysylam}
                  onClick={() => akcja("muzyka")}
                >
                  {stan.muzyka ? <IkonaGlosnik /> : <IkonaWyciszony />}
                </button>
              )}
              <button
                type="button"
                className={`pilot-ikona${stan.auto ? " wlaczony" : ""}`}
                aria-pressed={stan.auto}
                aria-label="Prowadzenie automatyczne"
                title={stan.auto ? "Prowadzenie automatyczne: włączone" : "Prowadzenie automatyczne: wyłączone"}
                disabled={wysylam}
                onClick={() => void przelaczAuto()}
              >
                <IkonaAutomat />
              </button>
            </div>
          </div>

          {licznik}

          {/* przyciski zawsze na górze: nie uciekają w dół, gdy rośnie lista odpowiedzi albo graczy */}
          {bladAkcji && (
            <p className="blad" role="alert">
              {bladAkcji}
            </p>
          )}
          {bladSieci && <p className="pomocniczy">{bladSieci}, ponawiam…</p>}

          <section style={{ marginTop: 18, display: "grid", gap: 12 }}>
            {faza === "poczekalnia" && !stan.poczekalnia_otwarta && (
              <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("otworz")}>
                Otwórz poczekalnię (QR na TV)
              </button>
            )}
            {faza === "seria" && (
              <button
                className="przycisk"
                disabled={wysylam}
                onClick={() =>
                  akcja("wynik", "Zakończyć serię teraz? Kto nie skończył, dostaje punkty tylko za to, co zdążył.", {
                    tak: "Zakończ serię",
                  })
                }
              >
                Zakończ serię wcześniej
              </button>
            )}

            {faza === "etap" && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("nastepne")}>
                  {etap?.seria ? "Start serii" : "Start etapu (pierwsze pytanie)"}
                </button>
                {z && (
                  <button className="przycisk" disabled={wysylam} onClick={() => akcja("ranking")}>
                    Wróć do rankingu
                  </button>
                )}
              </>
            )}

            {/* klasyczny pub quiz: plansza startowa odlicza 10 s i sama startuje 1. pytanie; można szybciej */}
            {faza === "wstep" && klasyczny && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("nastepne")}>
                  Pierwsze pytanie od razu
                </button>
              </>
            )}

            {/* wstęp: TV pokazuje całą drogę, prowadzący opowiada i przechodzi do planszy 1. etapu */}
            {faza === "wstep" && !klasyczny && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
                  {nastepne.napis}
                </button>
              </>
            )}

            {faza === "poczekalnia" && (
              <button
                className={`przycisk${stan.poczekalnia_otwarta ? " zloty" : ""}`}
                disabled={wysylam || liczba === 0}
                onClick={() =>
                  akcja(
                    "nastepne",
                    stan.liczba_graczy === 0 ? "Nikt jeszcze nie dołączył. Wystartować mimo to?" : undefined,
                    { tak: "Wystartuj" },
                  )
                }
              >
                {liczba === 0 ? "Quiz nie ma pytań" : "Start quizu"}
              </button>
            )}

            {/* wynik pokazuje się sam po czasie albo gdy wszyscy odpowiedzą; ręcznie tylko wcześniej */}
            {(faza === "przygotuj" || faza === "pytanie") &&
              (bezLimitu ? (
                <button
                  className={`przycisk ${wszyscy ? "pozytywny" : "zloty"}`}
                  disabled={wysylam}
                  onClick={() =>
                    akcja(
                      "wynik",
                      wszyscy ? undefined : "Nie wszyscy odpowiedzieli. Zakończyć pytanie teraz i pokazać wynik?",
                      { tak: "Pokaż wynik" },
                    )
                  }
                >
                  {wszyscy ? "Pokaż wynik" : "Zakończ pytanie i pokaż wynik"}
                </button>
              ) : (
                <>
                  {doKonca > 0 && (
                    <button
                      className={`przycisk${wszyscy ? " pozytywny" : ""}`}
                      disabled={wysylam}
                      onClick={() =>
                        akcja("wynik", "Czas jeszcze leci. Zakończyć pytanie teraz i pokazać wynik?", {
                          tak: "Pokaż wynik",
                        })
                      }
                    >
                      Zakończ pytanie wcześniej
                    </button>
                  )}
                </>
              ))}

            {/* po pytaniu: wynik → odpowiedzi → ranking → następne; każdy krok można pominąć */}
            {/* po ostatnim pytaniu bez rankingu: od razu podium (odpowiedzi graczy można jeszcze pokazać) */}
            {/* ciekawostka: plansza bez odpowiedzi, więc od razu dalej */}
            {faza === "wynik" && z?.typ === "ciekawostka" && (
              <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
                {nastepne.napis}
              </button>
            )}
            {faza === "wynik" &&
              z?.typ !== "ciekawostka" &&
              (stan.ostatnie_zadanie ? (
                <>
                  <button className={`przycisk ${wszyscy ? "pozytywny" : "zloty"}`} disabled={wysylam} onClick={() => akcja("podium")}>
                    Pokaż podium
                  </button>
                  <button className="przycisk" disabled={wysylam} onClick={() => akcja("odpowiedzi")}>
                    Pokaż odpowiedzi graczy
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={`przycisk ${wszyscy ? "pozytywny" : "zloty"}`}
                    disabled={wysylam}
                    onClick={() => akcja("odpowiedzi")}
                  >
                    Pokaż odpowiedzi graczy
                  </button>
                  <button className="przycisk" disabled={wysylam} onClick={() => akcja("ranking")}>
                    Pokaż ranking
                  </button>
                  <button className="przycisk" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
                    {nastepne.napis}
                  </button>
                </>
              ))}

            {faza === "odpowiedzi" &&
              (stan.ostatnie_zadanie ? (
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("podium")}>
                  Pokaż podium
                </button>
              ) : (
                <>
                  <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("ranking")}>
                    Pokaż ranking
                  </button>
                  <button className="przycisk" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
                    {nastepne.napis}
                  </button>
                </>
              ))}

            {faza === "ranking" && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
                  {nastepne.napis}
                </button>
                <button className="przycisk" disabled={wysylam} onClick={() => akcja("odpowiedzi")}>
                  Wróć do odpowiedzi graczy
                </button>
              </>
            )}

            {/* po ostatnim pytaniu obok podium jest pełna tabela */}
            {stan.ostatnie_zadanie && (faza === "wynik" || faza === "odpowiedzi" || faza === "ranking") && (
              <button className="przycisk" disabled={wysylam} onClick={() => akcja("tabela")}>
                Pokaż pełną tabelę
              </button>
            )}

            {/* pijany finał kończy się sam po czasie; wcześniej tylko po potwierdzeniu, żeby nie uciąć zabawy */}
            {faza === "pijany" && (
              <button
                className="przycisk zloty"
                disabled={wysylam}
                onClick={() =>
                  akcja("werble", "Gracze jeszcze odpowiadają. Zakończyć pijany finał i pokazać werble?", {
                    tak: "Pokaż werble",
                  })
                }
              >
                Zakończ i pokaż werble
              </button>
            )}

            {/* po finale serią TV i telefony czekają w ciemności, aż prowadzący odsłoni podium */}
            {faza === "werble" && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("podium")}>
                  Pokaż podium
                </button>
              </>
            )}

            {/* TV sam pokazuje na zmianę podium i tabelę (co 10 s, od drugiej pętli z podziękowaniem) */}
            {(faza === "podium" || faza === "tabela") && (
              <>
                <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("koniec")}>
                  Zakończ grę
                </button>
              </>
            )}

          </section>

          {/* odpadanie przed finałem ustalone na sztywno (26.10), progi zmienia się już tylko w bazie */}
          {faza === "poczekalnia" && <BotyPilota stan={stan} kod={kod} token={token} onZmiana={ustawStan} />}
        </div>

        <div className="pilot-podglad">

          {faza === "poczekalnia" && (
            <details className="karta pilot-gracze-karta" style={{ marginTop: 18 }} open>
              <summary className="etykieta">
                {druzyny ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}/{stan.max_graczy}
              </summary>
              <GraczePilota kod={kod} token={token} gracze={gracze} pytanie={false} koniec={false} odswiez={pobierz} />
            </details>
          )}

          {faza === "etap" && etap && (
            <section className="karta" style={{ marginTop: 18 }}>
              <p className="etykieta" style={{ marginTop: 0 }}>
                Etap {etap.nr} z {etap.liczba} · {etap.liczba_pytan} pyt.
              </p>
              <p
                style={{ fontWeight: "var(--w-black)", fontSize: "var(--fs-h3)", margin: "0 0 6px", color: "var(--zloto)" }}
              >
                {etap.nazwa}
              </p>
              {etap.opis && <p style={{ margin: "0 0 10px" }}>{etap.opis}</p>}
              <p className="pomocniczy" style={{ margin: 0 }}>
                {[
                  `Punkty ${napisMnoznika(etap.mnoznik)}`,
                  etap.czas_s ? `${etap.czas_s} s ${etap.seria ? "na całą serię" : "na odpowiedź"}` : null,
                  etap.typy.map((t) => NAZWY_TYPOW[t].toLowerCase()).join(", "),
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {stan.finalisci && (
                <p style={{ margin: "10px 0 0" }}>
                  <strong>Finał trójki:</strong> {stan.finalisci.map((f) => f.nick).join(", ")}. Reszta kibicuje.
                </p>
              )}
              {!etap.finalowy && (etap.przechodzi !== null || etap.final_po_etapie) && (
                <p style={{ margin: "10px 0 0" }}>
                  <strong>Odpadanie:</strong> po tym etapie gra dalej{" "}
                  {etap.final_po_etapie ? "trójka (finał)" : `${etap.przechodzi} najlepszych`}; teraz gra {stan.w_grze}.
                </p>
              )}
            </section>
          )}

          {/* seria: postęp każdego grającego na żywo (TV pokazuje go na drogach do szklanki) */}
          {faza === "seria" && etap && (
            <section className="karta" style={{ marginTop: 18 }}>
              <p className="etykieta" style={{ marginTop: 0, display: "flex", justifyContent: "space-between" }}>
                <span>
                  {etap.nazwa} · {etap.finalowy ? `wyścig do ${META_FINALU} kroków` : `seria ${etap.liczba_pytan} pyt.`}
                </span>
                <span className="gra-kod">
                  {stan.faza_od && teraz < Date.parse(stan.faza_od)
                    ? `start za ${Math.max(0, Math.ceil((Date.parse(stan.faza_od) - teraz) / 1000))} s`
                    : stan.faza_do
                      ? `${Math.max(0, Math.ceil((Date.parse(stan.faza_do) - teraz) / 1000))} s`
                      : ""}
                </span>
              </p>
              <ol className="pilot-odpowiedzi">
                {(stan.seria ?? []).map((g) =>
                  // finał: kroki do szklanki (przewaga, +1 za dobrą, −1 za złą), zwykła seria: odpowiedzi z liczby pytań
                  etap.finalowy ? (
                    <li key={g.nick} className={krokiFinalu(g) >= META_FINALU ? "poprawna" : undefined}>
                      {g.nick}: {Math.round(krokiFinalu(g) * 10) / 10}/{META_FINALU} kroków (przewaga {g.start ?? 0}),{" "}
                      {g.odpowiedzi} odpowiedzi
                    </li>
                  ) : (
                    <li key={g.nick} className={g.odpowiedzi >= etap.liczba_pytan ? "poprawna" : undefined}>
                      {g.nick}: {g.odpowiedzi}/{etap.liczba_pytan} odpowiedzi, dobrze {Math.round(g.dobre * 10) / 10}
                    </li>
                  ),
                )}
              </ol>
            </section>
          )}

          {/* pijany finał: wynik jest już ustalony i widzi go tylko prowadzący */}
          {faza === "pijany" && (
            <section className="karta" style={{ marginTop: 18 }}>
              <p className="etykieta" style={{ marginTop: 0, display: "flex", justifyContent: "space-between" }}>
                <span>Pijany finał · nic się nie liczy</span>
                <span className="gra-kod">
                  {stan.faza_do ? `${Math.max(0, Math.ceil((Date.parse(stan.faza_do) - teraz) / 1000))} s` : ""}
                </span>
              </p>
              <PodiumPilota gracze={gracze} />
            </section>
          )}

          {z &&
            faza !== "poczekalnia" &&
            faza !== "etap" &&
            faza !== "seria" &&
            faza !== "pijany" &&
            faza !== "werble" &&
            faza !== "koniec" &&
            faza !== "podium" &&
            faza !== "tabela" && (
              // pytanie z rozwiązaniem zwinięte: rozwija się, gdy prowadzący chce zajrzeć (26.10)
              <details className="karta pilot-pytanie-karta" style={{ marginTop: 18 }}>
                {/* czas do końca stoi w ramce stanu nad przyciskami */}
                <summary className="etykieta">
                  Pytanie {z.lp}/{liczba} z rozwiązaniem
                </summary>
                {etap && (
                  <p className="pomocniczy" style={{ margin: "0 0 6px" }}>
                    {etap.nazwa} · punkty {napisMnoznika(etap.mnoznik)}
                    {stan.finalisci ? " · finał trójki" : ""}
                  </p>
                )}
                <p style={{ fontWeight: "var(--w-black)", margin: "0 0 12px" }}>{z.tresc}</p>
                <RozwiazaniePilota z={z} poprawna={stan.poprawna} />
                {stan.wszystkie_podpowiedzi.length > 0 && (
                  <ol className="pilot-odpowiedzi" style={{ marginTop: 10 }}>
                    {stan.wszystkie_podpowiedzi.map((p, i) => (
                      <li key={i} className={i < z.podpowiedzi.length ? "poprawna" : undefined}>
                        <span className="pilot-litera">P{i + 1}</span>
                        {p}
                      </li>
                    ))}
                  </ol>
                )}
                <p style={{ margin: "14px 0 0" }}>
                  Odpowiedziało{" "}
                  <strong className="gra-kod">
                    {stan.liczba_odpowiedzi}/{grajacy}
                  </strong>
                  {z.liczba_poprawnych !== undefined && (
                    <>
                      {" · "}
                      {jedenWybor(z.typ) ? "dobrze" : z.typ === "szacowanie" ? "w punkt" : "w pełni dobrze"}{" "}
                      <strong className="ok">{z.liczba_poprawnych}</strong>
                    </>
                  )}
                </p>
              </details>
            )}

          {faza !== "poczekalnia" && (
            <details className="karta pilot-gracze-karta" style={{ marginTop: 18 }}>
              <summary className="etykieta">
                {druzyny ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}
              </summary>
              <GraczePilota
                kod={kod}
                token={token}
                gracze={gracze}
                pytanie={faza === "pytanie"}
                gotowosc={planszaGotowych}
                koniec={faza === "koniec"}
                odswiez={pobierz}
              />
            </details>
          )}

          {/* dołączanie, przekazanie pilota i ekran: pod ręką, ale niżej */}
          <UdostepnijPilota kod={kod} token={token} />
        </div>
      </div>
      {/* Na samym dole, pod graczami i dołączaniem (26.10): awaryjne zakończenie z dala od zwykłych przycisków,
          a po grze powrót do panelu (np. żeby uruchomić następną grę; bez logowania panel poprosi o hasło) */}
      <div className="pilot-dol">
        {faza !== "koniec" && faza !== "podium" && faza !== "tabela" && (
          <button
            className="przycisk niebezpieczny"
            disabled={wysylam}
            onClick={() =>
              akcja("koniec", "Zakończyć grę teraz? Tego nie da się cofnąć.", {
                tak: "Zakończ grę",
                niebezpieczne: true,
              })
            }
          >
            Zakończ grę
          </button>
        )}
        {faza === "koniec" && (
          <Link href="/admin/gry" className="przycisk zloty">
            Panel
          </Link>
        )}
      </div>
      {oknoPotwierdzenia}
    </>
  );
}

/** Pytanie na pilocie z rozwiązaniem (prowadzący widzi je od początku). */
function RozwiazaniePilota({ z, poprawna }: { z: ZadanieWidoczne; poprawna: PilotStan["poprawna"] }) {
  const p = Array.isArray(poprawna) ? poprawna : null;
  if (z.typ === "szacowanie" && typeof poprawna === "number") {
    return (
      <>
        <p className="pomocniczy" style={{ margin: "0 0 6px" }}>
          {NAZWY_TYPOW[z.typ]} · zakres {liczbaZJednostka(z.dane.min ?? 0)}–{liczbaZJednostka(z.dane.max ?? 0)}
        </p>
        <ol className="pilot-odpowiedzi">
          <li className="poprawna">
            Poprawna: <strong>{liczbaZJednostka(poprawna, z.dane.jednostka)}</strong>
          </li>
          {z.najblizej?.map((n) => (
            <li key={n.nick}>
              {n.nick}: {liczbaZJednostka(n.liczba, z.dane.jednostka)}
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (z.typ === "kolejnosc" && p) {
    return (
      <>
        <p className="pomocniczy" style={{ margin: "0 0 6px" }}>
          {NAZWY_TYPOW[z.typ]} · właściwa:
        </p>
        <ol className="pilot-odpowiedzi">
          {p.map((idx, poz) => (
            <li key={idx} className="poprawna">
              <span className="pilot-litera">{poz + 1}</span>
              {z.dane.elementy?.[idx]}
            </li>
          ))}
        </ol>
      </>
    );
  }
  if (z.typ === "pary" && p) {
    return (
      <>
        <p className="pomocniczy" style={{ margin: "0 0 6px" }}>
          {NAZWY_TYPOW[z.typ]}:
        </p>
        <ol className="pilot-odpowiedzi">
          {(z.dane.lewe ?? []).map((l, i) => (
            <li key={i} className="poprawna">
              {l} ↔ {z.dane.prawe?.[p[i]]}
            </li>
          ))}
        </ol>
      </>
    );
  }
  const czyPoprawna = (i: number) => (p ? p.includes(i) : i === poprawna);
  return (
    <>
      {z.typ !== "wybor" && (
        <p className="pomocniczy" style={{ margin: "0 0 6px" }}>
          {NAZWY_TYPOW[z.typ]}
        </p>
      )}
      <ol className="pilot-odpowiedzi">
        {(z.dane.odpowiedzi ?? []).map((o, i) => (
          <li key={i} className={czyPoprawna(i) ? "poprawna" : undefined}>
            <span className="pilot-litera">{LITERY[i]}</span>
            {o}
            {czyPoprawna(i) && <span className="ok"> ✓</span>}
            {z.rozklad && <span className="pilot-liczba">{z.rozklad[i] ?? 0}</span>}
          </li>
        ))}
      </ol>
    </>
  );
}

/**
 * Wynik w pijanym finale: pierwsza trójka z punktów `pilot_gracze` (po finale już się nie zmieniają).
 * Miejsca jak w rankingu bazy: ten sam wynik to to samo miejsce.
 */
function PodiumPilota({ gracze }: { gracze: GraczPilota[] }) {
  const podium = [...gracze]
    .sort((a, b) => b.punkty - a.punkty || a.nick.localeCompare(b.nick, "pl"))
    .map((g, _, l) => ({ ...g, miejsce: 1 + l.filter((x) => x.punkty > g.punkty).length }))
    .filter((g) => g.miejsce <= 3);
  const pierwsi = podium.filter((g) => g.miejsce === 1).map((g) => g.nick);
  if (pierwsi.length === 0) return null;
  return (
    <>
      <p style={{ fontWeight: "var(--w-black)", fontSize: "var(--fs-h3)", margin: "0 0 10px", color: "var(--zloto)" }}>
        {pierwsi.length > 1 ? "Wygrywają" : "Wygrywa"}: {pierwsi.join(", ")}
      </p>
      <ol className="pilot-odpowiedzi">
        {podium.map((g) => (
          <li key={g.nick}>
            <span className="pilot-litera">{g.miejsce}.</span>
            {g.nick} · {g.punkty.toLocaleString("pl-PL")} pkt
          </li>
        ))}
      </ol>
    </>
  );
}

/** Nagłówek pilota: logo i menu panelu (zawsze, także na komputerze), ze skrótem do tej gry, gdy już wiadomo jakiej. */
function Naglowek({ gra = null }: { gra?: GraWMenu | null }) {
  return (
    <header className="gra-naglowek">
      <LogoQuiz wysokosc={40} dopisek="pilot" />
      <MenuPanelu wyloguj={wylogujAdmina} gra={gra} />
    </header>
  );
}
