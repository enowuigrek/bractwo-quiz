"use client";

import { motion } from "motion/react";
import { Awatar } from "@/components/awatar";

// Plansza finału: równe drewniane drogi z lewej, które zbiegają się pod szklanką po prawej.
// Wspólna dla serii na żywo (seria.tsx) i rankingu po finale (wyscig.tsx). Piksele planszy 1760×780.

const SZER = 1760;
const WYS = 780;
/** Szklanka po prawej, na środku wysokości; drogi kończą się tuż przed nią. */
export const SZKLANKA_FINALU = { x: 1560, y: 430 };
const KONIEC_X = 1330;
const START_X = 130;

type Droga = { od: { x: number; y: number }; do: { x: number; y: number }; grubosc: number };

/** `n` dróg prawie równej długości: starty rozłożone na wysokości, końce blisko siebie przy szklance. */
function drogi(n: number): Droga[] {
  const grubosc = Math.min(96, Math.floor(560 / Math.max(1, n)));
  const zakresStart = Math.min(560, n * 190);
  const zakresKoniec = Math.min(260, n * 90);
  return Array.from({ length: n }, (_, i) => {
    const u = n === 1 ? 0.5 : i / (n - 1);
    return {
      od: { x: START_X, y: SZKLANKA_FINALU.y - zakresStart / 2 + u * zakresStart },
      do: { x: KONIEC_X, y: SZKLANKA_FINALU.y - zakresKoniec / 2 + u * zakresKoniec },
      grubosc,
    };
  });
}

export type GraczNaDrodze = {
  nick: string;
  zdjecie: string | null;
  /** Położenie 0..1 przed animacją i po niej. */
  przed: number;
  teraz: number;
  lider: boolean;
  podpis: React.ReactNode;
};

/** Drogi z graczami; `szklanka` stoi po prawej, gdzie drogi się zbiegają. */
export function DrogiFinalu({
  gracze,
  szklanka,
  opoznienie = 0.8,
  trwanie = 2.4,
}: {
  gracze: GraczNaDrodze[];
  szklanka: React.ReactNode;
  opoznienie?: number;
  trwanie?: number;
}) {
  const lista = drogi(gracze.length);
  const punkt = (d: Droga, p: number) => ({ x: d.od.x + (d.do.x - d.od.x) * p, y: d.od.y + (d.do.y - d.od.y) * p });
  const awatar = Math.min(118, Math.max(56, lista[0]?.grubosc ?? 96) + 22);

  return (
    <div className="drogi-finalu">
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
          <g key={i}>
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

      {gracze.map((g, i) => {
        const d = lista[i];
        const a = punkt(d, g.przed);
        const b = punkt(d, g.teraz);
        return (
          <motion.div
            key={g.nick}
            className={`drogi-finalu-gracz${g.lider ? " lider" : ""}`}
            initial={{ left: a.x, top: a.y }}
            animate={{ left: b.x, top: b.y }}
            transition={{ delay: opoznienie + i * 0.12, duration: trwanie, ease: [0.22, 1, 0.36, 1] }}
          >
            <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={awatar} />
            <span className="drogi-finalu-podpis">{g.podpis}</span>
          </motion.div>
        );
      })}
    </div>
  );
}
