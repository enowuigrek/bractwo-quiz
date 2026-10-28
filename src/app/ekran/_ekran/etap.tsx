"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { IkonaEtapu } from "@/components/ikony-etapow";
import { motion, MotionConfig } from "motion/react";
import { useLayoutEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { bezPunktow, napisMnoznika } from "@/lib/etapy";
import type { StanSesji } from "@/lib/gra/typy";
import { DemoTelefonu } from "./demo";
import { IkonaPuchar } from "@/components/ikony";

/**
 * Plansza etapu na TV (faza `etap`): który to etap, nazwa i zasady, mnożnik i czas, a obok telefon,
 * na którym animacja pokazuje, jak odpowiadać. Od 26.10 spokojniej: ikona z nazwą w jednym bloku, mniejszy tytuł,
 * jedno zdanie zasad i drobne plakietki, żeby lewa strona nie przytłaczała. W finale trójki duże awatary finalistów.
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
  // pomiar od nowa, gdy treść urośnie po wejściu planszy: obrazki (logo lokalu, ikona etapu) i font wczytują się
  // później, a pojedynczy pomiar na starcie przepuszczał wtedy listę finalistów pod ekran (25.10 u Łukasza)
  const [urosla, ustawUrosla] = useState(0);
  useLayoutEffect(() => {
    const pole = tresc.current;
    const opis = pole?.querySelector(".tv-etap-opis");
    if (!pole || !opis || stopien >= 2) return;
    if (opis.getBoundingClientRect().height > pole.clientHeight + 1) {
      ustawCiasno({ plansza, o: stopien + 1 });
      return;
    }
    if (typeof ResizeObserver === "undefined") return;
    // tylko gdy opis naprawdę urósł od pomiaru (pierwsze zgłoszenie po podpięciu ma zwykle ten sam rozmiar;
    // pomijanie go „na ślepo” gubiło wzrost, gdy pierwsza klatka przyszła dopiero po wczytaniu obrazków)
    const wysokosc = opis.getBoundingClientRect().height;
    const obserwator = new ResizeObserver(() => {
      if (opis.getBoundingClientRect().height > wysokosc + 1) ustawUrosla((n) => n + 1);
    });
    obserwator.observe(opis);
    return () => obserwator.disconnect();
  }, [plansza, stopien, urosla]);
  if (!e) return null;
  // kreski odpadania na drodze przez etapy: pod etapem z progiem krótko, ilu zostaje („✂ 6”); trójki przed
  // finałem tu nie znaczymy, bo mówi o niej plansza walki o finał. Całe zdanie jest niżej, przy zasadach
  const plan = stan.plan_etapow ?? [];
  const progPo = (nr: number) => {
    const ile = plan.find((p) => p.nr === nr)?.przechodzi ?? null;
    return ile === null ? null : `✂ ${ile}`;
  };
  // dalsze odcięcia (bez bieżącego etapu, o nim mówi osobny napis niżej)
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
        </header>

        <div ref={tresc} className="tv-etap-tresc">
          <section className="tv-etap-opis">
            {/* ikona przed nazwą etapu, razem z „Etap X z Y” (26.10, Łukasz: tytuł z dużą ikoną obok był za ciężki) */}
            <motion.div className="tv-etap-glowa" {...wejscie(0)}>
              {e.ikona && <IkonaEtapu ikona={e.ikona} className="tv-etap-ikona" />}
              <div>
                <p className="tv-okazja">
                  Etap {e.nr} z {e.liczba}
                  {e.finalowy ? " · finał" : ""}
                </p>
                <h1>{e.nazwa}</h1>
              </div>
            </motion.div>
            {e.opis && (
              <motion.p className="tv-etap-zasady" {...wejscie(2)}>
                {e.opis}
              </motion.p>
            )}
            <motion.ul className="tv-etap-cechy" {...wejscie(3)}>
              {e.mnoznik !== 1 && !bezPunktow(e) && <li className="zloty">Punkty {napisMnoznika(e.mnoznik)}</li>}
              {/* bez limitu nic: że szybciej = więcej punktów, mówi opis etapu */}
              {(e.seria || e.czas_s) && (
                <li>{e.seria ? `${e.czas_s ?? 60} s na całą serię` : `${e.czas_s} s na odpowiedź`}</li>
              )}
              {e.seria && <li className="zloty">Seria: kto pierwszy dobiegnie do piwa</li>}
              {/* w finale bez liczby pytań: seria prawda/fałsz leci szybko, a liczba tylko straszy */}
              {!e.finalowy && <li>{e.liczba_pytan === 1 ? "1 pytanie" : `${e.liczba_pytan} ${e.liczba_pytan % 10 >= 2 && e.liczba_pytan % 10 <= 4 && (e.liczba_pytan % 100 < 12 || e.liczba_pytan % 100 > 14) ? "pytania" : "pytań"}`}</li>}
            </motion.ul>
            {/* odpadanie: walka o finał (trójka) albo próg po etapie z `etap.przechodzi` (src/app/pilot/[kod]/progi.tsx) */}
            {/* tylko gdy ktoś naprawdę odpada (26.10: przy 2–3 graczach nic) */}
            {e.final_po_etapie && stan.w_grze > 3 ? (
              <motion.p className="tv-etap-walka" {...wejscie(4)}>
                <IkonaPuchar /> Walka o finał: po tym etapie <strong>3 najlepszych</strong> wchodzi do finału,{" "}
                {stan.w_grze - 3} odpada i kibicuje.
              </motion.p>
            ) : (
              !e.final_po_etapie &&
              e.przechodzi !== null &&
              stan.w_grze > e.przechodzi && (
                <motion.p className="tv-etap-walka" {...wejscie(4)}>
                  Odpadanie: po tym etapie gra dalej <strong>{e.przechodzi} najlepszych</strong>,{" "}
                  {stan.w_grze - e.przechodzi} odpada i kibicuje.
                </motion.p>
              )
            )}
            {/* bez zapowiedzi „po drodze odpada się” w etapach bez odcięcia (26.10): o odpadaniu mówi etap, w którym się
                odpada */}
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
