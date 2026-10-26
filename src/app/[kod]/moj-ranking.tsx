"use client";

import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { Awatar } from "@/components/awatar";
import type { WierszRankingu } from "@/lib/gra/typy";

/** Ilu graczy widać w wycinku tabeli na telefonie. */
const W_WYCINKU = 5;
/** Wysokość wiersza z odstępem (`.moj-ranking li`: 40 px + 4 px), do pół wiersza nad i pod wycinkiem. */
const WIERSZ_PX = 44;
/** Po tylu ms tabela przestawia się ze stanu sprzed pytania na bieżący (jak na TV). */
const PRZETASOWANIE_MS = 1600;

/**
 * Wycinek rankingu na telefonie (26.10): pięciu graczy z Tobą w środku, a blisko szczytu pierwsza piątka. Najpierw
 * kolejność sprzed pytania, po chwili wiersze przesuwają się na nowe miejsca, więc widać, kogo się wyprzedziło.
 */
export function MojRanking({ wiersze, nick }: { wiersze: WierszRankingu[]; nick: string }) {
  const [po, ustawPo] = useState(false);
  useEffect(() => {
    const zegar = setTimeout(() => ustawPo(true), PRZETASOWANIE_MS);
    return () => clearTimeout(zegar);
  }, []);

  const kolejnosc = [...wiersze].sort((a, b) =>
    po
      ? a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl")
      : a.poprzednie_miejsce - b.poprzednie_miejsce || a.nick.localeCompare(b.nick, "pl"),
  );
  const ja = kolejnosc.findIndex((w) => w.nick === nick);
  if (ja < 0 || kolejnosc.length < 2) return null;
  const od = Math.max(0, Math.min(ja - Math.floor(W_WYCINKU / 2), kolejnosc.length - W_WYCINKU));
  // po pół wiersza sąsiada nad i pod wycinkiem, wygaszone: lista ciągnie się dalej (26.10); u pierwszego nic nad nim
  const wyzej = od > 0;
  const nizej = od + W_WYCINKU < kolejnosc.length;
  const widoczni = kolejnosc.slice(wyzej ? od - 1 : od, od + W_WYCINKU + (nizej ? 1 : 0));
  const pelnych = Math.min(W_WYCINKU, kolejnosc.length);
  const okno = {
    height: pelnych * WIERSZ_PX - 4 + (wyzej ? WIERSZ_PX / 2 : 0) + (nizej ? WIERSZ_PX / 2 : 0),
  };

  return (
    <div className={`moj-ranking-okno${wyzej ? " wyzej" : ""}${nizej ? " nizej" : ""}`} style={okno}>
      <ol className="moj-ranking" aria-label="Ranking" style={wyzej ? { marginTop: -WIERSZ_PX / 2 } : undefined}>
        {widoczni.map((w) => (
          <motion.li
            key={w.nick}
            layout="position"
            transition={{ type: "spring", stiffness: 140, damping: 22 }}
            className={w.nick === nick ? "ja" : undefined}
          >
            <span className="moj-ranking-miejsce">{po ? w.miejsce : w.poprzednie_miejsce}.</span>
            <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={28} />
            <span className="moj-ranking-nick">{w.nick}</span>
            <span className="moj-ranking-punkty">{(po ? w.punkty : w.punkty - w.zdobyte).toLocaleString("pl-PL")}</span>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}
