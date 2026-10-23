"use client";

import { MotionConfig } from "motion/react";
import type { StanSesji } from "@/lib/gra/typy";
import { DrogiFinalu } from "./drogi";
import { Szklanka } from "./wyscig";
import { LogoNaglowka } from "./logo";
import { OkrzykiNaDrogach } from "./okrzyki";

/**
 * Seria na TV (faza `seria`): gracze odpowiadają we własnym tempie, a tu na żywo jadą po równych drogach
 * do pełnej szklanki. Każda dobra odpowiedź to krok (dobre / liczba pytań). Przed startem odliczanie
 * w nagłówku (drogi i gracze zostają widoczne), po nim w tym samym miejscu czas do końca serii.
 * Dane: `StanSesji.seria`, odświeżane po każdej odpowiedzi. W trybie „Pijany finał” pod koniec awatary drżą,
 * a po serii ten sam ekran z tym samym nagłówkiem przechodzi w chaos (pijany.tsx). Kibice spoza finału
 * wysyłają okrzyki: dymki nad drogami (okrzyki.tsx) i licznik dopingu 📣 pod nickiem.
 */
export function SeriaTv({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const e = stan.etap;
  const n = Math.max(1, e?.liczba_pytan ?? 1);
  const gracze = stan.seria ?? [];
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const przedStartem = teraz < od;
  const najlepszy = Math.max(0, ...gracze.map((g) => g.dobre));
  // „Pijany finał”: od połowy drogi lidera (albo czasu serii) awatary zaczynają drżeć, coraz mocniej
  const postepCzasu = stan.faza_do ? (teraz - od) / Math.max(1, do_ - od) : 0;
  const drzenie =
    stan.pijany_final && !przedStartem ? Math.min(1, Math.max(0, 2 * Math.max(najlepszy / n, postepCzasu) - 1)) : 0;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`tv-wyscig tv-seria${drzenie > 0 ? " drzy" : ""}`}
        style={{ "--drzenie": drzenie } as React.CSSProperties}
      >
        <NaglowekSerii stan={stan} teraz={teraz} />

        <DrogiFinalu
          nad={
            <OkrzykiNaDrogach
              okrzyki={stan.okrzyki ?? []}
              gracze={gracze}
              polozenie={gracze.map((g) => Math.min(1, g.dobre / n))}
              teraz={teraz}
            />
          }
          opoznienie={0}
          trwanie={0.9}
          szklanka={<Szklanka przed={1} teraz={1} doKonca={0} />}
          gracze={gracze.map((g) => ({
            nick: g.nick,
            zdjecie: g.zdjecie,
            przed: 0,
            teraz: Math.min(1, g.dobre / n),
            lider: g.dobre > 0 && g.dobre === najlepszy,
            // bez numeru pytania: widać tylko, kto jedzie szybciej, ciekawiej do samego końca
            podpis: (
              <>
                <span>{g.nick}</span>
                {/* key: przy każdym nowym okrzyku licznik podskakuje */}
                {!!g.doping && (
                  <span key={g.doping} className="drogi-finalu-doping">
                    📣 {g.doping}
                  </span>
                )}
              </>
            ),
          }))}
        />
      </div>
    </MotionConfig>
  );
}

/**
 * Nagłówek serii: tytuł, podpis i zegar (przed startem odliczanie). Ten sam w pijanym finale (pijany.tsx),
 * który przed graczami udaje, że seria trwa dalej; zegar liczy wtedy czas dogrywki.
 */
export function NaglowekSerii({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const e = stan.etap;
  const n = Math.max(1, e?.liczba_pytan ?? 1);
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const przedStartem = teraz < od;
  const zostalo = Math.max(0, Math.ceil((do_ - teraz) / 1000));

  return (
    <header className="tv-ranking-gora">
      <h1>{e?.finalowy ? "Finał: seria pytań" : (e?.nazwa ?? "Seria pytań")}</h1>
      <p className="tv-okazja">{przedStartem ? "Przygotujcie telefony!" : `Pytań: ${n} · kto pierwszy do piwa`}</p>
      {przedStartem ? (
        <p className="tv-zegar tv-seria-odliczanie" aria-live="polite">
          <span>Start za</span> {Math.max(1, Math.ceil((od - teraz) / 1000))}
        </p>
      ) : (
        <p className={`tv-zegar${zostalo <= 10 ? " malo" : ""}`}>{zostalo > 0 ? zostalo : "Koniec!"}</p>
      )}
      <LogoNaglowka />
    </header>
  );
}
