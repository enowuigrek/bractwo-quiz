"use client";

import { Fragment, useEffect } from "react";
import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import { zagraj } from "@/lib/gra/efekty";
import type { StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { odciecieEtapu, wzgledemKreski } from "@/lib/gra/odpadanie";
import { MAX_W_WYSCIGU, NA_TORACH_W_TLOKU, naTrasie, naTrasieFinalu } from "@/lib/gra/wyscig";
import { SzklankaPiwa } from "@/components/szklanka-piwa";
import { DrogiFinalu } from "./drogi";
import { KONIEC_ETAPU_PX, KoniecEtapu, Licznik } from "./ranking";
import { LogoNaglowka } from "./logo";

/** Po ilu sekundach od wejścia ekranu wszystko rusza (najpierw widać stan sprzed pytania). */
const START_S = 0.8;
const RUCH_S = 2.4;
/** Zamiana torów (awans i spadek w rankingu) rusza pod koniec jazdy awatarów i trwa tyle sekund. */
const ZAMIANA_OD_S = START_S + RUCH_S * 0.75;
const ZAMIANA_S = 0.9;
/** Wysokość napisu „ta trójka wchodzi do finału” (`.wyscig-strefa-finalu`). */
const STREFA_PX = 22;

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
  const wszyscy = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  // przy dużej grupie tory ma czołówka, a reszta stoi w pasku małych awatarów pod torami
  const wiersze = wszyscy.length > MAX_W_WYSCIGU ? wszyscy.slice(0, NA_TORACH_W_TLOKU) : wszyscy;
  const reszta = wszyscy.slice(wiersze.length);
  const maks = stan.quiz?.max_przed_finalem ?? 0;
  // dźwięki (src/lib/gra/efekty.ts): szum jazdy razem z awatarami, „fiuu” przy zamianie torów
  const zamiana = lp > 1 && wiersze.some((w) => w.poprzednie_miejsce !== w.miejsce);
  const dzwieki = stan.muzyka;
  useEffect(() => {
    if (!dzwieki) return;
    const minutniki = [window.setTimeout(() => zagraj("jazda"), START_S * 1000)];
    if (zamiana) minutniki.push(window.setTimeout(() => zagraj("zamiana"), ZAMIANA_OD_S * 1000));
    return () => minutniki.forEach((m) => window.clearTimeout(m));
  }, [dzwieki, zamiana]);
  // wysokość toru: wszystkie tory mieszczą się w ok. 700 px sceny, przy wielu ciaśniej
  const odstep = wiersze.length > 8 ? 6 : 12;
  // odcięcie po etapie: kreska pod ostatnim, kto gra dalej (walka o finał: pod 3. miejscem, inaczej próg
  // odpadania z `etap.przechodzi`); zabiera trochę wysokości torów. Gdy kreska wypada w pasku reszty, stoi tam.
  const odciecie = odciecieEtapu(stan);
  const strefaFinalu = odciecie !== null && wszyscy.length > odciecie && odciecie <= wiersze.length;
  const koniecEtapu = !!stan.etap && stan.ostatnie_w_etapie && !stan.etap.finalowy;
  const tor = Math.min(
    92,
    Math.floor(
      (700 -
        (strefaFinalu ? 34 : 0) -
        (koniecEtapu ? KONIEC_ETAPU_PX : 0) -
        (reszta.length ? RESZTA_PX : 0) -
        (wiersze.length - 1) * odstep) /
        Math.max(1, wiersze.length),
    ),
  );
  // awans i spadek: każdy tor startuje tam, gdzie stał w rankingu przed pytaniem, i pod koniec jazdy
  // przesuwa się na nowe miejsce (kto awansował, przejeżdża nad innymi)
  const przedPytaniem = [...wiersze].sort(
    (a, b) => a.poprzednie_miejsce - b.poprzednie_miejsce || a.nick.localeCompare(b.nick, "pl"),
  );
  const pozycja = (idx: number) =>
    idx * (tor + odstep) + (strefaFinalu && idx >= (odciecie ?? 0) ? STREFA_PX + odstep : 0);
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
      {z && <p className="tv-okazja">{`${etap ? `${etap.nazwa} · ` : ""}po pytaniu ${lp}`}</p>}
      <LogoNaglowka />
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
        <KoniecEtapu stan={stan} />

        <div className="wyscig-plansza" style={{ gridTemplateColumns: `minmax(0, 1fr) ${szklanka}px` }}>
          <div className="wyscig-tory" style={{ "--tor": `${tor}px`, gap: odstep } as React.CSSProperties}>
            {wiersze.map((w, i) => {
              const przed = naTrasie(w.punkty - w.zdobyte, maks) * 100;
              const teraz = naTrasie(w.punkty, maks) * 100;
              const prowadzi = w.miejsce === 1 && w.punkty > 0;
              // pod kreską (zagrożony) albo właśnie ją przeskoczył w którąś stronę
              const kreska = wzgledemKreski(w, odciecie, wszyscy.length);
              const przesuniecie = pozycja(przedPytaniem.indexOf(w)) - pozycja(i);
              // o ile miejsc w górę (na pierwszym pytaniu wszyscy startują razem, więc bez awansów)
              const awans = lp > 1 ? Math.max(0, w.poprzednie_miejsce - w.miejsce) : 0;
              const wiersz = (
                <motion.div
                  key={w.nick}
                  className={`wyscig-wiersz${prowadzi ? " lider" : ""}${kreska ? ` ${kreska}` : ""}${awans ? " awansuje" : ""}`}
                  initial={{ y: przesuniecie }}
                  animate={{ y: 0 }}
                  transition={{ delay: ZAMIANA_OD_S, duration: ZAMIANA_S, ease: [0.45, 0, 0.2, 1] }}
                >
                  {/* przed zamianą torów stary numer miejsca, z zamianą nowy */}
                  {lp > 1 && w.poprzednie_miejsce !== w.miejsce ? (
                    <span
                      className="wyscig-miejsce zmiana"
                      style={{ "--zamiana": `${ZAMIANA_OD_S}s` } as React.CSSProperties}
                    >
                      <span className="stare">{w.poprzednie_miejsce}.</span>
                      <span className="nowe">{w.miejsce}.</span>
                    </span>
                  ) : (
                    <span className="wyscig-miejsce">{w.miejsce}.</span>
                  )}
                  <span className="wyscig-nick">
                    {w.nick}
                    {(kreska === "awans" || kreska === "spadek") && (
                      <span
                        className={`wyscig-kreska ${kreska}`}
                        style={{ animationDelay: `${START_S + RUCH_S * 0.7}s` }}
                      >
                        {kreska === "awans" ? "▲ nad kreską" : "▼ pod kreską"}
                      </span>
                    )}
                    {/* awans w rankingu (gdy nie przeskoczył kreski, bo wtedy mówi to plakietka kreski) */}
                    {awans > 0 && kreska !== "awans" && (
                      <span className="wyscig-kreska awans" style={{ animationDelay: `${ZAMIANA_OD_S + 0.3}s` }}>
                        ▲ {awans}
                      </span>
                    )}
                  </span>
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
                </motion.div>
              );
              // pod ostatnim, kto przechodzi: kto jest wyżej, gra dalej
              return strefaFinalu && i === (odciecie ?? 0) - 1 ? (
                <Fragment key={w.nick}>
                  {wiersz}
                  <p className="wyscig-strefa-finalu">
                    {stan.etap?.final_po_etapie
                      ? "▲ ta trójka wchodzi do finału ▲"
                      : `▲ ${odciecie} najlepszych gra dalej ▲`}
                  </p>
                </Fragment>
              ) : (
                wiersz
              );
            })}
            {reszta.length > 0 && (
              <Reszta reszta={reszta} odciecie={odciecie !== null && !strefaFinalu ? odciecie : null} />
            )}
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

/** Wysokość paska reszty graczy z odstępem (odejmowana od miejsca na tory). */
const RESZTA_PX = 78;
/** Ile małych awatarów mieści pasek; dalsi tylko w liczbie. */
const W_PASKU = 26;

/**
 * Pasek pod torami przy dużej grupie: kto nie ma toru, stoi tu małym awatarem w kolejności miejsc. Gdy kreska
 * odpadania wypada wśród nich, między awatarami jest przerywana kreska.
 */
function Reszta({ reszta, odciecie }: { reszta: WierszRankingu[]; odciecie: number | null }) {
  const widoczni = reszta.slice(0, W_PASKU);
  const od = reszta[0].miejsce;
  return (
    <motion.div
      className="wyscig-reszta"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: START_S, duration: 0.5 }}
    >
      <span className="wyscig-reszta-opis">
        {od}.–{reszta[reszta.length - 1].miejsce}.
      </span>
      <div className="wyscig-reszta-awatary">
        {widoczni.map((w, i) => (
          <Fragment key={w.nick}>
            {odciecie !== null && i > 0 && reszta[i - 1].miejsce <= odciecie && w.miejsce > odciecie && (
              <span className="wyscig-reszta-kreska" aria-hidden />
            )}
            <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={44} />
          </Fragment>
        ))}
        {reszta.length > widoczni.length && (
          <span className="wyscig-reszta-wiecej">+{reszta.length - widoczni.length}</span>
        )}
      </div>
      <span className="wyscig-reszta-opis">jeszcze {reszta.length} w grze</span>
    </motion.div>
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
        przed: naTrasieFinalu(w.punkty - w.zdobyte, liderPrzed, lp - 1, n),
        teraz: naTrasieFinalu(w.punkty, lider, lp, n),
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

/** Szklanka na mecie: nalewa się z każdym pytaniem (components/szklanka-piwa.tsx), pod nią nagroda i ile zostało. */
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
  return (
    <div className="wyscig-szklanka" aria-hidden>
      <div className="wyscig-szklo">
        <SzklankaPiwa przed={przed} teraz={teraz} opoznienie={START_S} trwanie={RUCH_S + 0.6} babelki />
      </div>
      {nagroda && (
        <p className="wyscig-szklanka-nagroda">
          Gracie o: <strong>{nagroda}</strong>
        </p>
      )}
      <p className="wyscig-szklanka-opis">{doKonca ? "" : "Nalane!"}</p>
    </div>
  );
}
