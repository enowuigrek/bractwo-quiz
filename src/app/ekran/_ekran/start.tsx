"use client";

import { motion, MotionConfig } from "motion/react";
import type { StanSesji } from "@/lib/gra/typy";
import { LogoNaglowka } from "./logo";

/** „1 osoba”, „3 osoby”, „5 osób”. */
function osoby(n: number): string {
  if (n === 1) return "1 osoba";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "osoby" : "osób"}`;
}

/** Ile kresek ma pasek odliczania (jedna gaśnie co sekundę przy 10 s). */
const KRESKI = 10;

/**
 * Plansza startowa klasycznego pub quizu (faza `wstep` z zegarem, 10 s): po poczekalni, zanim ruszy odliczanie
 * 3-2-1 do pierwszego pytania. Celowo inna niż tamto odliczanie (złote koło z cyfrą): wielkie „Zaczynamy!”, liczba
 * sekund w zdaniu i rząd kresek, które gasną po kolei. Pierwsze pytanie startuje samo (`dokoncz_pytanie`).
 */
export function StartTv({ stan, teraz, loga }: { stan: StanSesji; teraz: number; loga: React.ReactNode }) {
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const calosc = Math.max(1, do_ - od);
  const zostalo = Math.max(0, do_ - teraz);
  const sekundy = Math.ceil(zostalo / 1000);
  // kreski gasną od prawej, ostatnia razem z końcem odliczania
  const swieci = Math.ceil((zostalo / calosc) * KRESKI);

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-start-quizu">
        <header className="tv-naglowek">
          {loga}
          <LogoNaglowka />
        </header>
        <div className="tv-start-srodek">
          <motion.p
            className="tv-okazja"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {[stan.okazja, stan.quiz?.tytul ?? "Quiz"].filter(Boolean).join(" · ")}
          </motion.p>
          <motion.h1
            className="tv-start-tytul"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Zaczynamy!
          </motion.h1>
          <p className="tv-start-za">
            {sekundy > 0 ? (
              <>
                Pierwsze pytanie za <strong>{sekundy}</strong> s
              </>
            ) : (
              "Telefony w dłoń!"
            )}
          </p>
          <ol className="tv-start-kreski" aria-hidden>
            {Array.from({ length: KRESKI }, (_, i) => (
              <li key={i} className={i < swieci ? "swieci" : undefined} />
            ))}
          </ol>
          <p className="tv-start-podpis">
            {stan.liczba_graczy > 0 ? `Gra ${osoby(stan.liczba_graczy)}. ` : ""}
            Odpowiadacie na telefonach, a kto szybciej, ten więcej punktów.
          </p>
        </div>
      </div>
    </MotionConfig>
  );
}
