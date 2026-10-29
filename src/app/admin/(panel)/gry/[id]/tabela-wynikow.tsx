import Link from "next/link";
import { sekundy } from "@/lib/czas";
import type { UsunietyGracz, WynikGracza } from "../wyniki";

/**
 * Tabela końcowa gry. Kliknięcie w wiersz otwiera historię odpowiedzi gracza. `liczbaPytan`: pytania etapów; finaliście
 * dochodzą jego pytania z finału (`wSerii`).
 */
export function TabelaWynikow({
  graId,
  wyniki,
  liczbaPytan,
  usunieci = [],
  lpPytania = (nr) => nr,
}: {
  graId: string;
  wyniki: WynikGracza[];
  liczbaPytan: number;
  /** Usunięci przez prowadzącego: na końcu tabeli, bez historii (28.10). */
  usunieci?: UsunietyGracz[];
  /** Numer pytania w grze (bez ciekawostek) z numeru zadania. */
  lpPytania?: (nr: number) => number;
}) {
  if (wyniki.length === 0) return <p className="lista-pusta">Nikt nie dołączył do tej gry.</p>;
  return (
    <table className="tabela-wynikow">
      <thead>
        <tr>
          <th scope="col">Miejsce</th>
          <th scope="col">Gracz</th>
          <th scope="col" className="liczba">
            Punkty
          </th>
          <th scope="col" className="liczba">
            Dobrze
          </th>
          <th scope="col" className="liczba na-szerokim">
            Śr. czas
          </th>
        </tr>
      </thead>
      <tbody>
        {wyniki.map((w) => (
          <tr key={w.id} className={w.miejsce === 1 ? "lider" : undefined}>
            <td className="tw-miejsce">{w.miejsce}.</td>
            <td className="nick">
              <Link href={`/admin/gry/${graId}/gracze/${w.id}`}>{w.nick}</Link>
              {w.odpadl && (
                <span className="tw-uwaga">
                  odpadł po etapie {w.odpadl.etap} „{w.odpadl.nazwa}” na {w.odpadl.miejsce}. miejscu
                </span>
              )}
            </td>
            <td className="liczba">{w.punkty.toLocaleString("pl-PL")}</td>
            <td className="liczba">
              {w.dobre}/{liczbaPytan + w.wSerii}
            </td>
            <td className="liczba na-szerokim">{w.sredniCzasMs !== null ? sekundy(w.sredniCzasMs) : "–"}</td>
          </tr>
        ))}
        {usunieci.map((u) => (
          <tr key={`usuniety-${u.nick}-${u.usunieto}`} className="usuniety">
            <td className="tw-miejsce">–</td>
            <td className="nick">
              {u.nick}
              <span className="tw-uwaga">
                usunięty przez prowadzącego
                {u.zadanie_nr ? ` przy pytaniu ${lpPytania(u.zadanie_nr)}` : ""}
                {u.miejsce ? ` (był na ${u.miejsce}. miejscu)` : ""}
              </span>
            </td>
            <td className="liczba">{u.punkty.toLocaleString("pl-PL")}</td>
            <td className="liczba">
              {u.dobre}/{u.odpowiedzi}
            </td>
            <td className="liczba na-szerokim">–</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
