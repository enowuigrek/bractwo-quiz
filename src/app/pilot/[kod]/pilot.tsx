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
import { godzinaStartu, opisOdliczania, useDoStartu } from "@/lib/gra/zapowiedz";
import { napisMnoznika } from "@/lib/etapy";
import { LITERY, NAZWY_TYPOW, PODPOWIEDZI_TYPOW, jedenWybor, liczbaZJednostka } from "@/lib/zadania";
import { krokiFinalu, META_FINALU } from "@/lib/gra/final";
import { GraczePilota } from "./gracze";
import { useAutoProwadzenie } from "./auto";
import { IkonaAutomat, IkonaGlosnik, IkonaWyciszony } from "@/components/ikony";
import { BotyPilota, useBoty } from "./boty";
import { ProgiPilota } from "./progi";

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
  const [ekranOddany, ustawEkranOddany] = useState(false);
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
  const doZapowiedzi = useDoStartu(stan?.faza === "poczekalnia" ? (stan.planowany_start ?? null) : null, przesuniecie);
  useKoniecPytania(kod, stan, teraz);
  useBoty(kod, token, stan);
  useAutoProwadzenie(kod, token, stan, przesuniecie, ustawStan);
  const [potwierdz, oknoPotwierdzenia] = usePotwierdzenie();

  if (!zamontowany) {
    return <Naglowek kod={kod} />;
  }

  if (!token || (bladDostepu && !stan)) {
    return (
      <>
        <Naglowek kod={kod} />
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
        <Naglowek kod={kod} />
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

  return (
    <>
      <Naglowek kod={kod} />
      {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
      <h1 style={{ marginBottom: 4 }}>{stan.quiz?.tytul ?? "Quiz"}</h1>
      <p className="pomocniczy" style={{ marginTop: 0 }}>
        {[stan.lokal?.nazwa, NAZWY[faza]].filter(Boolean).join(" · ")}
      </p>
      {/* muzyka i efekty grają tylko na TV; telewizor może raz poprosić o OK na swoim pilocie (zgoda przeglądarki) */}
      <p className="pilot-przelacznik">
        {stan.muzyka ? <IkonaGlosnik /> : <IkonaWyciszony />}
        <span>{stan.muzyka ? "Muzyka i dźwięki na TV grają" : "Muzyka i dźwięki na TV wyłączone"}</span>
        <button type="button" className="przycisk-zdjecie" disabled={wysylam} onClick={() => akcja("muzyka")}>
          {stan.muzyka ? "Wyłącz" : "Włącz"}
        </button>
      </p>
      {/* automat klika kolejne kroki sam (auto.tsx); na planszach czeka, aż gracze klikną „Gotowy” */}
      <p className={`pilot-przelacznik${stan.auto ? " wlaczony" : ""}`}>
        <IkonaAutomat />
        <span>{stan.auto ? "Gra prowadzi się sama" : "Prowadzenie automatyczne"}</span>
        <button type="button" className="przycisk-zdjecie" disabled={wysylam} onClick={() => void przelaczAuto()}>
          {stan.auto ? "Wyłącz" : "Włącz"}
        </button>
      </p>
      {stan.auto && (faza === "wstep" || faza === "etap" || (faza === "wynik" && stan.zadanie?.typ === "ciekawostka")) && (
        <p className="pomocniczy" style={{ margin: "0 0 4px" }}>
          Gotowi: <strong>{stan.gotowi}/{stan.w_grze}</strong>, dalej, gdy klikną wszyscy (albo po czasie).
        </p>
      )}

      {/* przyciski zawsze na górze: nie uciekają w dół, gdy rośnie lista odpowiedzi albo graczy */}
      {bladAkcji && (
        <p className="blad" role="alert">
          {bladAkcji}
        </p>
      )}
      {bladSieci && <p className="pomocniczy">{bladSieci}, ponawiam…</p>}

      {/* rodzaj następnego pytania zawsze: rodzaje się mieszają, prowadzący uprzedza graczy przed startem */}
      {/* przy etapach niepotrzebne: plansza etapu na TV sama pokazuje, jak odpowiadać */}
      {stan.nastepne_typ &&
        !stan.quiz?.liczba_etapow &&
        (faza === "poczekalnia" || faza === "wynik" || faza === "odpowiedzi" || faza === "ranking") && (
          <p className="pilot-zapowiedz" role="status">
            <strong>Następne pytanie: {NAZWY_TYPOW[stan.nastepne_typ].toLowerCase()}.</strong> Powiedz graczom przed
            startem: „{PODPOWIEDZI_TYPOW[stan.nastepne_typ]}”.
          </p>
        )}

      {/* zapowiedź: godzina i odliczanie jak na TV; start i tak klika prowadzący */}
      {faza === "poczekalnia" && stan.planowany_start && doZapowiedzi !== null && (
        <p className="pilot-start">
          <span>
            Start o <strong>{godzinaStartu(stan.planowany_start)}</strong> ·{" "}
            <span className="gra-kod">{opisOdliczania(doZapowiedzi)}</span>
          </span>
          {!stan.poczekalnia_otwarta && (
            <span className="pomocniczy">
              Na ekranie lokalu jest zapowiedź z odliczaniem. Gracze dołączą po otwarciu poczekalni.
            </span>
          )}
        </p>
      )}

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

        {/* wstęp: TV pokazuje całą drogę, prowadzący opowiada i przechodzi do planszy 1. etapu */}
        {faza === "wstep" && (
          <>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
              {nastepne.napis}
            </button>
            <p className="pilot-zapowiedz" role="status">
              <strong>Opowiedz graczom:</strong> przed nami {stan.plan_etapow.length} etapów, z każdym pytaniem
              nalewa się piwo, a oni ścigają się do niego; po drodze odpadają najsłabsi, a o piwo walczy finałowa
              trójka.
            </p>
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
              className="przycisk zloty"
              disabled={wysylam}
              onClick={() =>
                akcja("wynik", "Nie wszyscy odpowiedzieli. Zakończyć pytanie teraz i pokazać wynik?", {
                  tak: "Pokaż wynik",
                })
              }
            >
              Zakończ pytanie i pokaż wynik
            </button>
          ) : (
            <>
              <p className="pomocniczy" style={{ margin: 0, textAlign: "center" }}>
                Wynik pokaże się sam, gdy minie czas albo odpowiedzą wszyscy.
              </p>
              {doKonca > 0 && (
                <button
                  className="przycisk"
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
              <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("podium")}>
                Pokaż podium
              </button>
              <button className="przycisk" disabled={wysylam} onClick={() => akcja("odpowiedzi")}>
                Pokaż odpowiedzi graczy
              </button>
            </>
          ) : (
            <>
              <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("odpowiedzi")}>
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
            <p className="pomocniczy" style={{ margin: 0, textAlign: "center" }}>
              Finał skończony. TV i telefony zgasły i grają werble. Zbuduj napięcie i odsłoń wynik.
            </p>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("podium")}>
              Pokaż podium
            </button>
          </>
        )}

        {faza === "podium" && (
          <>
            <button className="przycisk" disabled={wysylam} onClick={() => akcja("tabela")}>
              Pokaż pełną tabelę
            </button>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("koniec")}>
              Zakończ grę
            </button>
          </>
        )}

        {faza === "tabela" && (
          <>
            <button className="przycisk" disabled={wysylam} onClick={() => akcja("podium")}>
              Pokaż podium
            </button>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("koniec")}>
              Zakończ grę
            </button>
          </>
        )}

        {faza === "koniec" && (
          <>
            <p className="pomocniczy">Gra zakończona. Piwu Cześć!</p>
            {stan.lokal && (
              <>
                <button
                  className="przycisk"
                  disabled={wysylam || ekranOddany}
                  onClick={async () => {
                    await akcja("plansze");
                    ustawEkranOddany(true);
                  }}
                >
                  {ekranOddany ? "Ekran lokalu pokazuje plansze" : "Pokaż plansze na ekranie lokalu"}
                </button>
                <p className="pomocniczy" style={{ margin: 0 }}>
                  Bez tego ekran lokalu wróci do plansz sam po 10 minutach. Podium tego quizu będzie wracać na planszach
                  jeszcze przez kilka godzin.
                </p>
              </>
            )}
          </>
        )}
      </section>

      {faza === "poczekalnia" && <ProgiPilota stan={stan} kod={kod} token={token} onZmiana={ustawStan} />}
      {faza === "poczekalnia" && <BotyPilota stan={stan} kod={kod} token={token} onZmiana={ustawStan} />}

      {faza === "poczekalnia" && (
        <section className="karta" style={{ marginTop: 18 }}>
          <p className="etykieta" style={{ marginTop: 0 }}>
            {druzyny ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}/{stan.max_graczy}
          </p>
          <GraczePilota kod={kod} token={token} gracze={gracze} pytanie={false} koniec={false} odswiez={pobierz} />
        </section>
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
          <p className="pomocniczy" style={{ margin: "10px 0 0" }}>
            TV pokazuje planszę z zasadami i animacją. Wytłumacz etap i wystartuj, kiedy wszyscy będą gotowi.
          </p>
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
          {stan.pijany_final && (
            <p className="pomocniczy" style={{ margin: "10px 0 0" }}>
              Po serii zamiast werbli przyjdzie pijany finał (nic nie liczy), a po nim werble. Zwycięzcę zobaczysz tutaj
              od razu.
            </p>
          )}
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
          <p className="pomocniczy" style={{ margin: "10px 0 0" }}>
            Widzisz to tylko Ty. Gracze odpowiadają na pytania, które nic nie liczą, a TV i telefony wariują coraz
            bardziej. Po czasie same przyjdą werble, a potem odsłaniasz podium.
          </p>
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
          <section className="karta" style={{ marginTop: 18 }}>
            <p
              className="etykieta"
              style={{
                marginTop: 0,
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <span>
                Pytanie {z.lp}/{liczba}
              </span>
              {faza === "przygotuj" && (
                <span className="gra-kod">start za {sekundaOdliczania(doStartu)} s</span>
              )}
              {faza === "pytanie" && (
                <span className="gra-kod">
                  {/* bez limitu czasu nic nie piszemy: napis „bez limitu” tylko mylił */}
                  {bezLimitu
                    ? ""
                    : doKonca > 0
                      ? `${Math.ceil(doKonca / 1000)} s`
                      : wszyscy
                        ? "wszyscy odpowiedzieli"
                        : "czas minął"}
                </span>
              )}
            </p>
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
          </section>
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
            koniec={faza === "koniec"}
            odswiez={pobierz}
          />
        </details>
      )}

      {/* awaryjne zakończenie na samym dole, z dala od zwykłych przycisków */}
      {faza !== "koniec" && faza !== "podium" && faza !== "tabela" && (
        <button
          className="przycisk niebezpieczny"
          style={{ marginTop: 32, width: "100%" }}
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
      {/* powrót do panelu (np. żeby uruchomić następną grę); bez logowania panel poprosi o hasło.
          Przycisk, nie napis do klikania; po grze złoty, bo to wtedy główna akcja */}
      <Link
        href="/admin/gry"
        className={`przycisk${faza === "koniec" ? " zloty" : ""}`}
        style={{ marginTop: 32 }}
      >
        Panel obsługi
      </Link>
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

function Naglowek({ kod }: { kod: string }) {
  return (
    <header className="gra-naglowek">
      <LogoQuiz wysokosc={40} dopisek="pilot" />
      <span className="gra-kod">{kod}</span>
    </header>
  );
}
