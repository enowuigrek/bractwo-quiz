"use client";

import { useState } from "react";
import { grafikaPodium, udostepnij, type DanePodium } from "@/lib/grafika-wyniku";
import { BRACTWO_INSTAGRAM } from "@/lib/konta";

/**
 * Grafika z podium dla lokalu (relacja 1080×1920 jak grafika gracza): loga, tytuł, trójka na podium. Na komputerze pobiera plik,
 * na telefonie otwiera „Udostępnij” (stamtąd „Zapisz obraz” do Zdjęć). Obok konta do oznaczenia w opisie posta.
 */
export function GrafikaPodium({ dane, konta }: { dane: DanePodium; konta: (string | null)[] }) {
  const [trwa, ustawTrwa] = useState(false);
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const [blad, ustawBlad] = useState<string | null>(null);
  const oznaczenia = [...new Set([BRACTWO_INSTAGRAM, ...konta].filter((k): k is string => !!k))].map((k) => `@${k}`);

  async function pobierz() {
    ustawTrwa(true);
    ustawKomunikat(null);
    ustawBlad(null);
    try {
      const blob = await grafikaPodium({ ...dane, oznaczenia });
      const co = await udostepnij(blob, "podium-quizu.png", [`Zwycięzcy quizu ${dane.tytul}!`, ...oznaczenia].join(" "));
      if (co === "pobrano") ustawKomunikat("Pobrana: podium-quizu.png");
    } catch (e) {
      ustawBlad((e as Error).message);
    }
    ustawTrwa(false);
  }

  return (
    <div className="grafika-podium">
      <button type="button" className="przycisk-maly zloty" disabled={trwa} onClick={() => void pobierz()}>
        {trwa ? "Przygotowuję…" : "Pobierz grafikę podium"}
      </button>
      {oznaczenia.length > 0 && <span className="pomocniczy">Do oznaczenia: {oznaczenia.join(" ")}</span>}
      {komunikat && <span className="pomocniczy">{komunikat}</span>}
      {blad && <span className="blad">{blad}</span>}
    </div>
  );
}
