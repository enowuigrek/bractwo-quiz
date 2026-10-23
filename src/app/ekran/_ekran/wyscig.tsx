"use client";
/* eslint-disable @next/next/no-img-element -- grafiki z /public/grafiki skalowane CSS-em na scenie 1920×1080 */

import { Fragment } from "react";
import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import type { StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { naTrasie } from "@/lib/gra/wyscig";
import { DNO, POD_PIANA, poziom } from "@/lib/gra/szklanka";
import { DrogiFinalu } from "./drogi";
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
  // etap przed finałem: kreska „strefa finału” pod 3. miejscem (zabiera trochę wysokości torów)
  const strefaFinalu = !!stan.etap?.final_po_etapie && wiersze.length > 3;
  const tor = Math.min(
    92,
    Math.floor((700 - (strefaFinalu ? 34 : 0) - (wiersze.length - 1) * odstep) / Math.max(1, wiersze.length)),
  );
  const ruch = (i: number) => ({ delay: START_S + i * 0.08, duration: RUCH_S, ease: [0.22, 1, 0.36, 1] as const });
  const etap = stan.etap;
  // zdjęcie nagrody za 1. miejsce stoi przy szklance na mecie: „gracie o to”
  // szklanka na mecie to główna nagroda: pod nią jej nazwa (zdjęcia nagród są na starcie i na podium)
  const nagroda = stan.nagrody?.find((x) => x.miejsce === 1)?.nagroda ?? null;
  // z etapu na etap szklanka jest bliżej: większa, a tory krótsze (bez etapów jak dotąd)
  const blisko = etap ? (etap.nr - 1) / Math.max(1, etap.liczba - 1) : 0.4;
  const szklanka = Math.round(240 + 200 * blisko);

  const naglowek = (
    <header className="tv-ranking-gora">
      <h1>{etap?.finalowy ? "Finał: wyścig po piwo" : "Wyścig po piwo"}</h1>
      {z && (
        <p className="tv-okazja">
          {etap ? `${etap.nazwa} · ` : ""}po pytaniu {lp}/{n}
        </p>
      )}
    </header>
  );

  // finał trójki: trzy drogi schodzą się pod szklanką na środku
  if (etap?.finalowy) {
    const nicki = stan.finalisci?.map((f) => f.nick) ?? wiersze.slice(0, 3).map((w) => w.nick);
    const finalisci = wiersze.filter((w) => nicki.includes(w.nick)).slice(0, 3);
    return (
      <MotionConfig reducedMotion="user">
        <div className="tv-wyscig">
          {naglowek}
          <FinalWyscigu wiersze={finalisci} lp={lp} n={n} />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-wyscig">
        {naglowek}

        <div className="wyscig-plansza" style={{ gridTemplateColumns: `minmax(0, 1fr) ${szklanka}px` }}>
          <div className="wyscig-tory" style={{ "--tor": `${tor}px`, gap: odstep } as React.CSSProperties}>
            {wiersze.map((w, i) => {
              const przed = naTrasie(w.punkty - w.zdobyte, liderPrzed, lp - 1, n) * 100;
              const teraz = naTrasie(w.punkty, lider, lp, n) * 100;
              const prowadzi = w.miejsce === 1 && w.punkty > 0;
              const wiersz = (
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
              // pod 3. torem: kto jest wyżej, wchodzi do finału
              return strefaFinalu && i === 2 ? (
                <Fragment key={w.nick}>
                  {wiersz}
                  <p className="wyscig-strefa-finalu">▲ ta trójka wchodzi do finału ▲</p>
                </Fragment>
              ) : (
                wiersz
              );
            })}
          </div>

          <Szklanka
            przed={n ? (lp - 1) / n : 0}
            teraz={n ? lp / n : 0}
            doKonca={Math.max(0, n - lp)}
            nagroda={nagroda}
          />
        </div>
      </div>
    </MotionConfig>
  );
}

/** Finał trójki w rankingu: równe drogi do szklanki, gracze w kolejności miejsc. */
function FinalWyscigu({ wiersze, lp, n }: { wiersze: WierszRankingu[]; lp: number; n: number }) {
  const lider = Math.max(0, ...wiersze.map((w) => w.punkty));
  const liderPrzed = Math.max(0, ...wiersze.map((w) => w.punkty - w.zdobyte));
  return (
    <DrogiFinalu
      opoznienie={START_S}
      trwanie={RUCH_S}
      szklanka={<Szklanka przed={n ? (lp - 1) / n : 0} teraz={n ? lp / n : 0} doKonca={Math.max(0, n - lp)} />}
      gracze={wiersze.map((w) => ({
        nick: w.nick,
        zdjecie: w.zdjecie,
        przed: naTrasie(w.punkty - w.zdobyte, liderPrzed, lp - 1, n),
        teraz: naTrasie(w.punkty, lider, lp, n),
        lider: w.miejsce === 1 && w.punkty > 0,
        podpis: (
          <>
            <span>
              {w.miejsce}. {w.nick}
            </span>
            <span className="drogi-finalu-punkty">
              <Licznik wartosc={w.punkty} />
              {w.zdobyte > 0 && <span className="wyscig-zdobyte">+{w.zdobyte}</span>}
            </span>
          </>
        ),
      }))}
    />
  );
}

/**
 * Szklanka na mecie: pusta to blady zarys grafiki, a pełna nalewa się od dołu (przycięcie od góry),
 * z pasem piany na powierzchni piwa. Poziomy w grafice: src/lib/gra/szklanka.ts.
 */
/** Szklanka zwęża się ku dołowi: odstęp piany od boków obrazka na danym poziomie. */
const bok = (y: number) => 6 + Math.max(0, y - 35) * 0.18;

/**
 * Bąbelki w piwie: stałe położenia i tempo (bez losowania, żeby nie skakały przy odświeżeniu),
 * `x` w procentach szerokości szklanki, `r` średnica w px, `t` czas wznoszenia, `d` opóźnienie startu.
 */
const BABELKI = Array.from({ length: 26 }, (_, i) => ({
  x: 24 + ((i * 37) % 52),
  r: 3 + ((i * 5) % 4),
  t: 2.6 + ((i * 7) % 10) * 0.28,
  d: -((i * 1.3) % 4.2),
  w: ((i % 3) - 1) * 6,
}));

export function Szklanka({
  przed,
  teraz,
  doKonca,
  nagroda,
}: {
  przed: number;
  teraz: number;
  doKonca: number;
  /** Nazwa nagrody za 1. miejsce: o nią toczy się wyścig. */
  nagroda?: string | null;
}) {
  const nalewanie = { delay: START_S, duration: RUCH_S + 0.6, ease: [0.22, 1, 0.36, 1] as const };
  // pas piany tylko w trakcie: pusta szklanka nie ma piany, a pełna ma swoją z grafiki
  const piana = (cz: number) => ({
    top: `${poziom(cz)}%`,
    left: `${bok(poziom(cz))}%`,
    right: `${bok(poziom(cz))}%`,
    // piana rośnie razem z piwem: cienka warstwa na dnie, gruba czapa pod koniec
    height: `${1.5 + 5 * cz}%`,
    opacity: cz > 0 && cz < 1 ? 1 : 0,
  });
  const babelkiOd = (cz: number) => (cz >= 1 ? POD_PIANA : Math.min(DNO, poziom(cz) + 2));
  return (
    <div className="wyscig-szklanka" aria-hidden>
      <div className="wyscig-szklo">
        {/* pusta szklanka bez piany z grafiki: piana tworzy się dopiero na nalewanym piwie */}
        <img
          src="/grafiki/szklanka.webp"
          alt=""
          className="wyscig-szklanka-pusta"
          style={{ clipPath: `inset(${POD_PIANA - 3}% 0 0 0)` }}
        />
        <motion.img
          src="/grafiki/szklanka.webp"
          alt=""
          className="wyscig-szklanka-pelna"
          initial={{ clipPath: `inset(${poziom(przed)}% 0 0 0)` }}
          animate={{ clipPath: `inset(${poziom(teraz)}% 0 0 0)` }}
          transition={nalewanie}
        />
        {/* bąbelki unoszą się od dna, widać je tylko w nalanym piwie (pod pianą) */}
        <motion.div
          className="wyscig-babelki"
          initial={{ clipPath: `inset(${babelkiOd(przed)}% 0 ${100 - DNO}% 0)` }}
          animate={{ clipPath: `inset(${babelkiOd(teraz)}% 0 ${100 - DNO}% 0)` }}
          transition={nalewanie}
        >
          {BABELKI.map((b, i) => (
            <span
              key={i}
              style={
                {
                  left: `${b.x}%`,
                  "--r": `${b.r}px`,
                  "--t": `${b.t}s`,
                  "--d": `${b.d}s`,
                  "--w": `${b.w}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </motion.div>
        <motion.div className="wyscig-piana" initial={piana(przed)} animate={piana(teraz)} transition={nalewanie} />
      </div>
      {nagroda && (
        <p className="wyscig-szklanka-nagroda">
          Gracie o: <strong>{nagroda}</strong>
        </p>
      )}
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
