"use client";

import { useState } from "react";
import { MotionConfig } from "motion/react";
import { metaFinalu, naDrodzeFinalu } from "@/lib/gra/final";
import type { SeriaGracz, StanSesji } from "@/lib/gra/typy";
import { DrogiFinalu, drogi } from "./drogi";
import { Szklanka } from "./wyscig";
import { OkrzykiNaDrogach } from "./okrzyki";
import { IkonaMegafon } from "@/components/ikony";
import { useMarka } from "@/components/marka";
import { ma } from "@/lib/marka";

/**
 * Seria na TV (faza `seria`): gracze odpowiadają we własnym tempie, a tu na żywo jadą po równych drogach
 * do pełnej szklanki. Każda dobra odpowiedź to krok; w finale `metaFinalu` kroków (domyślnie 12) z przewagą 0–4 według punktów
 * sprzed finału, a zła cofa o krok (src/lib/gra/final.ts), w zwykłej serii dobre / liczba pytań. Przed startem odliczanie
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
  // finał: wyścig na `metaFinalu` kroków z przewagą (src/lib/gra/final.ts); zwykła seria: dobre / liczba pytań
  // z pijanym finałem nikt nie dobiega do szklanki: wyścig ma wyglądać, jakby trwał dalej
  const naDrodze = (g: SeriaGracz) => (e?.finalowy ? naDrodzeFinalu(g, stan.pijany_final, metaFinalu(stan)) : Math.min(1, g.dobre / n));
  const najlepszy = Math.max(0, ...gracze.map(naDrodze));
  const marka = useMarka();

  // ocena ostatniej odpowiedzi każdego finalisty: porównanie z poprzednim stanem serii (liczone przy zmianie
  // danych, w czasie renderu, jak zaleca React dla wartości wyprowadzonych z poprzednich propsów)
  const [poprzednia, ustawPoprzednia] = useState<SeriaGracz[] | null>(stan.seria);
  const [oceny, ustawOceny] = useState<Record<string, { dobrze: boolean; nr: number }>>({});
  if (stan.seria !== poprzednia) {
    const zmiany: Record<string, { dobrze: boolean; nr: number }> = {};
    for (const g of stan.seria ?? []) {
      const p = poprzednia?.find((x) => x.nick === g.nick);
      if (p && g.odpowiedzi > p.odpowiedzi) zmiany[g.nick] = { dobrze: g.dobre > p.dobre, nr: g.odpowiedzi };
    }
    ustawPoprzednia(stan.seria);
    if (Object.keys(zmiany).length) ustawOceny((o) => ({ ...o, ...zmiany }));
  }
  // „Pijany finał”: od połowy drogi lidera (albo czasu serii) awatary zaczynają drżeć, coraz mocniej
  const postepCzasu = stan.faza_do ? (teraz - od) / Math.max(1, do_ - od) : 0;
  const drzenie =
    stan.pijany_final && !przedStartem ? Math.min(1, Math.max(0, 2 * Math.max(najlepszy, postepCzasu) - 1)) : 0;

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`tv-wyscig tv-seria${drzenie > 0 ? " drzy" : ""}`}
        style={{ "--drzenie": drzenie } as React.CSSProperties}
      >
        <NaglowekSerii stan={stan} teraz={teraz} />

        <DrogiFinalu
          nad={
            <>
              <OkrzykiNaDrogach
                okrzyki={stan.okrzyki ?? []}
                gracze={gracze}
                polozenie={gracze.map(naDrodze)}
                teraz={teraz}
              />
              {/* JOWES (18.11, prośba Zbyszka): przy każdej drodze chmurka z pytaniem gracza */}
              {ma(marka, "chmurki-pytan-w-finale") && !przedStartem && <ChmurkiPytan gracze={gracze} />}
            </>
          }
          opoznienie={0}
          trwanie={0.9}
          szklanka={ma(marka, "szklanka") ? <Szklanka przed={1} teraz={1} doKonca={0} /> : null}
          gracze={gracze.map((g) => ({
            nick: g.nick,
            zdjecie: g.zdjecie,
            przed: 0,
            teraz: naDrodze(g),
            lider: naDrodze(g) > 0 && naDrodze(g) === najlepszy,
            ocena: oceny[g.nick],
            // bez numeru pytania: widać tylko, kto jedzie szybciej, ciekawiej do samego końca
            podpis: (
              <>
                <span>{g.nick}</span>
                {/* key: przy każdym nowym okrzyku licznik podskakuje */}
                {!!g.doping && (
                  <span key={g.doping} className="drogi-finalu-doping">
                    <IkonaMegafon /> {g.doping}
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
 * Chmurki z pytaniem każdego finalisty (`chmurki-pytan-w-finale`, JOWES, 18.11): po prawej, na końcu jego drogi
 * (tam, gdzie w Bractwie stoi szklanka), na wysokości drogi, z dzióbkiem w jej stronę. Sama treść pytania,
 * bez rozwiązania (`stan_sesji`).
 * Wysokość chmurki z odstępu między drogami, a treść ucina się do tylu linii, ile się zmieści.
 */
function ChmurkiPytan({ gracze }: { gracze: SeriaGracz[] }) {
  const lista = drogi(gracze.length);
  const odstep = lista.length > 1 ? lista[1].od.y - lista[0].od.y : 200;
  const wysokosc = Math.min(170, odstep - 12);
  const linii = Math.max(1, Math.floor((wysokosc - 24) / 26));
  return (
    <>
      {gracze.map((g, i) =>
        g.pytanie ? (
          <div
            key={`${g.nick}:${g.pytanie}`}
            className="seria-chmurka"
            style={{ top: lista[i].od.y, maxHeight: wysokosc, "--linii": linii } as React.CSSProperties}
          >
            <p>{g.pytanie}</p>
          </div>
        ) : null,
      )}
    </>
  );
}

/**
 * Nagłówek serii: tytuł, podpis i zegar (przed startem odliczanie). Ten sam w pijanym finale (pijany.tsx),
 * który przed graczami udaje, że seria trwa dalej; zegar liczy wtedy czas dogrywki.
 */
export function NaglowekSerii({
  stan,
  teraz,
  zegar,
}: {
  stan: StanSesji;
  teraz: number;
  /** Pijany finał: własne sekundy zamiast czasu do końca, `null` = zegar znika (`zegarPijany`). */
  zegar?: number | null;
}) {
  const marka = useMarka();
  const e = stan.etap;
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const przedStartem = teraz < od;
  const zostalo = zegar !== undefined ? (zegar ?? 0) : Math.max(0, Math.ceil((do_ - teraz) / 1000));

  return (
    <header className="tv-ranking-gora">
      <h1>{e?.finalowy ? "Finał: seria pytań" : (e?.nazwa ?? "Seria pytań")}</h1>
      <p className="tv-okazja">{przedStartem ? "Przygotujcie telefony!" : `Kto pierwszy ${marka.teksty.doCelu}`}</p>
      {przedStartem ? (
        <p className="tv-zegar tv-seria-odliczanie" aria-live="polite">
          <span>Start za</span> {Math.max(1, Math.ceil((od - teraz) / 1000))}
        </p>
      ) : (
        <p
          className={`tv-zegar${zegar === undefined && zostalo <= 10 ? " malo" : ""}`}
          // znikający zegar trzyma miejsce, żeby nagłówek nie skakał
          style={zegar === null ? { visibility: "hidden" } : undefined}
        >
          {/* przed pijanym finałem bez „Koniec!”: zegar staje na 0 i stamtąd w pijanym leci w górę */}
          {zostalo > 0 || zegar !== undefined || stan.pijany_final ? zostalo : "Koniec!"}
        </p>
      )}
    </header>
  );
}
