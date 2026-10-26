"use client";

import { motion } from "motion/react";
import { Awatar } from "@/components/awatar";

// Plansza finału: równe drewniane drogi z lewej, równoległe i blisko siebie (od 26.10; wcześniej zbiegały się
// pod szklanką), a szklanka po prawej na środku wysokości, na wprost dróg.
// Wspólna dla serii na żywo (seria.tsx), rankingu po finale (wyscig.tsx) i pijanego finału (pijany.tsx).
// Piksele planszy 1760×780.

export const PLANSZA_DROG = { szer: 1760, wys: 780 };
const { szer: SZER, wys: WYS } = PLANSZA_DROG;
/** Szklanka po prawej, na środku wysokości; drogi kończą się tuż przed nią. */
export const SZKLANKA_FINALU = { x: 1560, y: 430 };
const KONIEC_X = 1330;
const START_X = 130;

export type Droga = { od: { x: number; y: number }; do: { x: number; y: number }; grubosc: number };

/**
 * `n` równoległych dróg tej samej długości, blisko siebie (przerwa tylko na awatar z nickiem), żeby wszystkie
 * prowadziły w szklankę (26.10, Łukasz: skrajne mijały ją z góry i z dołu). Trzy drogi zajmują 300 px, mniej niż
 * wysokość szklanki. Przy wielu graczach węższe, najwyżej na 560 px.
 */
export function drogi(n: number): Droga[] {
  const grubosc = Math.min(96, Math.floor(560 / Math.max(1, n)));
  const zakres = Math.min(560, (n - 1) * (grubosc + 54));
  return Array.from({ length: n }, (_, i) => {
    const y = SZKLANKA_FINALU.y - zakres / 2 + (n === 1 ? 0.5 : i / (n - 1)) * zakres;
    return { od: { x: START_X, y }, do: { x: KONIEC_X, y }, grubosc };
  });
}

/** Punkt na drodze: 0 na starcie, 1 przy szklance. */
export const punktNaDrodze = (d: Droga, p: number) => ({
  x: d.od.x + (d.do.x - d.od.x) * p,
  y: d.od.y + (d.do.y - d.od.y) * p,
});

/** Średnica awatara: im mniej dróg, tym grubsze i tym większy awatar. */
export const awatarNaDrogach = (lista: Droga[]) => Math.min(118, Math.max(56, lista[0]?.grubosc ?? 96) + 22);

export type GraczNaDrodze = {
  nick: string;
  zdjecie: string | null;
  /** Położenie 0..1 przed animacją i po niej. */
  przed: number;
  teraz: number;
  lider: boolean;
  podpis: React.ReactNode;
  /** Seria: ostatnia odpowiedź (awatar podskakuje na zielono albo trzęsie się na czerwono); `nr` restartuje animację. */
  ocena?: { dobrze: boolean; nr: number };
};

/**
 * Drogi z graczami; `szklanka` stoi po prawej, gdzie drogi się zbiegają. `nad`: warstwa nad graczami
 * w pikselach planszy (dymki okrzyków kibiców w serii).
 */
export function DrogiFinalu({
  gracze,
  szklanka,
  opoznienie = 0.8,
  trwanie = 2.4,
  nad,
}: {
  gracze: GraczNaDrodze[];
  szklanka: React.ReactNode;
  opoznienie?: number;
  trwanie?: number;
  nad?: React.ReactNode;
}) {
  const lista = drogi(gracze.length);
  const awatar = awatarNaDrogach(lista);

  return (
    <div className="drogi-finalu">
      <PlanszaDrog lista={lista} szklanka={szklanka} />

      {gracze.map((g, i) => {
        const d = lista[i];
        const a = punktNaDrodze(d, g.przed);
        const b = punktNaDrodze(d, g.teraz);
        return (
          <motion.div
            key={g.nick}
            className={`drogi-finalu-gracz${g.lider ? " lider" : ""}`}
            initial={{ left: a.x, top: a.y }}
            animate={{ left: b.x, top: b.y }}
            transition={{ delay: opoznienie + i * 0.12, duration: trwanie, ease: [0.22, 1, 0.36, 1] }}
          >
            {g.ocena ? (
              <div key={g.ocena.nr} className={`drogi-ocena ${g.ocena.dobrze ? "dobrze" : "zle"}`}>
                <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={awatar} />
              </div>
            ) : (
              <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={awatar} />
            )}
            <span className="drogi-finalu-podpis">{g.podpis}</span>
          </motion.div>
        );
      })}
      {nad}
    </div>
  );
}

/**
 * Same drogi i szklanka, bez graczy (pijany finał rysuje graczy sam, pijany.tsx).
 */
export function PlanszaDrog({ lista, szklanka }: { lista: Droga[]; szklanka: React.ReactNode }) {
  return (
    <>
      <svg className="drogi-finalu-svg" viewBox={`0 0 ${SZER} ${WYS}`} aria-hidden>
        <defs>
          {/* jedna grafika lady na całą planszę: drobne kafelki dawały widoczne szwy */}
          <pattern id="lada-drogi" patternUnits="userSpaceOnUse" width={SZER} height={1173}>
            <image href="/grafiki/lada.webp" width={SZER} height={1173} preserveAspectRatio="xMidYMid slice" />
          </pattern>
          <radialGradient id="poswiata-drogi">
            <stop offset="0" stopColor="#e3ac3f" stopOpacity="0.45" />
            <stop offset="1" stopColor="#e3ac3f" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx={SZKLANKA_FINALU.x} cy={SZKLANKA_FINALU.y + 150} rx={230} ry={70} fill="url(#poswiata-drogi)" />
        {lista.map((d, i) => (
          // --i i --obrot: kolejność i przechył przy odlocie po wybuchu (pijany finał, tv.css)
          <g
            key={i}
            className="drogi-finalu-pas"
            style={{ "--i": i, "--obrot": `${i % 2 ? 9 : -12}deg` } as React.CSSProperties}
          >
            <line
              x1={d.od.x}
              y1={d.od.y}
              x2={d.do.x}
              y2={d.do.y}
              className="drogi-finalu-brzeg"
              style={{ strokeWidth: d.grubosc + 14 }}
            />
            <line
              x1={d.od.x}
              y1={d.od.y}
              x2={d.do.x}
              y2={d.do.y}
              className="drogi-finalu-droga"
              style={{ strokeWidth: d.grubosc }}
            />
          </g>
        ))}
      </svg>

      <div className="drogi-finalu-szklanka">{szklanka}</div>
    </>
  );
}
