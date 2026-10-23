"use client";

import { MotionConfig } from "motion/react";
import type { StanSesji } from "@/lib/gra/typy";
import { DrogiFinalu } from "./drogi";
import { Szklanka } from "./wyscig";

/**
 * Seria na TV (faza `seria`): gracze odpowiadają we własnym tempie, a tu na żywo jadą po równych drogach
 * do pełnej szklanki. Każda dobra odpowiedź to krok (dobre / liczba pytań). Przed startem odliczanie,
 * u góry czas do końca serii. Dane: `StanSesji.seria`, odświeżane po każdej odpowiedzi.
 */
export function SeriaTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const e = stan.etap;
  const n = Math.max(1, e?.liczba_pytan ?? 1);
  const gracze = stan.seria ?? [];
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const przedStartem = teraz < od;
  const zostalo = Math.max(0, Math.ceil((do_ - teraz) / 1000));
  const najlepszy = Math.max(0, ...gracze.map((g) => g.dobre));

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-wyscig tv-seria">
        <header className="tv-ranking-gora">
          <h1>{e?.finalowy ? "Finał: seria pytań" : (e?.nazwa ?? "Seria pytań")}</h1>
          <p className="tv-okazja">{przedStartem ? "Start za chwilę" : `Pytań: ${n} · każda dobra to krok do piwa`}</p>
          <p className={`tv-zegar${!przedStartem && zostalo <= 10 ? " malo" : ""}`}>
            {przedStartem ? "" : zostalo > 0 ? zostalo : "Koniec!"}
          </p>
        </header>

        <DrogiFinalu
          opoznienie={0}
          trwanie={0.9}
          szklanka={<Szklanka przed={1} teraz={1} doKonca={0} />}
          gracze={gracze.map((g) => ({
            nick: g.nick,
            zdjecie: g.zdjecie,
            przed: 0,
            teraz: Math.min(1, g.dobre / n),
            lider: g.dobre > 0 && g.dobre === najlepszy,
            podpis: (
              <>
                <span>{g.nick}</span>
                <span className="drogi-finalu-punkty">
                  {g.odpowiedzi >= n ? "skończył" : `pytanie ${Math.min(n, g.odpowiedzi + 1)}/${n}`}
                </span>
              </>
            ),
          }))}
        />

        {przedStartem && (
          <div className="tv-seria-start" aria-live="polite">
            <p className="tv-odliczanie">{Math.max(1, Math.ceil((od - teraz) / 1000))}</p>
            <p className="tv-duzy">Przygotujcie telefony!</p>
          </div>
        )}
      </div>
    </MotionConfig>
  );
}
