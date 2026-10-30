"use client";

import { Fragment, useEffect } from "react";
import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import { zagraj } from "@/lib/gra/efekty";
import type { StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { odciecieEtapu, wzgledemKreski } from "@/lib/gra/odpadanie";
import { naStronieRankingu, naTrasie, naTrasieFinalu, nalanieSzklanki } from "@/lib/gra/wyscig";
import { SzklankaPiwa } from "@/components/szklanka-piwa";
import { DrogiFinalu } from "./drogi";
import { KONIEC_ETAPU_PX, KoniecEtapu, Licznik } from "./ranking";
import { useStronaRankingu } from "@/lib/gra/strona-rankingu";

/** Po ilu sekundach od wejścia ekranu wszystko rusza (najpierw widać stan sprzed pytania). */
const START_S = 0.8;
const RUCH_S = 2.4;
/** Zamiana torów (awans i spadek w rankingu) rusza pod koniec jazdy awatarów i trwa tyle sekund. */
const ZAMIANA_OD_S = START_S + RUCH_S * 0.75;
const ZAMIANA_S = 0.9;
/** Wysokość kreski odpadania z napisem „ta trójka wchodzi do finału” (`.wyscig-strefa-finalu`). */
const STREFA_PX = 56;

/**
 * „Wyścig po piwo”: na końcu torów stoi szklanka, która z każdym pytaniem napełnia się piwem
 * (do 95% po ostatnim pytaniu przed finałem, `nalanieSzklanki`), a gracze jadą po barowej ladzie w jej stronę. Najpierw widać stan
 * sprzed pytania, po chwili piwo dolewa się, a awatary przesuwają (zasady: src/lib/gra/wyscig.ts).
 * Grafiki szklanki i lady: public/grafiki, generowane skryptem scripts/grafiki.mjs.
 */
export function WyscigTv({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const z = stan.zadanie;
  const n = stan.quiz?.liczba_zadan ?? 0;
  const lp = z?.lp ?? 0;
  const wszyscy = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  // po 10 torów na stronę: przy większej grupie najpierw 1.–10., potem dalsi (26.10, zamiast paska reszty)
  const strona = useStronaRankingu(wszyscy.length);
  // po równo na strony (12 graczy: 6 + 6)
  const naStronieGraczy = naStronieRankingu(wszyscy.length);
  const odMiejsca = strona * naStronieGraczy;
  const wiersze = wszyscy.slice(odMiejsca, odMiejsca + naStronieGraczy);
  // każda strona pokazuje swoją zamianę torów (30.10, Łukasz: druga strona wjeżdżała już po zmianach): startuje od
  // kolejności sprzed pytania na tej stronie, kto przechodzi na inną stronę, wyjeżdża w jej stronę (w górę albo w dół),
  // a kto przychodzi z innej, wjeżdża z jej strony
  const wszyscyPrzed = [...ranking].sort(
    (a, b) => a.poprzednie_miejsce - b.poprzednie_miejsce || a.nick.localeCompare(b.nick, "pl"),
  );
  const przedPytaniem = wszyscyPrzed.slice(odMiejsca, odMiejsca + naStronieGraczy);
  const indeksPrzed = new Map(wszyscyPrzed.map((w, i) => [w.nick, i]));
  const indeksPo = new Map(wszyscy.map((w, i) => [w.nick, i]));
  const naTejStronie = new Set(wiersze.map((w) => w.nick));
  const wychodza = przedPytaniem.filter((w) => !naTejStronie.has(w.nick));
  const maks = stan.quiz?.max_przed_finalem ?? 0;
  // dźwięk (src/lib/gra/efekty.ts): tylko „fiuu” przy zamianie torów; szumu jazdy razem z awatarami nie ma od 25.10
  // (Łukasz: nie brzmiał jak przesuwanie). W finale każdy ma swoją drogę: tory się nie zamieniają, więc i bez dźwięku
  const zamiana =
    lp > 1 && !stan.etap?.finalowy && (wychodza.length > 0 || wiersze.some((w) => w.poprzednie_miejsce !== w.miejsce));
  const dzwieki = stan.muzyka;
  useEffect(() => {
    if (!dzwieki || !zamiana) return;
    const minutnik = window.setTimeout(() => zagraj("zamiana"), ZAMIANA_OD_S * 1000);
    return () => window.clearTimeout(minutnik);
  }, [dzwieki, zamiana, strona]);
  // wysokość toru: wszystkie tory mieszczą się w ok. 700 px sceny, przy wielu ciaśniej
  // tory tej samej wysokości na każdej stronie (na drugiej, krótszej stronie nie rosną)
  const torow = Math.min(naStronieGraczy, wszyscy.length);
  const odstep = torow > 8 ? 6 : 12;
  // odcięcie po etapie: kreska pod ostatnim, kto gra dalej (walka o finał: pod 3. miejscem, inaczej próg
  // odpadania z `etap.przechodzi`); zabiera trochę wysokości torów. Gdy kreska wypada w pasku reszty, stoi tam.
  const odciecie = odciecieEtapu(stan);
  // kreska na tej stronie: pod jej `naStronie`-tym torem
  const naStronie = odciecie === null ? null : odciecie - odMiejsca;
  const strefaFinalu =
    odciecie !== null && naStronie !== null && wszyscy.length > odciecie && naStronie >= 1 && naStronie <= wiersze.length;
  const koniecEtapu = !!stan.etap && stan.ostatnie_w_etapie && !stan.etap.finalowy;
  const tor = Math.min(
    92,
    Math.floor(
      (700 -
        (strefaFinalu ? STREFA_PX + odstep : 0) -
        (koniecEtapu ? KONIEC_ETAPU_PX : 0) -
        (torow - 1) * odstep) /
        Math.max(1, torow),
    ),
  );
  // awans i spadek: każdy tor startuje tam, gdzie stał w rankingu przed pytaniem, i pod koniec jazdy
  // przesuwa się na nowe miejsce (kto awansował, przejeżdża nad innymi)
  const pozycja = (idx: number) =>
    Math.max(0, idx) * (tor + odstep) + (strefaFinalu && idx >= (naStronie ?? 0) ? STREFA_PX + odstep : 0);
  // poza stroną: nad pierwszym torem albo pod ostatnim
  const nadStrona = -(tor + odstep) * 1.5;
  const podStrona = pozycja(torow) + (tor + odstep) * 0.5;
  const ruch = (i: number) => ({ delay: START_S + i * 0.08, duration: RUCH_S, ease: [0.22, 1, 0.36, 1] as const });
  const etap = stan.etap;
  // zdjęcie nagrody za 1. miejsce stoi przy szklance na mecie: „gracie o to”
  // szklanka na mecie to główna nagroda: pod nią jej nazwa (zdjęcia nagród są na starcie i na podium)
  const nagroda = stan.nagrody?.find((x) => x.miejsce === 1)?.nagroda ?? null;
  // z etapu na etap szklanka jest bliżej: większa, a tory krótsze (bez etapów jak dotąd)
  const blisko = etap ? (etap.nr - 1) / Math.max(1, etap.liczba - 1) : 0.4;
  const szklanka = Math.round(240 + 200 * blisko);

  /** Jeden tor: jazda awatara po ladzie i zamiana torów (`ruchToru`: skąd i dokąd tor jedzie przy zamianie). */
  const torGracza = (
    w: WierszRankingu,
    i: number,
    ruchToru: {
      initial: { y: number; opacity: number };
      animate: { y: number; opacity: number };
      styl?: React.CSSProperties;
    },
  ) => {
    const przed = naTrasie(w.punkty - w.zdobyte, maks) * 100;
    const teraz = naTrasie(w.punkty, maks) * 100;
    const prowadzi = w.miejsce === 1 && w.punkty > 0;
    // pod kreską (zagrożony) albo właśnie ją przeskoczył w którąś stronę
    const kreska = wzgledemKreski(w, odciecie, wszyscy.length);
    // o ile miejsc w górę (na pierwszym pytaniu wszyscy startują razem, więc bez awansów)
    const awans = lp > 1 ? Math.max(0, w.poprzednie_miejsce - w.miejsce) : 0;
    return (
      <motion.div
        key={w.nick}
        className={`wyscig-wiersz${prowadzi ? " lider" : ""}${kreska ? ` ${kreska}` : ""}${awans ? " awansuje" : ""}`}
        style={ruchToru.styl}
        initial={ruchToru.initial}
        animate={ruchToru.animate}
        transition={{ delay: ZAMIANA_OD_S, duration: ZAMIANA_S, ease: [0.45, 0, 0.2, 1] }}
      >
        {/* przed zamianą torów stary numer miejsca, z zamianą nowy */}
        {lp > 1 && w.poprzednie_miejsce !== w.miejsce ? (
          <span className="wyscig-miejsce zmiana" style={{ "--zamiana": `${ZAMIANA_OD_S}s` } as React.CSSProperties}>
            <span className="stare">{w.poprzednie_miejsce}.</span>
            <span className="nowe">{w.miejsce}.</span>
          </span>
        ) : (
          <span className="wyscig-miejsce">{w.miejsce}.</span>
        )}
        <span className="wyscig-nick">
          {w.nick}
          {(kreska === "awans" || kreska === "spadek") && (
            <span className={`wyscig-kreska ${kreska}`} style={{ animationDelay: `${START_S + RUCH_S * 0.7}s` }}>
              {kreska === "awans" ? "▲ nad kreską" : "▼ pod kreską"}
            </span>
          )}
          {/* bez plakietki „▲ 1” przy awansie (25.10, Łukasz: zamianę torów i tak widać) */}
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
  };

  const naglowek = (
    <header className="tv-ranking-gora">
      <h1>{etap?.finalowy ? "Finał: wyścig po piwo" : "Wyścig po piwo"}</h1>
      {z && <p className="tv-okazja">{`${etap ? `${etap.nazwa} · ` : ""}po pytaniu ${lp}`}</p>}
    </header>
  );

  // finał trójki: trzy drogi schodzą się pod szklanką na środku
  if (etap?.finalowy) {
    // z całej listy, nie ze strony rankingu
    const nicki = stan.finalisci?.map((f) => f.nick) ?? wszyscy.slice(0, 3).map((w) => w.nick);
    const finalisci = wszyscy.filter((w) => nicki.includes(w.nick)).slice(0, 3);
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
          {/* nowa strona: tory od nowa (klucz) ze stanem sprzed pytania na tej stronie, potem jazda i zamiana torów
              jak na pierwszej (30.10) */}
          <motion.div
            key={strona}
            className="wyscig-tory"
            style={{ "--tor": `${tor}px` } as React.CSSProperties}
            initial={strona > 0 ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="wyscig-tory-pola" style={{ gap: odstep }}>
            {wiersze.map((w, i) => {
              // tor z tej strony startuje ze swojego starego miejsca; kto przyszedł z innej strony, spoza niej
              const stare = przedPytaniem.indexOf(w);
              const zInnejStrony = stare < 0;
              const start =
                stare >= 0 ? pozycja(stare) : (indeksPrzed.get(w.nick) ?? 0) < odMiejsca ? nadStrona : podStrona;
              const wiersz = torGracza(w, i, {
                initial: { y: start - pozycja(i), opacity: zInnejStrony ? 0 : 1 },
                animate: { y: 0, opacity: 1 },
              });
              // pod ostatnim, kto przechodzi: kto jest wyżej, gra dalej
              return strefaFinalu && i === (naStronie ?? 0) - 1 ? (
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
            {/* kto przechodzi na inną stronę: stoi na swoim starym torze, a przy zamianie wyjeżdża w jej stronę */}
            {wychodza.map((w) =>
              torGracza(w, przedPytaniem.indexOf(w), {
                styl: { position: "absolute", left: 0, right: 0, top: pozycja(przedPytaniem.indexOf(w)) },
                initial: { y: 0, opacity: 1 },
                animate: {
                  y: ((indeksPo.get(w.nick) ?? 0) < odMiejsca ? nadStrona : podStrona) - pozycja(przedPytaniem.indexOf(w)),
                  opacity: 0,
                },
              }),
            )}
            </div>
          </motion.div>

          <Szklanka
            przed={nalanieSzklanki(stan.quiz, lp - 1)}
            teraz={nalanieSzklanki(stan.quiz, lp)}
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
