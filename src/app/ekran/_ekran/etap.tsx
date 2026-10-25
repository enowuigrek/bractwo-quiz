"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { motion, MotionConfig } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { napisMnoznika } from "@/lib/etapy";
import { kolejneOdciecia } from "@/lib/gra/odpadanie";
import type { StanSesji } from "@/lib/gra/typy";
import { DemoTelefonu } from "./demo";
import { LogoNaglowka } from "./logo";
import { IkonaPuchar } from "@/components/ikony";

/**
 * Plansza etapu na TV (faza `etap`): który to etap, nazwa i zasady, mnożnik i czas, a obok telefon,
 * na którym animacja pokazuje, jak odpowiadać. W finale trójki duże awatary finalistów.
 * Prowadzący tłumaczy i startuje etap z pilota, więc plansza czeka bez limitu.
 */
export function EtapTv({ stan, loga }: { stan: StanSesji; loga: React.ReactNode }) {
  const e = stan.etap;
  // gdy opis z finalistami nie mieści się w wysokości ekranu, plansza zmniejsza się o stopień (25.10: na planszy finału
  // lista finalistów wypadała pod ekran); stopień liczony od nowa dla każdej planszy
  const tresc = useRef<HTMLDivElement>(null);
  const plansza = `${e?.id ?? ""}|${stan.finalisci?.length ?? 0}`;
  const [ciasno, ustawCiasno] = useState({ plansza, o: 0 });
  const stopien = ciasno.plansza === plansza ? ciasno.o : 0;
  useLayoutEffect(() => {
    const pole = tresc.current;
    const opis = pole?.querySelector(".tv-etap-opis");
    if (!pole || !opis || stopien >= 2) return;
    if (opis.getBoundingClientRect().height > pole.clientHeight + 1) ustawCiasno({ plansza, o: stopien + 1 });
  }, [plansza, stopien]);
  if (!e) return null;
  // kreski odpadania na drodze przez etapy: pod etapem z progiem krótko, ilu zostaje („✂ 6”); trójki przed
  // finałem tu nie znaczymy, bo mówi o niej plansza walki o finał. Całe zdanie jest niżej, przy zasadach
  const plan = stan.plan_etapow ?? [];
  const progPo = (nr: number) => {
    const ile = plan.find((p) => p.nr === nr)?.przechodzi ?? null;
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
      <div className={`tv-etap${stopien ? ` ciasno-${stopien}` : ""}`}>
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

        <div ref={tresc} className="tv-etap-tresc">
          <section className="tv-etap-opis">
            <motion.p className="tv-okazja" {...wejscie(0)}>
              Etap {e.nr} z {e.liczba}
              {e.finalowy ? " · finał" : ""}
            </motion.p>
            <motion.h1 className={e.ikona ? "z-ikona" : undefined} {...wejscie(1)}>
              {e.ikona && <img src={e.ikona} alt="" className="tv-etap-ikona" />}
              <span>{e.nazwa}</span>
            </motion.h1>
            {e.opis && (
              <motion.p className="tv-etap-zasady" {...wejscie(2)}>
                {e.opis}
              </motion.p>
            )}
            <motion.ul className="tv-etap-cechy" {...wejscie(3)}>
              {e.mnoznik !== 1 && <li className="zloty">Punkty {napisMnoznika(e.mnoznik)}</li>}
              {/* bez limitu nic: że szybciej = więcej punktów, mówi opis etapu */}
              {(e.seria || e.czas_s) && (
                <li>{e.seria ? `${e.czas_s ?? 60} s na całą serię` : `${e.czas_s} s na odpowiedź`}</li>
              )}
              {e.seria && <li className="zloty">Seria: kto pierwszy dobiegnie do piwa</li>}
              {/* w finale bez liczby pytań: seria prawda/fałsz leci szybko, a liczba tylko straszy */}
              {!e.finalowy && <li>{e.liczba_pytan === 1 ? "1 pytanie" : `Pytań: ${e.liczba_pytan}`}</li>}
            </motion.ul>
            {/* odpadanie: walka o finał (trójka) albo próg po etapie z `etap.przechodzi` (src/app/pilot/[kod]/progi.tsx) */}
            {e.final_po_etapie ? (
              <motion.p className="tv-etap-walka" {...wejscie(4)}>
                <IkonaPuchar /> Walka o finał: po tym etapie <strong>3 najlepszych</strong> wchodzi do finału
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
