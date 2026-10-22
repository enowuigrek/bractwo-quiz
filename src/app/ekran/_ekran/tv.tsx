"use client";
/* eslint-disable @next/next/no-img-element -- loga i grafiki z bucketu Supabase albo z /public */

import { useCallback, useState, useSyncExternalStore } from "react";
import { fazaTeraz, komunikatBledu, pobierzStan, sekundy, useCzasSerwera, useNasluch } from "@/lib/gra/nasluch";
import type { StanSesji, WierszOdpowiedzi, WierszRankingu } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { OdpowiedziTv, TabelaTv } from "./odpowiedzi";
import { PodiumTv, RankingTv } from "./ranking";

// Scena ma stałe 1920×1080 i skaluje się do ekranu, żeby każdy telewizor wyglądał tak samo.
const SZER = 1920;
const WYS = 1080;

function subskrybujRozmiar(zmiana: () => void) {
  window.addEventListener("resize", zmiana);
  return () => window.removeEventListener("resize", zmiana);
}
const skalaOkna = () => Math.min(window.innerWidth / SZER, window.innerHeight / WYS);

function useSkala() {
  return useSyncExternalStore(subskrybujRozmiar, skalaOkna, () => 1);
}

/** Scena 1920×1080 przeskalowana do ekranu. Wspólna dla gry i plansz ekranu lokalu. */
export function Scena({ children }: { children: React.ReactNode }) {
  const skala = useSkala();
  return (
    <div className="tv">
      <div
        className="scena"
        style={{
          transform: `scale(${skala})`,
          left: `calc(50% - ${(SZER * skala) / 2}px)`,
          top: `calc(50% - ${(WYS * skala) / 2}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

/** `host`: adres aplikacji bez protokołu, np. quiz.bractwopiwne.pl (pod QR, dla wpisujących ręcznie). */
type Props = { kod: string; qr: string; host: string };

export function Tv({ kod, qr, host }: Props) {
  const [stan, ustawStan] = useState<StanSesji | null>(null);
  const [gracze, ustawGraczy] = useState<string[]>([]);
  const [ranking, ustawRanking] = useState<WierszRankingu[]>([]);
  const [odpowiedzi, ustawOdpowiedzi] = useState<WierszOdpowiedzi[]>([]);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);
  const [blad, ustawBlad] = useState<string | null>(null);

  const pobierz = useCallback(async () => {
    try {
      const { stan, przesuniecie } = await pobierzStan(kod);
      // lista nicków potrzebna tylko w poczekalni
      if (stan.faza === "poczekalnia") {
        const { data, error } = await supabase().rpc("gracze_sesji", { p_kod: kod });
        if (error) throw error;
        ustawGraczy(data as string[]);
      }
      if (stan.faza === "odpowiedzi") {
        const { data, error } = await supabase().rpc("odpowiedzi_zadania", { p_kod: kod });
        if (error) throw error;
        ustawOdpowiedzi(data as WierszOdpowiedzi[]);
      }
      if (stan.faza === "ranking" || stan.faza === "podium" || stan.faza === "tabela" || stan.faza === "koniec") {
        const { data, error } = await supabase().rpc("ranking", { p_kod: kod });
        if (error) throw error;
        ustawRanking(data as WierszRankingu[]);
      }
      ustawStan(stan);
      ustawPrzesuniecie(przesuniecie);
      ustawBlad(null);
    } catch (e) {
      ustawBlad(komunikatBledu(e));
    }
  }, [kod]);

  useNasluch(kod, pobierz, ["stan", "gracz", "odpowiedz"]);

  const liczy = stan?.faza === "przygotuj" || stan?.faza === "pytanie";
  const teraz = useCzasSerwera(przesuniecie, liczy, stan?.faza === "przygotuj" ? 100 : 250);

  return (
    <Scena>
        {!stan ? (
          <div className="tv-srodek">
            <p className="tv-duzy">{blad && !blad.startsWith("Brak połączenia") ? blad : "Łączę z grą…"}</p>
          </div>
        ) : (
          // nowa faza wchodzi łagodnie; pytanie od odliczania do wyniku to jeden ekran
          <div key={kluczEkranu(stan)} className="tv-ekran">
            {stan.faza === "poczekalnia" ? (
              <Poczekalnia stan={stan} gracze={gracze} qr={qr} host={host} />
            ) : stan.faza === "przygotuj" || stan.faza === "pytanie" || stan.faza === "wynik" ? (
              <Pytanie stan={stan} teraz={teraz} />
            ) : stan.faza === "odpowiedzi" ? (
              <OdpowiedziTv stan={stan} odpowiedzi={odpowiedzi} />
            ) : stan.faza === "ranking" ? (
              <RankingTv stan={stan} ranking={ranking} />
            ) : stan.faza === "tabela" ? (
              <TabelaTv stan={stan} ranking={ranking} />
            ) : (
              <Koniec stan={stan} ranking={ranking} przesuniecie={przesuniecie} />
            )}
          </div>
        )}
        {stan && blad && <p className="tv-polaczenie">{blad}, ponawiam…</p>}
    </Scena>
  );
}

export function Loga({ lokal }: { lokal: { nazwa: string; logo_url: string | null } | null }) {
  return (
    <div className="tv-loga">
      <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-bractwo" />
      {lokal?.logo_url && <img src={lokal.logo_url} alt={lokal.nazwa} className="tv-logo-lokalu" />}
    </div>
  );
}

/**
 * Poczekalnia: duży QR po lewej (pod nim drobniej adres i kod dla wpisujących ręcznie),
 * na pierwszym planie okazja, tytuł quizu i grafika, pod nimi gracze.
 */
function Poczekalnia({ stan, gracze, qr, host }: { stan: StanSesji; gracze: string[]; qr: string; host: string }) {
  const druzyny = stan.tryb === "druzyny";
  return (
    <div className="poczekalnia">
      <header className="tv-naglowek">
        <Loga lokal={stan.lokal} />
        {stan.lokal && <p className="tv-lokal">{stan.lokal.nazwa}</p>}
      </header>

      <div className="poczekalnia-tresc">
        <section className="tv-wejscie">
          <div className="tv-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="tv-adres">
            Bez skanowania: {host} · kod <strong className="tv-zloto">{stan.kod}</strong>
          </p>
        </section>

        <section className="tv-prawa">
          {stan.okazja && <p className="tv-okazja">{stan.okazja}</p>}
          <h1 className="tv-tytul-quizu">{stan.quiz?.tytul ?? "Quiz"}</h1>
          {stan.grafika_url && <img src={stan.grafika_url} alt="" className="tv-grafika" />}

          <div className="tv-gracze">
            <p className="tv-etykieta">
              {druzyny ? "Drużyny" : "Gracze"}{" "}
              <span className="tv-licznik">
                {stan.liczba_graczy}/{stan.max_graczy}
              </span>
            </p>
            {gracze.length === 0 ? (
              <p className="tv-zacheta">
                Zeskanuj kod telefonem i wpisz {druzyny ? "nazwę drużyny" : "swój nick"}.
                <br />
                Czekamy na {druzyny ? "pierwsze drużyny" : "pierwszych graczy"}…
              </p>
            ) : (
              <ul className={`tv-nicki${gracze.length > 30 ? " gesto" : ""}`}>
                {gracze.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

const LITERY = "ABCDEF";

/** Przygotuj (odliczanie 3 s), pytanie z czasem i wynik z rozkładem odpowiedzi. */
function Pytanie({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const z = stan.zadanie;
  const { faza, doStartu, doKonca, czasMinal, bezLimitu } = fazaTeraz(stan, teraz);
  // pytanie usunięte w trakcie gry
  if (!z)
    return (
      <div className="tv-srodek">
        <Loga lokal={stan.lokal} />
        <p className="tv-duzy">Patrz na prowadzącego</p>
      </div>
    );
  const liczba = stan.quiz?.liczba_zadan ?? "?";

  if (faza === "przygotuj") {
    return (
      <div className="tv-srodek">
        <Loga lokal={stan.lokal} />
        <p className="tv-okazja">
          Pytanie {z.lp}/{liczba}
        </p>
        <p className="tv-odliczanie">{Math.max(1, Math.ceil(doStartu / 1000))}</p>
        <p className="tv-duzy">Przygotuj się!</p>
      </div>
    );
  }

  const wynik = faza === "wynik";
  const poprawna = z.dane.poprawna;
  const rozklad = wynik ? z.rozklad : null;
  const najwiecej = Math.max(1, ...(rozklad ?? [0]));
  const zostalo = z.czas_s ? Math.max(0, Math.min(1, doKonca / (z.czas_s * 1000))) : 0;
  return (
    <div className="tv-pytanie">
      <header className="tv-pytanie-gora">
        <p className="tv-okazja">
          Pytanie {z.lp}/{liczba}
        </p>
        {wynik ? (
          <p className="tv-zegar tv-zegar-wynik">Wynik</p>
        ) : czasMinal ? (
          <p className="tv-zegar tv-zegar-koniec">{z.czas_s ? "Czas minął!" : "Wszyscy odpowiedzieli!"}</p>
        ) : bezLimitu ? (
          <p className="tv-zegar tv-zegar-koniec">Bez limitu</p>
        ) : (
          <p className={`tv-zegar${doKonca <= 5000 ? " malo" : ""}`}>{Math.ceil(doKonca / 1000)}</p>
        )}
      </header>
      {z.czas_s ? (
        <div className="tv-czas" aria-hidden>
          <div style={{ transform: `scaleX(${wynik ? 0 : zostalo})` }} />
        </div>
      ) : null}

      <h1 className="tv-tresc">{z.tresc}</h1>

      <div className={`tv-pytanie-srodek${z.grafika_url ? " z-grafika" : ""}`}>
        {z.grafika_url && <img src={z.grafika_url} alt="" className="tv-pytanie-grafika" />}
        <ol className={`tv-odp-lista${z.dane.odpowiedzi.length > 4 ? " gesto" : ""}`}>
          {z.dane.odpowiedzi.map((o, i) => {
            const klasa = !wynik ? "" : i === poprawna ? " poprawna" : " przygaszona";
            const ile = rozklad?.[i] ?? 0;
            return (
              <li key={i} className={`tv-odp${klasa}`}>
                {rozklad && <span className="tv-odp-slupek" style={{ transform: `scaleX(${ile / najwiecej})` }} />}
                <span className="tv-odp-litera">{LITERY[i]}</span>
                <span className="tv-odp-tekst">{o}</span>
                {rozklad && <span className="tv-odp-ile">{ile}</span>}
              </li>
            );
          })}
        </ol>
      </div>

      <footer className="tv-pytanie-dol">
        {wynik ? (
          <>
            <span>
              Dobrze odpowiedziało{" "}
              <strong className="tv-dobrze">
                {z.liczba_poprawnych ?? 0}/{stan.liczba_graczy}
              </strong>
            </span>
            {z.najszybszy && (
              <span>
                Najszybciej: <strong className="tv-zloto">{z.najszybszy.nick}</strong> ({sekundy(z.najszybszy.czas_ms)})
              </span>
            )}
          </>
        ) : (
          <>
            <span>
              Odpowiedziało{" "}
              <strong className="tv-zloto">
                {stan.liczba_odpowiedzi}/{stan.liczba_graczy}
              </strong>
            </span>
            {czasMinal ? (
              <span className="tv-podpowiedz">Za chwilę wynik…</span>
            ) : (
              <span className="tv-podpowiedz">
                Odpowiadaj na telefonie · kod gry <strong className="tv-zloto">{stan.kod}</strong>
              </span>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

function kluczEkranu(stan: StanSesji): string {
  const pytanie = stan.faza === "przygotuj" || stan.faza === "pytanie" || stan.faza === "wynik";
  return `${pytanie ? "pytanie" : stan.faza}:${stan.zadanie?.nr ?? 0}`;
}

/** Podium (z wjazdem po kolei) i koniec gry (podium od razu + podziękowanie). */
function Koniec({ stan, ranking, przesuniecie }: { stan: StanSesji; ranking: WierszRankingu[]; przesuniecie: number }) {
  const koniec = stan.faza === "koniec";
  const bylaGra = stan.zadanie !== null && ranking.length > 0;
  return (
    <div className="tv-koniec">
      <header className="tv-naglowek">
        <Loga lokal={stan.lokal} />
        <div className="tv-tytul">
          {stan.okazja && <p className="tv-okazja">{stan.okazja}</p>}
          <h1>{stan.quiz?.tytul ?? "Quiz"}</h1>
          {stan.lokal && <p className="tv-lokal">{stan.lokal.nazwa}</p>}
        </div>
      </header>
      {bylaGra ? (
        <PodiumTv
          ranking={ranking}
          odRazu={koniec}
          // początek podium w zegarze tego urządzenia: TV i telefony odsłaniają miejsca razem
          start={stan.faza_od ? Date.parse(stan.faza_od) - przesuniecie : null}
        />
      ) : (
        <div className="tv-srodek">
          <p className="tv-duzy">Koniec gry</p>
        </div>
      )}
      {koniec && <p className="tv-dziekujemy">Dziękujemy za grę! Piwu Cześć!</p>}
    </div>
  );
}
