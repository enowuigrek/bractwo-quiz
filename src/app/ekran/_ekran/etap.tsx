"use client";

import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import type { StanSesji } from "@/lib/gra/typy";
import { DemoTelefonu } from "./demo";

/**
 * Plansza etapu na TV (faza `etap`): który to etap, nazwa i zasady, mnożnik i czas, a obok telefon,
 * na którym animacja pokazuje, jak odpowiadać. W finale trójki duże awatary finalistów.
 * Prowadzący tłumaczy i startuje etap z pilota, więc plansza czeka bez limitu.
 */
export function EtapTv({ stan, loga }: { stan: StanSesji; loga: React.ReactNode }) {
  const e = stan.etap;
  if (!e) return null;
  const wejscie = (i: number) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: 0.15 + i * 0.15, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
  });

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-etap">
        <header className="tv-naglowek">
          {loga}
          {/* droga przez etapy: kropka na każdy etap, ten złoty i większy */}
          <ol className="tv-etap-droga" aria-label={`Etap ${e.nr} z ${e.liczba}`}>
            {Array.from({ length: e.liczba }, (_, i) => (
              <li key={i} className={i + 1 < e.nr ? "byl" : i + 1 === e.nr ? "teraz" : undefined}>
                {i + 1}
              </li>
            ))}
          </ol>
        </header>

        <div className="tv-etap-tresc">
          <section className="tv-etap-opis">
            <motion.p className="tv-okazja" {...wejscie(0)}>
              Etap {e.nr} z {e.liczba}
              {e.finalowy ? " · finał" : ""}
            </motion.p>
            <motion.h1 {...wejscie(1)}>{e.nazwa}</motion.h1>
            {e.opis && (
              <motion.p className="tv-etap-zasady" {...wejscie(2)}>
                {e.opis}
              </motion.p>
            )}
            <motion.ul className="tv-etap-cechy" {...wejscie(3)}>
              {e.mnoznik !== 1 && <li className="zloty">Punkty {napisMnoznika(e.mnoznik)}</li>}
              <li>{e.czas_s ? `${e.czas_s} s na odpowiedź` : "Bez limitu czasu"}</li>
              <li>{e.liczba_pytan === 1 ? "1 pytanie" : `Pytań: ${e.liczba_pytan}`}</li>
            </motion.ul>
            {stan.finalisci && (
              <motion.div className="tv-etap-final" {...wejscie(4)}>
                <p className="tv-etykieta">W finale grają</p>
                <ul>
                  {stan.finalisci.map((f, i) => (
                    <li key={f.nick}>
                      <span className="tv-etap-final-miejsce">{i + 1}.</span>
                      <Awatar nick={f.nick} zdjecie={f.zdjecie} rozmiar={110} />
                      <span>{f.nick}</span>
                    </li>
                  ))}
                </ul>
                <p className="tv-podpowiedz">
                  Reszta kibicuje. Telefony pokażą pytania, ale odpowiadają tylko finaliści.
                </p>
              </motion.div>
            )}
          </section>
          {e.typy.length > 0 && (
            <motion.div
              className="tv-etap-demo"
              initial={{ opacity: 0, x: 60 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            >
              <DemoTelefonu typy={e.typy} />
            </motion.div>
          )}
        </div>
      </div>
    </MotionConfig>
  );
}
