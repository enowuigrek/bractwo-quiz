"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { animate, AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { RESZTA_PODIUM_S, WJAZD_PODIUM_S } from "@/lib/gra/podium";
import { odciecieEtapu, wzgledemKreski } from "@/lib/gra/odpadanie";
import type { Nagroda, StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { deszczKonfetti, wybuchKonfetti } from "@/lib/konfetti";
import { zagraj } from "@/lib/gra/efekty";
import { LogoNaglowka } from "./logo";

/** Ile wierszy mieści ranking na scenie 1920×1080. */
const W_RANKINGU = 10;
/** Po ilu ms ranking przetasowuje się ze stanu sprzed pytania do bieżącego. */
const PRZETASOWANIE_MS = 1600;

const ruch = { type: "spring", stiffness: 140, damping: 22 } as const;

/** Liczba, która płynnie dolicza do nowej wartości. */
export function Licznik({ wartosc }: { wartosc: number }) {
  const [widoczna, ustawWidoczna] = useState(wartosc);
  const poprzednia = useRef(wartosc);
  useEffect(() => {
    const od = poprzednia.current;
    poprzednia.current = wartosc;
    if (od === wartosc) return;
    const a = animate(od, wartosc, { duration: 1.2, ease: "easeOut", onUpdate: (v) => ustawWidoczna(Math.round(v)) });
    return () => a.stop();
  }, [wartosc]);
  return <>{widoczna.toLocaleString("pl-PL")}</>;
}

/**
 * Ranking po pytaniu. Najpierw stoi kolejność sprzed pytania, a po chwili wiersze
 * przetasowują się na nowe miejsca, punkty doliczają się, a przy nickach pojawia się „+zdobyte”.
 */
/** Wysokość paska „Koniec etapu” z odstępem (wyścig odejmuje ją od miejsca na tory). */
export const KONIEC_ETAPU_PX = 104;

/**
 * Ranking po ostatnim pytaniu etapu: duży pasek pod nagłówkiem, wjeżdża po chwili, żeby było widać, że etap się
 * skończył (sam podtytuł w nagłówku łatwo przeoczyć).
 */
export function KoniecEtapu({ stan }: { stan: StanSesji }) {
  if (!stan.etap || !stan.ostatnie_w_etapie || stan.etap.finalowy) return null;
  return (
    <motion.div
      className="tv-koniec-etapu"
      initial={{ opacity: 0, scale: 1.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <span>Koniec etapu {stan.etap.nr}</span>
      <span className="tv-koniec-etapu-nazwa">{stan.etap.nazwa}</span>
    </motion.div>
  );
}

export function RankingTv({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const [po, ustawPo] = useState(false);
  useEffect(() => {
    const zegar = setTimeout(() => ustawPo(true), PRZETASOWANIE_MS);
    return () => clearTimeout(zegar);
  }, []);

  const wiersze = [...ranking]
    .sort((a, b) =>
      po
        ? a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl")
        : a.poprzednie_miejsce - b.poprzednie_miejsce || a.nick.localeCompare(b.nick, "pl"),
    )
    .slice(0, W_RANKINGU);
  const reszta = ranking.length - wiersze.length;
  const z = stan.zadanie;
  // „fiuu” przy przetasowaniu, gdy ktoś zmienia miejsce (jak zamiana torów w wyścigu; w klasycznym pub quizie
  // tabela zastępuje wyścig, 26.10). Po pierwszym pytaniu i w finale bez dźwięku, jak w wyścigu.
  const zamiana = (z?.lp ?? 0) > 1 && !stan.etap?.finalowy && wiersze.some((w) => w.poprzednie_miejsce !== w.miejsce);
  const dzwieki = stan.muzyka;
  useEffect(() => {
    if (!dzwieki || !zamiana) return;
    const minutnik = window.setTimeout(() => zagraj("zamiana"), PRZETASOWANIE_MS);
    return () => window.clearTimeout(minutnik);
  }, [dzwieki, zamiana]);
  // odcięcie po etapie (jak w wyścigu): kreska pod ostatnim, kto gra dalej
  const odciecie = odciecieEtapu(stan);

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-ranking">
        <header className="tv-ranking-gora">
          <h1>Ranking</h1>
          {z && (
            <p className="tv-okazja">
              {stan.etap && stan.ostatnie_w_etapie ? `${stan.etap.nazwa} · po pytaniu ${z.lp}` : `po pytaniu ${z.lp}`}
            </p>
          )}
          <LogoNaglowka />
        </header>
        <KoniecEtapu stan={stan} />

        {ranking.length === 0 ? (
          <p className="tv-zacheta">Nikt jeszcze nie gra.</p>
        ) : (
          <ol className={`tv-ranking-lista${wiersze.length > 8 ? " gesto" : ""}`}>
            <AnimatePresence initial={false}>
              {wiersze.map((w) => {
                const miejsce = po ? w.miejsce : w.poprzednie_miejsce;
                const zmiana = w.poprzednie_miejsce - w.miejsce;
                const kreska = wzgledemKreski(w, odciecie, ranking.length);
                return (
                  <motion.li
                    key={w.nick}
                    layout="position"
                    transition={ruch}
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    className={`tv-ranking-wiersz${po && w.miejsce === 1 ? " lider" : ""}${
                      po && odciecie !== null && ranking.length > odciecie && w.miejsce === odciecie ? " granica" : ""
                    }${po && kreska ? ` ${kreska}` : ""}`}
                  >
                    <span className="tv-ranking-miejsce">{miejsce}.</span>
                    <span className="tv-ranking-nick">
                      <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={52} />
                      <span>{w.nick}</span>
                    </span>
                    <span className="tv-ranking-zmiana">
                      {po && kreska === "awans" ? (
                        <span className="w-gore">▲ nad kreską</span>
                      ) : po && kreska === "spadek" ? (
                        <span className="w-dol">▼ pod kreską</span>
                      ) : (
                        <>
                          {po && zmiana > 0 && <span className="w-gore">▲ {zmiana}</span>}
                          {po && zmiana < 0 && <span className="w-dol">▼ {-zmiana}</span>}
                        </>
                      )}
                    </span>
                    <span className="tv-ranking-zdobyte">
                      {po && w.zdobyte > 0 && (
                        <motion.span initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
                          +{w.zdobyte}
                        </motion.span>
                      )}
                    </span>
                    <span className="tv-ranking-punkty">
                      <Licznik wartosc={po ? w.punkty : w.punkty - w.zdobyte} />
                    </span>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ol>
        )}
        {reszta > 0 && (
          <p className="tv-ranking-reszta">…i jeszcze {reszta} w grze. Swoje miejsce masz na telefonie.</p>
        )}
      </div>
    </MotionConfig>
  );
}

/** Kolejność stopni na podium: 2. z lewej, 1. w środku, 3. z prawej. */
const STOPNIE = [1, 0, 2] as const;

/**
 * Podium: trzy pierwsze miejsca wjeżdżają po kolei, zwycięzca na końcu i ze złotym blaskiem.
 * Pod spodem miejsca 4–10. `odRazu` (faza `koniec`) pokazuje wszystko bez odliczania.
 */
export function PodiumTv({
  ranking,
  odRazu,
  start,
  nagrody,
}: {
  ranking: WierszRankingu[];
  odRazu: boolean;
  start: number | null;
  nagrody: Nagroda[] | null;
}) {
  const top = ranking.slice(0, 3);
  // dalsze miejsca: wszyscy (do 30), w jednej linii, która przesuwa się w bok, gdy się nie mieści (PasekDalej)
  const dalej = ranking.slice(3);
  // Czasy liczymy od początku fazy w bazie, nie od chwili, gdy TV ją zauważyło
  // (telefony odsłaniają miejsca według tego samego zegara). Po przeładowaniu w trakcie podium nie ma powtórki.
  const [uplynelo] = useState(() => (start ? Math.max(0, (Date.now() - start) / 1000) : 0));
  const opoznienie = (i: number) => (odRazu ? 0 : Math.max(0, WJAZD_PODIUM_S[i] - uplynelo));

  // fanfara: gdy wjeżdża zwycięzca, konfetti z obu stron i złoty deszcz; na końcu gry krótszy wybuch
  useEffect(() => {
    if (top.length === 0) return;
    if (odRazu) {
      wybuchKonfetti();
      return;
    }
    const za = WJAZD_PODIUM_S[0] + 0.5 - uplynelo;
    // TV włączone długo po wjeździe zwycięzcy: bez fanfary
    if (za < -10) return;
    let przerwij: (() => void) | undefined;
    const zegar = setTimeout(
      () => {
        wybuchKonfetti();
        przerwij = deszczKonfetti(6000);
      },
      Math.max(0, za) * 1000,
    );
    return () => {
      clearTimeout(zegar);
      przerwij?.();
    };
  }, [odRazu, top.length, uplynelo]);

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-podium">
        {STOPNIE.filter((i) => top[i]).map((i) => {
          const w = top[i];
          // nagroda według miejsca (przy remisie obaj gracze mają tę samą)
          const nagroda = nagrody?.find((n) => n.miejsce === w.miejsce);
          return (
            <motion.div
              key={w.nick}
              className={`tv-stopien tv-stopien-${i + 1} metal-${Math.min(w.miejsce, 3)}`}
              initial={odRazu ? false : { opacity: 0, y: 120, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: opoznienie(i), type: "spring", stiffness: 120, damping: 14 }}
            >
              <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={i === 0 ? 170 : 130} className="tv-stopien-awatar" />
              {i === 0 && <span className="tv-stopien-korona">Zwycięzca</span>}
              <span className="tv-stopien-nick">{w.nick}</span>
              <span className="tv-stopien-punkty">{w.punkty.toLocaleString("pl-PL")} pkt</span>
              {/* zdjęcie nagrody między punktami a jej nazwą */}
              {nagroda?.zdjecie && <img src={nagroda.zdjecie} alt="" className="tv-stopien-zdjecie" />}
              {nagroda && <span className="tv-stopien-nagroda">{nagroda.nagroda}</span>}
              <div className="tv-stopien-blok">
                <span className="tv-stopien-nr">{w.miejsce}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
      {dalej.length > 0 && (
        <motion.div
          initial={odRazu ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: odRazu ? 0 : Math.max(0, RESZTA_PODIUM_S - uplynelo) }}
        >
          <PasekDalej wiersze={dalej} />
        </motion.div>
      )}
    </MotionConfig>
  );
}

/** Prędkość przesuwania paska dalszych miejsc (px na sekundę): spokojnie, żeby dało się przeczytać nicki. */
const PASEK_PX_S = 70;

/**
 * Dalsze miejsca pod podium w jednej linii (25.10, Łukasz: wcześniej tylko 4.–10. w dwóch rzędach). Gdy wszyscy się
 * mieszczą, stoją na środku; gdy nie, linia przesuwa się w bok bez końca (druga kopia za pierwszą).
 */
function PasekDalej({ wiersze }: { wiersze: WierszRankingu[] }) {
  const pole = useRef<HTMLDivElement>(null);
  const lista = useRef<HTMLOListElement>(null);
  const [szerokosc, ustawSzerokosc] = useState<number | null>(null);
  useLayoutEffect(() => {
    const w = lista.current?.scrollWidth ?? 0;
    const miejsce = pole.current?.clientWidth ?? 0;
    ustawSzerokosc(w > miejsce ? w : null);
  }, [wiersze]);
  const elementy = wiersze.map((w) => (
    <li key={w.nick}>
      <span className="tv-zloto">{w.miejsce}.</span> {w.nick}{" "}
      <span className="tv-podpowiedz">{w.punkty.toLocaleString("pl-PL")}</span>
    </li>
  ));
  return (
    <div ref={pole} className={`tv-podium-dalej${szerokosc ? " przewija" : ""}`}>
      <div
        className="tv-podium-dalej-tor"
        style={szerokosc ? { animationDuration: `${Math.round(szerokosc / PASEK_PX_S)}s` } : undefined}
      >
        <ol ref={lista}>{elementy}</ol>
        {szerokosc && <ol aria-hidden>{elementy}</ol>}
      </div>
    </div>
  );
}
