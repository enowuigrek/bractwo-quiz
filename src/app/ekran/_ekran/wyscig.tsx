"use client";
/* eslint-disable @next/next/no-img-element -- grafiki z /public/grafiki skalowane CSS-em na scenie 1920×1080 */

import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import type { StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { naTrasie } from "@/lib/gra/wyscig";
import { Licznik } from "./ranking";

/** Po ilu sekundach od wejścia ekranu wszystko rusza (najpierw widać stan sprzed pytania). */
const START_S = 0.8;
const RUCH_S = 2.4;

/**
 * „Wyścig po piwo”: na końcu torów stoi szklanka, która z każdym pytaniem napełnia się piwem
 * (pytanie lp z n to lp/n szklanki), a gracze jadą po barowej ladzie w jej stronę. Najpierw widać stan
 * sprzed pytania, po chwili piwo dolewa się, a awatary przesuwają (zasady: src/lib/gra/wyscig.ts).
 * Grafiki szklanki i lady: public/grafiki, generowane skryptem scripts/grafiki.mjs.
 */
export function WyscigTv({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const z = stan.zadanie;
  const n = stan.quiz?.liczba_zadan ?? 0;
  const lp = z?.lp ?? 0;
  const wiersze = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  const lider = Math.max(0, ...wiersze.map((w) => w.punkty));
  const liderPrzed = Math.max(0, ...wiersze.map((w) => w.punkty - w.zdobyte));
  // wysokość toru: wszystkie tory mieszczą się w ok. 700 px sceny, przy wielu ciaśniej
  const odstep = wiersze.length > 8 ? 6 : 12;
  const tor = Math.min(92, Math.floor((700 - (wiersze.length - 1) * odstep) / Math.max(1, wiersze.length)));
  const ruch = (i: number) => ({ delay: START_S + i * 0.08, duration: RUCH_S, ease: [0.22, 1, 0.36, 1] as const });

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-wyscig">
        <header className="tv-ranking-gora">
          <h1>Wyścig po piwo</h1>
          {z && (
            <p className="tv-okazja">
              po pytaniu {lp}/{n}
            </p>
          )}
        </header>

        <div className="wyscig-plansza">
          <div className="wyscig-tory" style={{ "--tor": `${tor}px`, gap: odstep } as React.CSSProperties}>
            {wiersze.map((w, i) => {
              const przed = naTrasie(w.punkty - w.zdobyte, liderPrzed, lp - 1, n) * 100;
              const teraz = naTrasie(w.punkty, lider, lp, n) * 100;
              const prowadzi = w.miejsce === 1 && w.punkty > 0;
              return (
                <div key={w.nick} className={`wyscig-wiersz${prowadzi ? " lider" : ""}`}>
                  <span className="wyscig-miejsce">{w.miejsce}.</span>
                  <span className="wyscig-nick">{w.nick}</span>
                  <div className="wyscig-lada">
                    {/* trasa krótsza o pół awatara z każdej strony: na mecie awatar dotyka linii, nie wychodzi za nią */}
                    <div className="wyscig-trasa">
                      {/* ślad za graczem: złota smuga od startu */}
                      <motion.div
                        className="wyscig-slad"
                        initial={{ width: `${przed}%` }}
                        animate={{ width: `${teraz}%` }}
                        transition={ruch(i)}
                      />
                      <motion.div
                        className="wyscig-jezdziec"
                        initial={{ left: `${przed}%` }}
                        animate={{ left: `${teraz}%` }}
                        transition={ruch(i)}
                      >
                        <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={Math.round(tor * 0.9)} />
                      </motion.div>
                    </div>
                  </div>
                  <span className="wyscig-punkty">
                    <Licznik wartosc={w.punkty} />
                    {w.zdobyte > 0 && <span className="wyscig-zdobyte">+{w.zdobyte}</span>}
                  </span>
                </div>
              );
            })}
          </div>

          <Szklanka przed={n ? (lp - 1) / n : 0} teraz={n ? lp / n : 0} doKonca={Math.max(0, n - lp)} />
        </div>
      </div>
    </MotionConfig>
  );
}

/**
 * Szklanka na mecie: pusta to blady zarys grafiki, a pełna nalewa się od dołu (przycięcie od góry),
 * z pasem piany na powierzchni piwa. `GORA` i `DNO`: gdzie w grafice zaczyna się piana i gdzie kończy
 * się piwo (procent wysokości obrazka).
 */
const GORA = 1;
const DNO = 92;

/** Poziom piwa w procentach wysokości obrazka (od góry). */
const poziom = (cz: number) => DNO - (DNO - GORA) * cz;
/** Szklanka zwęża się ku dołowi: odstęp piany od boków obrazka na danym poziomie. */
const bok = (y: number) => 6 + Math.max(0, y - 35) * 0.18;

function Szklanka({ przed, teraz, doKonca }: { przed: number; teraz: number; doKonca: number }) {
  const nalewanie = { delay: START_S, duration: RUCH_S + 0.6, ease: [0.22, 1, 0.36, 1] as const };
  // pas piany tylko w trakcie: pusta szklanka nie ma piany, a pełna ma swoją z grafiki
  const piana = (cz: number) => ({
    top: `${poziom(cz)}%`,
    left: `${bok(poziom(cz))}%`,
    right: `${bok(poziom(cz))}%`,
    opacity: cz > 0 && cz < 1 ? 1 : 0,
  });
  return (
    <div className="wyscig-szklanka" aria-hidden>
      <div className="wyscig-szklo">
        <img src="/grafiki/szklanka.webp" alt="" className="wyscig-szklanka-pusta" />
        <motion.img
          src="/grafiki/szklanka.webp"
          alt=""
          className="wyscig-szklanka-pelna"
          initial={{ clipPath: `inset(${poziom(przed)}% 0 0 0)` }}
          animate={{ clipPath: `inset(${poziom(teraz)}% 0 0 0)` }}
          transition={nalewanie}
        />
        <motion.div className="wyscig-piana" initial={piana(przed)} animate={piana(teraz)} transition={nalewanie} />
      </div>
      <p className="wyscig-szklanka-opis">{doKonca ? `jeszcze ${doKonca} ${pytan(doKonca)}` : "Nalane!"}</p>
    </div>
  );
}

function pytan(n: number): string {
  if (n === 1) return "pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań";
}
