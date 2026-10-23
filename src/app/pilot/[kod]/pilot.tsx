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
  useCzasSerwera,
  useKoniecPytania,
  useNasluch,
} from "@/lib/gra/nasluch";
import type { AkcjaPilota, FazaWidoczna, GraczPilota, PilotStan, ZadanieWidoczne } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { LITERY, NAZWY_TYPOW, PODPOWIEDZI_TYPOW } from "@/lib/zadania";
import { GraczePilota } from "./gracze";

const kluczPilota = (kod: string) => `bractwo-quiz:pilot:${kod}`;

const NAZWY: Record<FazaWidoczna, string> = {
  poczekalnia: "Poczekalnia",
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

  const liczy = stan?.faza === "przygotuj" || stan?.faza === "pytanie";
  const teraz = useCzasSerwera(przesuniecie, liczy);
  useKoniecPytania(kod, stan, teraz);
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

  // `przygotuj` przechodzi w `pytanie` sam, gdy minie `faza_od`; nie czekamy na odpytanie bazy
  const { faza, doStartu, doKonca, bezLimitu } = fazaTeraz(stan, teraz);
  const wszyscy = stan.liczba_graczy > 0 && stan.liczba_odpowiedzi >= stan.liczba_graczy;
  const z = stan.zadanie;
  const liczba = stan.quiz?.liczba_zadan ?? 0;
  const druzyny = stan.tryb === "druzyny";
  const nastepne = stan.ostatnie_zadanie
    ? { akcja: "podium" as const, napis: "Pokaż podium" }
    : {
        akcja: "nastepne" as const,
        napis: z ? `Następne pytanie (${z.lp + 1}/${liczba})` : "Start quizu",
      };

  return (
    <>
      <Naglowek kod={kod} />
      {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
      <h1 style={{ marginBottom: 4 }}>{stan.quiz?.tytul ?? "Quiz"}</h1>
      <p className="pomocniczy" style={{ marginTop: 0 }}>
        {[stan.lokal?.nazwa, NAZWY[faza]].filter(Boolean).join(" · ")}
      </p>

      {faza === "poczekalnia" && (
        <section className="karta" style={{ marginTop: 18 }}>
          <p className="etykieta" style={{ marginTop: 0 }}>
            {druzyny ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}/{stan.max_graczy}
          </p>
          <GraczePilota kod={kod} token={token} gracze={gracze} pytanie={false} koniec={false} odswiez={pobierz} />
        </section>
      )}

      {z && faza !== "poczekalnia" && faza !== "koniec" && faza !== "podium" && faza !== "tabela" && (
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
              <span className="gra-kod">start za {Math.max(0, Math.ceil(doStartu / 1000))} s</span>
            )}
            {faza === "pytanie" && (
              <span className="gra-kod">
                {bezLimitu
                  ? "bez limitu"
                  : doKonca > 0
                    ? `${Math.ceil(doKonca / 1000)} s`
                    : wszyscy
                      ? "wszyscy odpowiedzieli"
                      : "czas minął"}
              </span>
            )}
          </p>
          <p style={{ fontWeight: "var(--w-black)", margin: "0 0 12px" }}>{z.tresc}</p>
          <RozwiazaniePilota z={z} poprawna={stan.poprawna} />
          <p style={{ margin: "14px 0 0" }}>
            Odpowiedziało{" "}
            <strong className="gra-kod">
              {stan.liczba_odpowiedzi}/{stan.liczba_graczy}
            </strong>
            {z.liczba_poprawnych !== undefined && (
              <>
                {" · "}
                {z.typ === "wybor" ? "dobrze" : "w pełni dobrze"} <strong className="ok">{z.liczba_poprawnych}</strong>
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

      {bladAkcji && (
        <p className="blad" role="alert">
          {bladAkcji}
        </p>
      )}
      {bladSieci && <p className="pomocniczy">{bladSieci}, ponawiam…</p>}

      {/* rodzaj następnego pytania zawsze: rodzaje się mieszają, prowadzący uprzedza graczy przed startem */}
      {stan.nastepne_typ &&
        (faza === "poczekalnia" || faza === "wynik" || faza === "odpowiedzi" || faza === "ranking") && (
          <p className="pilot-zapowiedz" role="status">
            <strong>Następne pytanie: {NAZWY_TYPOW[stan.nastepne_typ].toLowerCase()}.</strong> Powiedz graczom przed
            startem: „{PODPOWIEDZI_TYPOW[stan.nastepne_typ]}”.
          </p>
        )}

      <section style={{ marginTop: "var(--section-gap)", display: "grid", gap: 12 }}>
        {faza === "poczekalnia" && (
          <button
            className="przycisk zloty"
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
        {faza === "wynik" && (
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
        )}

        {faza === "odpowiedzi" && (
          <>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("ranking")}>
              Pokaż ranking
            </button>
            <button className="przycisk" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
              {nastepne.napis}
            </button>
          </>
        )}

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

        {faza !== "koniec" && faza !== "podium" && faza !== "tabela" && (
          <button
            className="przycisk niebezpieczny"
            style={{ marginTop: 24 }}
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
      </section>
      <p style={{ marginTop: 32, textAlign: "center" }}>
        {/* powrót do panelu (np. żeby uruchomić następną grę); bez logowania panel poprosi o hasło */}
        <Link href="/admin/gry" className="pomocniczy">
          ← Panel obsługi
        </Link>
      </p>
      {oknoPotwierdzenia}
    </>
  );
}

/** Pytanie na pilocie z rozwiązaniem (prowadzący widzi je od początku). */
function RozwiazaniePilota({ z, poprawna }: { z: ZadanieWidoczne; poprawna: PilotStan["poprawna"] }) {
  const p = Array.isArray(poprawna) ? poprawna : null;
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

function Naglowek({ kod }: { kod: string }) {
  return (
    <header className="gra-naglowek">
      <LogoQuiz wysokosc={40} dopisek="pilot" />
      <span className="gra-kod">{kod}</span>
    </header>
  );
}
