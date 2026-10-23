"use client";

import { useState } from "react";
import { grafikaWyniku, pobierz, udostepnij, type DaneWyniku } from "@/lib/grafika-wyniku";
import { BRACTWO_INSTAGRAM } from "@/lib/konta";

type Props = {
  wynik: DaneWyniku;
  /** Konta na Instagramie do oznaczenia (lokal, browar), bez @. */
  konta: (string | null | undefined)[];
};

/**
 * Po quizie: gotowa grafika z wynikiem do relacji (systemowe „Udostępnij” na telefonie, na komputerze pobranie),
 * obok ta sama grafika „na pamiątkę” prosto do pobrania, i konta do oznaczenia. Strona nie może sama oznaczyć kont ani dodać relacji, więc nicki są do skopiowania.
 */
export function UdostepnijWynik({ wynik, konta }: Props) {
  const [trwa, ustawTrwa] = useState<false | "dziel" | "pobierz">(false);
  const [komunikat, ustawKomunikat] = useState<string | null>(null);
  const oznaczenia = [...new Set([BRACTWO_INSTAGRAM, ...konta].filter((k): k is string => !!k))].map((k) => `@${k}`);
  const tekstPosta = [`${wynik.miejsce}. miejsce w quizie ${wynik.tytul}!`, ...oznaczenia].join(" ");

  const nazwa = `quiz-${wynik.miejsce}-miejsce.png`;

  async function dziel() {
    ustawTrwa("dziel");
    ustawKomunikat(null);
    try {
      const blob = await grafikaWyniku({ ...wynik, oznaczenia });
      const co = await udostepnij(blob, nazwa, tekstPosta);
      if (co === "pobrano") ustawKomunikat("Grafika pobrana. Dodaj ją do relacji albo posta.");
    } catch (e) {
      ustawKomunikat((e as Error).message);
    }
    ustawTrwa(false);
  }

  async function naPamiatke() {
    ustawTrwa("pobierz");
    ustawKomunikat(null);
    try {
      pobierz(await grafikaWyniku({ ...wynik, oznaczenia }), nazwa);
      ustawKomunikat("Grafika pobrana na pamiątkę.");
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
    <section className="udostepnij" aria-label="Udostępnij wynik">
      <div className="udostepnij-przyciski">
        <button type="button" className="przycisk zloty" disabled={!!trwa} onClick={() => void dziel()}>
          {trwa === "dziel" ? "Przygotowuję…" : "Udostępnij wynik"}
        </button>
        <button type="button" className="przycisk" disabled={!!trwa} onClick={() => void naPamiatke()}>
          {trwa === "pobierz" ? "Przygotowuję…" : "Pobierz na pamiątkę"}
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
