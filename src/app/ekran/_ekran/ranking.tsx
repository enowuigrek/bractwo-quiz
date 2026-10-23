"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { animate, AnimatePresence, motion, MotionConfig } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { RESZTA_PODIUM_S, WJAZD_PODIUM_S } from "@/lib/gra/podium";
import type { Nagroda, StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { deszczKonfetti, wybuchKonfetti } from "@/lib/konfetti";
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
  const liczba = stan.quiz?.liczba_zadan ?? "?";

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-ranking">
        <header className="tv-ranking-gora">
          <h1>Ranking</h1>
          {z && (
            <p className="tv-okazja">
              po pytaniu {z.lp}/{liczba}
            </p>
          )}
          <LogoNaglowka />
        </header>

        {ranking.length === 0 ? (
          <p className="tv-zacheta">Nikt jeszcze nie gra.</p>
        ) : (
          <ol className={`tv-ranking-lista${wiersze.length > 8 ? " gesto" : ""}`}>
            <AnimatePresence initial={false}>
              {wiersze.map((w) => {
                const miejsce = po ? w.miejsce : w.poprzednie_miejsce;
                const zmiana = w.poprzednie_miejsce - w.miejsce;
                return (
                  <motion.li
                    key={w.nick}
                    layout="position"
                    transition={ruch}
                    initial={{ opacity: 0, x: -60 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 60 }}
                    className={`tv-ranking-wiersz${po && w.miejsce === 1 ? " lider" : ""}`}
                  >
                    <span className="tv-ranking-miejsce">{miejsce}.</span>
                    <span className="tv-ranking-nick">
                      <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={52} />
                      <span>{w.nick}</span>
                    </span>
                    <span className="tv-ranking-zmiana">
                      {po && zmiana > 0 && <span className="w-gore">▲ {zmiana}</span>}
                      {po && zmiana < 0 && <span className="w-dol">▼ {-zmiana}</span>}
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
  const dalej = ranking.slice(3, 10);
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
        <motion.ol
          className="tv-podium-dalej"
          initial={odRazu ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: odRazu ? 0 : Math.max(0, RESZTA_PODIUM_S - uplynelo) }}
        >
          {dalej.map((w) => (
            <li key={w.nick}>
              <span className="tv-zloto">{w.miejsce}.</span> {w.nick}{" "}
              <span className="tv-podpowiedz">{w.punkty.toLocaleString("pl-PL")}</span>
            </li>
          ))}
        </motion.ol>
      )}
    </MotionConfig>
  );
}
