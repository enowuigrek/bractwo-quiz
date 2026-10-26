"use client";
/* eslint-disable @next/next/no-img-element -- grafika szklanki z /public */

import { IkonaEtapu } from "@/components/ikony-etapow";
import { motion, MotionConfig } from "motion/react";
import type { StanSesji } from "@/lib/gra/typy";

/**
 * Plansza wstępu (faza `wstep`, quiz z etapami): zanim ruszy rozgrzewka, prowadzący opowiada całą drogę.
 * Etapy jeden za drugim, pod etapem, po którym się odpada, ilu zostaje (progi z `sesje.progi`), a na końcu
 * szklanka, która nalewa się z każdym pytaniem: kto pierwszy do piwa.
 */
export function WstepTv({ stan, loga }: { stan: StanSesji; loga: React.ReactNode }) {
  const plan = stan.plan_etapow ?? [];
  const final = plan.find((e) => e.finalowy);
  const wejscie = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.2 + i * 0.18, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  });
  // ilu zostaje po etapie (tylko gdy przy obecnej liczbie grających ktoś odpada)
  const zostaje = (nr: number) => {
    const ile = final && nr === final.nr - 1 ? 3 : (plan.find((e) => e.nr === nr)?.przechodzi ?? null);
    return ile !== null && stan.w_grze > ile ? ile : null;
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-wstep">
        <header className="tv-naglowek">
          {loga}
        </header>
        <motion.p className="tv-okazja" {...wejscie(0)}>
          {stan.quiz?.tytul ?? "Quiz"}
        </motion.p>
        <motion.h1 className="tv-wstep-tytul" {...wejscie(1)}>
          Wyścig po piwo
        </motion.h1>
        <motion.p className="tv-wstep-opis" {...wejscie(2)}>
          Przed nami {plan.length} {plan.length >= 5 ? "etapów" : "etapy"}. Z każdym pytaniem nalewa się piwo, a wy
          ścigacie się do niego.
          {/* o odpadaniu tylko, gdy ktoś odpadnie (przy 2–3 graczach wszyscy grają w finale) */}
          {stan.w_grze > 3 ? " Po drodze odpadają najsłabsi, a o piwo walczy finałowa trójka." : " Na końcu finał o piwo."}
        </motion.p>

        <ol className="tv-wstep-droga">
          {plan.map((e, i) => (
            <motion.li key={e.nr} className={e.finalowy ? "final" : undefined} {...wejscie(3 + i)}>
              {e.ikona ? <IkonaEtapu ikona={e.ikona} className="tv-wstep-ikona" /> : null}
              <span className="tv-wstep-nr">{e.nr}</span>
              <span className="tv-wstep-nazwa">{e.nazwa}</span>
              {zostaje(e.nr) !== null && (
                <span className="tv-wstep-prog">
                  {e.nr === (final?.nr ?? 0) - 1 ? "do finału 3" : `zostaje ${zostaje(e.nr)}`}
                </span>
              )}
            </motion.li>
          ))}
          <motion.li className="tv-wstep-meta" {...wejscie(3 + plan.length)}>
            <img src="/grafiki/szklanka.webp" alt="" />
          </motion.li>
        </ol>
      </div>
    </MotionConfig>
  );
}
