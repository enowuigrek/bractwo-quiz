"use client";
/* eslint-disable @next/next/no-img-element -- logo z /public skalowane CSS-em na scenie 1920×1080 */

import { useEffect, useState } from "react";
import { Awatar } from "@/components/awatar";
import type { WierszRankingu } from "@/lib/gra/typy";
import { godzinaStartu, opisOdliczania, useDoStartu, type Zapowiedz } from "@/lib/gra/zapowiedz";
import { Loga } from "./tv";

/** Co ile ms zmienia się plansza na ekranie lokalu bez gry. */
const ZMIANA_MS = 10_000;

/** Ostatni quiz w lokalu (z `ekran_lokalu`, do 6 godzin po końcu): pierwsza trójka. */
export type OstatniQuiz = { tytul: string; okazja: string | null; podium: WierszRankingu[] };

type Props = {
  lokal: { nazwa: string; logo_url: string | null };
  ostatnia: OstatniQuiz | null;
  /** Zapowiedziany quiz: godzina na pierwszej planszy, odliczanie na każdej. */
  zapowiedz?: Zapowiedz | null;
  /** Różnica zegara TV względem serwera (ms). */
  przesuniecie?: number;
};

/** Kolejność na planszy: 2., 1., 3. */
const STOPNIE = [1, 0, 2];

/**
 * Ekran lokalu, gdy nie ma gry: plansze zmieniane co 10 s. Po quizie dochodzi plansza z jego podium.
 * Zapowiedziany quiz ma godzinę na pierwszej planszy i odliczanie na każdej, a przy kranoprzejęciu
 * u góry jest lokal × browar (Bractwo ma wtedy swoją osobną planszę).
 */
export function Plansze({ lokal, ostatnia, zapowiedz = null, przesuniecie = 0 }: Props) {
  const doStartu = useDoStartu(zapowiedz?.planowany_start ?? null, przesuniecie);
  const liczbaPlansz = ostatnia ? 4 : 3;
  const [licznik, ustawLicznik] = useState(0);
  useEffect(() => {
    const zegar = setInterval(() => ustawLicznik((n) => n + 1), ZMIANA_MS);
    return () => clearInterval(zegar);
  }, []);
  const nr = licznik % liczbaPlansz;

  return (
    <div className="plansze">
      <div key={nr} className="plansza">
        {nr === 0 && zapowiedz && (
          <div className="plansza-srodek plansza-zapowiedz">
            <div className="plansza-loga">
              {!zapowiedz.browar && (
                <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-bractwo-duze" />
              )}
              <Loga lokal={lokal} browar={zapowiedz.browar} />
            </div>
            <p className="tv-okazja">
              {[zapowiedz.browar && `Kranoprzejęcie: ${zapowiedz.browar.nazwa}`, zapowiedz.okazja]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <h1 className="plansza-tytul">{zapowiedz.tytul ?? "Quiz Bractwa Piwnego"}</h1>
            {zapowiedz.planowany_start && doStartu !== null && (
              <p className="plansza-start">
                <span>
                  Start o <strong>{godzinaStartu(zapowiedz.planowany_start)}</strong>
                </span>
                <span className="plansza-odliczanie">{opisOdliczania(doStartu)}</span>
              </p>
            )}
          </div>
        )}
        {nr === 0 && !zapowiedz && (
          <div className="plansza-srodek">
            <div className="plansza-loga">
              <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-bractwo-duze" />
              <Loga lokal={lokal} />
            </div>
            <h1 className="plansza-tytul">Quiz Bractwa Piwnego</h1>
            <p className="tv-okazja">Wkrótce start · {lokal.nazwa}</p>
          </div>
        )}
        {nr === 1 && (
          <div className="plansza-jak">
            <h1 className="plansza-tytul">Jak grać?</h1>
            <ol className="plansza-kroki">
              <li>
                <span>1</span> Zeskanuj telefonem kod QR, który pojawi się na tym ekranie.
              </li>
              <li>
                <span>2</span> Wpisz swoje imię albo nick.
              </li>
              <li>
                <span>3</span> Odpowiadaj na telefonie. Im szybciej dobrze odpowiesz, tym więcej punktów!
              </li>
            </ol>
          </div>
        )}
        {nr === 3 && ostatnia && (
          <div className="plansza-podium">
            <p className="tv-okazja">{[ostatnia.okazja, "Zwycięzcy ostatniego quizu"].filter(Boolean).join(" · ")}</p>
            <h1 className="plansza-tytul">{ostatnia.tytul}</h1>
            <ol className="plansza-podium-lista">
              {STOPNIE.filter((i) => ostatnia.podium[i]).map((i) => {
                const w = ostatnia.podium[i];
                return (
                  <li key={w.nick} className={i === 0 ? "pierwszy" : undefined}>
                    <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={i === 0 ? 220 : 150} />
                    <span>{w.nick}</span>
                    <span className="plansza-podium-miejsce">
                      {w.miejsce}. miejsce · {w.punkty.toLocaleString("pl-PL")} pkt
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        )}
        {nr === 2 && (
          <div className="plansza-srodek">
            <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo plansza-logo-duze" />
          </div>
        )}
      </div>
      {/* odliczanie do zapowiedzianego quizu na każdej planszy poza pierwszą (tam jest duże) */}
      {nr !== 0 && zapowiedz?.planowany_start && doStartu !== null && (
        <p className="plansze-zapowiedz">
          Quiz o <strong>{godzinaStartu(zapowiedz.planowany_start)}</strong> · {opisOdliczania(doStartu)}
        </p>
      )}
      {/* plansze 1 i 3 nie mają dużego logo Bractwa, więc dostają małe w rogu */}
      {(nr === 1 || nr === 3) && <img src="/loga/bractwo.svg" alt="" className="logo-bractwo tv-bractwo-rog" />}
      <ol className="plansze-kropki" aria-hidden>
        {Array.from({ length: liczbaPlansz }, (_, i) => (
          <li key={i} className={i === nr ? "teraz" : undefined} />
        ))}
      </ol>
    </div>
  );
}
