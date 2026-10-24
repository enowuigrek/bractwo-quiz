"use client";

import { useState } from "react";
import { grafikaWyniku, udostepnij, type DaneWyniku } from "@/lib/grafika-wyniku";
import { BRACTWO_INSTAGRAM } from "@/lib/konta";

type Props = {
  wynik: DaneWyniku;
  /** Konta na Instagramie do oznaczenia (lokal, browar), bez @. */
  konta: (string | null | undefined)[];
};

/**
 * Po quizie: grafika z wynikiem „na pamiątkę” (jeden przycisk) i konta do oznaczenia. Przycisk otwiera systemowe
 * udostępnianie, bo tylko stamtąd iPhone zapisuje obraz do Zdjęć (zwykłe pobranie trafia do Plików); stamtąd też
 * od razu do relacji. Bez udostępniania w przeglądarce (komputer) po prostu pobiera plik. Strona nie może sama oznaczyć kont ani dodać relacji, więc nicki są do skopiowania.
 */
export function UdostepnijWynik({ wynik, konta }: Props) {
  const [trwa, ustawTrwa] = useState(false);
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const oznaczenia = [...new Set([BRACTWO_INSTAGRAM, ...konta].filter((k): k is string => !!k))].map((k) => `@${k}`);

  const tekstPosta = [`${wynik.miejsce}. miejsce w quizie ${wynik.tytul}!`, ...oznaczenia].join(" ");
  const nazwa = `quiz-${wynik.miejsce}-miejsce.png`;

  async function naPamiatke() {
    ustawTrwa(true);
    ustawKomunikat(null);
    try {
      const co = await udostepnij(await grafikaWyniku({ ...wynik, oznaczenia }), nazwa, tekstPosta);
      if (co === "pobrano") ustawKomunikat("Grafika pobrana na pamiątkę.");
    } catch (e) {
      ustawKomunikat((e as Error).message);
    }
    ustawTrwa(false);
  }

  async function kopiuj() {
    try {
      await navigator.clipboard.writeText(oznaczenia.join(" "));
      ustawKomunikat("Skopiowane. Wklej w relacji albo poście.");
    } catch {
      ustawKomunikat(oznaczenia.join(" "));
    }
  }

  return (
    <section className="udostepnij" aria-label="Wynik na pamiątkę">
      <div className="udostepnij-przyciski">
        <button type="button" className="przycisk zloty" disabled={trwa} onClick={() => void naPamiatke()}>
          {trwa ? "Przygotowuję…" : "Pobierz grafikę na pamiątkę"}
        </button>
      </div>
      {oznaczenia.length > 0 && (
        <p className="udostepnij-konta">
          Oznacz: <strong>{oznaczenia.join(" ")}</strong>{" "}
          <button type="button" className="przycisk-zdjecie" onClick={() => void kopiuj()}>
            Kopiuj
          </button>
        </p>
      )}
      {komunikat && (
        <p className="pomocniczy" role="status" style={{ margin: 0 }}>
          {komunikat}
        </p>
      )}
    </section>
  );
}
