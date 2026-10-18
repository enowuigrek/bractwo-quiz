"use client";
/* eslint-disable @next/next/no-img-element -- loga i grafiki z bucketu Supabase albo z /public */

import { useCallback, useState, useSyncExternalStore } from "react";
import { komunikatBledu, pobierzStan, useNasluch } from "@/lib/gra/nasluch";
import type { StanSesji } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

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

type Props = { kod: string; qr: string; adres: string };

export function Tv({ kod, qr, adres }: Props) {
  const skala = useSkala();
  const [stan, ustawStan] = useState<StanSesji | null>(null);
  const [gracze, ustawGraczy] = useState<string[]>([]);
  const [blad, ustawBlad] = useState<string | null>(null);

  const pobierz = useCallback(async () => {
    try {
      const [{ stan }, gracze] = await Promise.all([
        pobierzStan(kod),
        supabase()
          .rpc("gracze_sesji", { p_kod: kod })
          .then(({ data, error }) => {
            if (error) throw error;
            return data as string[];
          }),
      ]);
      ustawStan(stan);
      ustawGraczy(gracze);
      ustawBlad(null);
    } catch (e) {
      ustawBlad(komunikatBledu(e));
    }
  }, [kod]);

  useNasluch(kod, pobierz, ["stan", "gracz"]);

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
        {!stan ? (
          <div className="tv-srodek">
            <p className="tv-duzy">{blad && !blad.startsWith("Brak połączenia") ? blad : "Łączę z grą…"}</p>
          </div>
        ) : stan.faza === "poczekalnia" ? (
          <Poczekalnia stan={stan} gracze={gracze} qr={qr} adres={adres} />
        ) : (
          <Trwa stan={stan} />
        )}
        {stan && blad && <p className="tv-polaczenie">{blad}, ponawiam…</p>}
      </div>
    </div>
  );
}

function Loga({ stan }: { stan: StanSesji }) {
  return (
    <div className="tv-loga">
      <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-bractwo" />
      {stan.lokal?.logo_url && <img src={stan.lokal.logo_url} alt={stan.lokal.nazwa} className="tv-logo-lokalu" />}
    </div>
  );
}

function Poczekalnia({ stan, gracze, qr, adres }: { stan: StanSesji; gracze: string[]; qr: string; adres: string }) {
  const druzyny = stan.tryb === "druzyny";
  return (
    <div className="poczekalnia">
      <header className="tv-naglowek">
        <Loga stan={stan} />
        <div className="tv-tytul">
          {stan.okazja && <p className="tv-okazja">{stan.okazja}</p>}
          <h1>{stan.quiz?.tytul ?? "Quiz"}</h1>
          {stan.lokal && <p className="tv-lokal">{stan.lokal.nazwa}</p>}
        </div>
      </header>

      <div className="poczekalnia-tresc">
        <section className="tv-wejscie">
          <div className="tv-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="tv-adres">{adres}</p>
        </section>

        <section className="tv-prawa">
          <div className="tv-kod-rzad">
            <div>
              <p className="tv-etykieta">Kod gry</p>
              <p className="tv-kod">{stan.kod}</p>
            </div>
            {stan.grafika_url && <img src={stan.grafika_url} alt="" className="tv-grafika" />}
          </div>

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

// Pytanie, wynik, ranking i podium na TV dochodzą w dniach 4 i 5.
function Trwa({ stan }: { stan: StanSesji }) {
  const z = stan.zadanie;
  const liczba = stan.quiz?.liczba_zadan ?? "?";
  return (
    <div className="tv-srodek">
      <Loga stan={stan} />
      {stan.faza === "koniec" ? (
        <>
          <p className="tv-duzy">Koniec gry</p>
          <p className="tv-okazja">Piwu Cześć!</p>
        </>
      ) : stan.faza === "przygotuj" ? (
        <p className="tv-duzy">Przygotuj się… {z && `Pytanie ${z.lp}/${liczba}`}</p>
      ) : stan.faza === "pytanie" && z ? (
        <>
          <p className="tv-okazja">
            Pytanie {z.lp}/{liczba}
          </p>
          <p className="tv-duzy">{z.tresc}</p>
        </>
      ) : (
        <p className="tv-duzy">
          {{ wynik: "Wynik", ranking: "Ranking", podium: "Podium" }[stan.faza as "wynik" | "ranking" | "podium"]}
        </p>
      )}
    </div>
  );
}
