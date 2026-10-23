"use client";
/* eslint-disable @next/next/no-img-element -- grafika szklanki z /public/grafiki */

import { useEffect, useState } from "react";

import { POD_PIANA, poziom } from "@/lib/gra/szklanka";

function pytan(n: number): string {
  if (n === 1) return "pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań";
}

/**
 * Wyścig po piwo na telefonie (ranking, gdy TV pokazuje wyścig): duża szklanka na środku, która dolewa
 * się po pytaniu tak jak na TV. Najpierw stan sprzed pytania, po chwili piwo rośnie z pianą na wierzchu.
 */
export function MojWyscig({ lp, n }: { lp: number; n: number }) {
  const [nalewa, ustawNalewa] = useState(false);
  useEffect(() => {
    const zegar = setTimeout(() => ustawNalewa(true), 500);
    return () => clearTimeout(zegar);
  }, []);
  const cz = n ? Math.min(1, (nalewa ? lp : lp - 1) / n) : 0;
  const zostalo = Math.max(0, n - lp);

  return (
    <section className="moj-wyscig" aria-label="Wyścig po piwo">
      <div className="moj-wyscig-szklanka" aria-hidden>
        <img
          src="/grafiki/szklanka.webp"
          alt=""
          className="moj-wyscig-pusta"
          style={{ clipPath: `inset(${POD_PIANA - 3}% 0 0 0)` }}
        />
        <img
          src="/grafiki/szklanka.webp"
          alt=""
          className="moj-wyscig-pelna"
          style={{ clipPath: `inset(${poziom(cz)}% 0 0 0)` }}
        />
        {cz > 0 && cz < 1 && <span className="moj-wyscig-piana" style={{ top: `${poziom(cz)}%` }} />}
      </div>
      <p className="moj-wyscig-opis">
        {zostalo ? (
          <>
            Wyścig po piwo: jeszcze <strong>{zostalo}</strong> {pytan(zostalo)}
          </>
        ) : (
          "Nalane! Koniec wyścigu."
        )}
      </p>
    </section>
  );
}
