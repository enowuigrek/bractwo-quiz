import Link from "next/link";
import { NAZWY_RODZAJOW, type RodzajQuizu } from "@/lib/tagi";

/**
 * Wspólne klocki list „Quizy” i „Rozgrywki” (29.10): obie strony mają ten sam układ (nagłówek, zakładki rodzaju,
 * filtry „Kto” i „Temat”), żeby przy przełączaniu nic nie skakało. „Kto” to `FiltrLokali` z `lokale-autorzy.tsx`.
 */

/** Zakładki „Wyścig po piwo / Pub quiz” (równe opcje `.wybor-czasu`, na telefonie na całą szerokość). */
export function ZakladkiRodzaju({ rodzaj, adres }: { rodzaj: RodzajQuizu; adres: (r: RodzajQuizu) => string }) {
  return (
    <nav className="wybor-czasu quizy-rodzaje" aria-label="Rodzaj quizu">
      {(["wyscig", "klasyczny"] as const).map((r) => (
        <Link
          key={r}
          href={adres(r)}
          className={`wybor-czasu-opcja${rodzaj === r ? " wybrana" : ""}`}
          aria-current={rodzaj === r ? "page" : undefined}
        >
          {NAZWY_RODZAJOW[r]}
        </Link>
      ))}
    </nav>
  );
}

/** Rząd filtra „Temat” z „wszystkie” na początku; bez tematów nic nie rysuje. */
export function FiltrTematow({
  tagi,
  wybrany,
  adres,
}: {
  tagi: string[];
  wybrany: string | null;
  adres: (tag: string | null) => string;
}) {
  if (tagi.length === 0) return null;
  return (
    <div className="filtr-wiersz">
      <span className="filtr-etykieta">Temat</span>
      <p className="tagi" aria-label="Temat">
        <Link href={adres(null)} className={`tag${wybrany ? "" : " wybrany"}`}>
          wszystkie
        </Link>
        {tagi.map((t) => (
          <Link key={t} href={adres(t)} className={`tag${wybrany === t ? " wybrany" : ""}`}>
            {t}
          </Link>
        ))}
      </p>
    </div>
  );
}
