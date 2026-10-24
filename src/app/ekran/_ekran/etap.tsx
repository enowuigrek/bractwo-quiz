"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { motion, MotionConfig } from "motion/react";
import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import { kolejneOdciecia } from "@/lib/gra/odpadanie";
import type { StanSesji } from "@/lib/gra/typy";
import { DemoTelefonu } from "./demo";
import { LogoNaglowka } from "./logo";

/**
 * Plansza etapu na TV (faza `etap`): który to etap, nazwa i zasady, mnożnik i czas, a obok telefon,
 * na którym animacja pokazuje, jak odpowiadać. W finale trójki duże awatary finalistów.
 * Prowadzący tłumaczy i startuje etap z pilota, więc plansza czeka bez limitu.
 */
export function EtapTv({ stan, loga }: { stan: StanSesji; loga: React.ReactNode }) {
  const e = stan.etap;
  if (!e) return null;
  // kreski odpadania na drodze przez etapy: pod etapem, po którym się odpada, krótko ilu zostaje („✂ 6”);
  // całe zdanie jest niżej, przy zasadach
  const plan = stan.plan_etapow ?? [];
  const nrFinalu = plan.find((p) => p.finalowy)?.nr ?? null;
  const progPo = (nr: number) => {
    const ile = nrFinalu !== null && nr === nrFinalu - 1 ? 3 : (plan.find((p) => p.nr === nr)?.przechodzi ?? null);
    return ile === null ? null : `✂ ${ile}`;
  };
  // dalsze odcięcia (bez bieżącego etapu, o nim mówi osobny napis niżej)
  const dalej = e.finalowy ? [] : kolejneOdciecia(stan, e.nr + 1);
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
                {progPo(i + 1) && <span className="tv-etap-droga-prog">{progPo(i + 1)}</span>}
              </li>
            ))}
          </ol>
          <LogoNaglowka />
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
              <li>
                {e.seria
                  ? `${e.czas_s ?? 60} s na całą serię`
                  : e.czas_s
                    ? `${e.czas_s} s na odpowiedź`
                    : "Kto pierwszy, ten lepszy"}
              </li>
              {e.seria && <li className="zloty">Seria: kto pierwszy dobiegnie do piwa</li>}
              {/* w finale bez liczby pytań: seria prawda/fałsz leci szybko, a liczba tylko straszy */}
              {!e.finalowy && <li>{e.liczba_pytan === 1 ? "1 pytanie" : `Pytań: ${e.liczba_pytan}`}</li>}
            </motion.ul>
            {/* odpadanie: walka o finał (trójka) albo próg po etapie z `etap.przechodzi` (src/app/pilot/[kod]/progi.tsx) */}
            {e.final_po_etapie ? (
              <motion.p className="tv-etap-walka" {...wejscie(4)}>
                🏆 Walka o finał: po tym etapie <strong>3 najlepszych</strong> wchodzi do finału
                {stan.w_grze > 3 ? `, ${stan.w_grze - 3} odpada i kibicuje` : ""}.
              </motion.p>
            ) : (
              e.przechodzi !== null &&
              stan.w_grze > e.przechodzi && (
                <motion.p className="tv-etap-walka" {...wejscie(4)}>
                  Odpadanie: po tym etapie gra dalej <strong>{e.przechodzi} najlepszych</strong>,{" "}
                  {stan.w_grze - e.przechodzi} odpada i kibicuje.
                </motion.p>
              )
            )}
            {/* etap bez odcięcia, ale dalej się odpada: gracze wiedzą od początku, o co grają */}
            {!e.final_po_etapie && e.przechodzi === null && dalej.length > 0 && (
              <motion.p className="tv-etap-plan" {...wejscie(4)}>
                Po drodze odpada się: {dalej.join(", ")}. Odpadnięci kibicują.
              </motion.p>
            )}
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
                  {e.seria
                    ? "Reszta kibicuje: na ekranie widać na żywo, kto jest bliżej piwa."
                    : "Reszta kibicuje. Telefony pokażą pytania, ale odpowiadają tylko finaliści."}
                </p>
                {stan.nagrody?.[0] && (
                  <p className="tv-etap-nagroda">
                    {stan.nagrody[0].zdjecie && <img src={stan.nagrody[0].zdjecie} alt="" />}
                    <span>
                      Gracie o: <strong className="tv-zloto">{stan.nagrody[0].nagroda}</strong>
                    </span>
                  </p>
                )}
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
