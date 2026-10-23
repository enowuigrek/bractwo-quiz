"use client";

import { useState } from "react";
import { grafikaPodium, udostepnij, type DanePodium } from "@/lib/grafika-wyniku";
import { BRACTWO_INSTAGRAM } from "@/lib/konta";

/**
 * Grafika z podium dla lokalu (post 1080×1350): loga, tytuł, pierwsza trójka. Na komputerze pobiera plik,
 * na telefonie otwiera „Udostępnij”. Obok konta do oznaczenia w opisie posta.
 */
export function GrafikaPodium({ dane, konta }: { dane: DanePodium; konta: (string | null)[] }) {
  const [trwa, ustawTrwa] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
  const oznaczenia = [...new Set([BRACTWO_INSTAGRAM, ...konta].filter((k): k is string => !!k))].map((k) => `@${k}`);

  async function pobierz() {
    ustawTrwa(true);
    ustawBlad(null);
    try {
      const blob = await grafikaPodium({ ...dane, oznaczenia });
      await udostepnij(blob, "podium-quizu.png", [`Zwycięzcy quizu ${dane.tytul}!`, ...oznaczenia].join(" "));
    } catch (e) {
      ustawBlad((e as Error).message);
    }
    ustawTrwa(false);
  }

  return (
    <div className="grafika-podium">
      <button type="button" className="przycisk-maly zloty" disabled={trwa} onClick={() => void pobierz()}>
        {trwa ? "Przygotowuję…" : "Grafika podium do social mediów"}
      </button>
      {oznaczenia.length > 0 && <span className="pomocniczy">Do oznaczenia: {oznaczenia.join(" ")}</span>}
      {blad && <span className="blad">{blad}</span>}
    </div>
  );
}
