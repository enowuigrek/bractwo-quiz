"use client";
/* eslint-disable @next/next/no-img-element -- grafika szklanki z /public/grafiki */

import { useEffect, useState } from "react";
import { Awatar } from "@/components/awatar";
import { naTrasie } from "@/lib/gra/wyscig";
import type { WierszRankingu } from "@/lib/gra/typy";

/** Poziom piwa w grafice szklanki (procent wysokości od góry): jak `GORA` i `DNO` w ekran/_ekran/wyscig.tsx. */
const GORA = 1;
const DNO = 92;
const POD_PIANA = 24;
const poziom = (cz: number) => DNO - (DNO - GORA) * cz;

/**
 * Wyścig po piwo na telefonie (w rankingu, gdy TV pokazuje wyścig): własny tor z awatarem i mała szklanka.
 * Najpierw stan sprzed pytania, po chwili awatar jedzie i piwo dolewa się, tak samo jak na TV.
 */
export function MojWyscig({
  ja,
  ranking,
  lp,
  n,
}: {
  ja: WierszRankingu;
  ranking: WierszRankingu[];
  lp: number;
  n: number;
}) {
  const [ruszyl, ustawRuszyl] = useState(false);
  useEffect(() => {
    const zegar = setTimeout(() => ustawRuszyl(true), 500);
    return () => clearTimeout(zegar);
  }, []);

  const lider = Math.max(0, ...ranking.map((w) => w.punkty));
  const liderPrzed = Math.max(0, ...ranking.map((w) => w.punkty - w.zdobyte));
  const gdzie = ruszyl ? naTrasie(ja.punkty, lider, lp, n) : naTrasie(ja.punkty - ja.zdobyte, liderPrzed, lp - 1, n);
  const nalane = n ? (ruszyl ? lp : lp - 1) / n : 0;

  return (
    <section className="moj-wyscig" aria-label="Twój wyścig po piwo">
      <div className="moj-wyscig-tor">
        <div className="moj-wyscig-trasa">
          <span className="moj-wyscig-slad" style={{ width: `${gdzie * 100}%` }} />
          <span className="moj-wyscig-jezdziec" style={{ left: `${gdzie * 100}%` }}>
            <Awatar nick={ja.nick} zdjecie={ja.zdjecie} rozmiar={44} />
          </span>
        </div>
      </div>
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
          style={{ clipPath: `inset(${poziom(nalane)}% 0 0 0)` }}
        />
      </div>
      <p className="moj-wyscig-opis">
        {lp >= n ? "Szklanka pełna, koniec wyścigu!" : `Piwo nalane w ${Math.round((lp / Math.max(1, n)) * 100)}%`}
      </p>
    </section>
  );
}
