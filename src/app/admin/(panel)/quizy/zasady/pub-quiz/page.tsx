import type { Metadata } from "next";
import Link from "next/link";
import { wymagajAdmina } from "@/lib/admin";
import { IkonaPuchar } from "@/components/ikony";
import { oknoMs, przedzial } from "@/lib/gra/punktacja";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { RODZAJE, TabelaCzesciowych, WykresSzybkosci, pkt } from "../wspolne";

export const metadata: Metadata = { title: "Zasady pub quizu · Bractwo Quiz" };

/** Kolejność rodzajów na stronie (jak w edytorze pytań, bez ciekawostki). */
const KOLEJNOSC = ["wybor", "prawda_falsz", "wielokrotny", "szacowanie", "kolejnosc", "pary"] as const;

/**
 * Zasady „Pub quizu” (klasycznego, bez etapów, 28.10): przebieg i punktacja każdego rodzaju pytań. Bez mnożników,
 * odpadania i finału: każde pytanie waży tyle samo. Liczby z `src/lib/gra/punktacja.ts` (kopia punktacji z bazy).
 */
export default async function ZasadyPubQuizu() {
  await wymagajAdmina();
  return (
    <main className="zasady">
      <p className="okruchy">
        <Link href="/admin/quizy?rodzaj=klasyczny">← Quizy</Link>
      </p>
      <h1>Pub quiz: zasady i punktacja</h1>
      <p className="zasady-wstep">
        Klasyczny pub quiz: pytania po kolei, bez etapów, odpadania i finału. Każde pytanie waży tyle samo, a wygrywa
        ten, kto zbierze najwięcej punktów. Liczby na tej stronie liczą się z tych samych ustawień co gra.
      </p>

      <section className="panel-sekcja">
        <h2>Przebieg gry</h2>
        <ol className="zasady-droga">
          <li>
            <span className="zasady-droga-nr">0</span>
            <strong>Poczekalnia</strong>
            <span>QR na TV, gracze dołączają</span>
          </li>
          <li>
            <span className="zasady-droga-nr">10</span>
            <strong>Start</strong>
            <span>plansza startowa z zegarem 10 s</span>
          </li>
          <li>
            <span className="zasady-droga-nr">?</span>
            <strong>Pytania</strong>
            <span>po kolei, po każdym wynik i tabela</span>
          </li>
          <li>
            <span className="zasady-droga-nr">
              <IkonaPuchar />
            </span>
            <strong>Podium</strong>
            <span>nagrody dla najlepszych</span>
          </li>
        </ol>
        <p className="pomocniczy">
          Po każdym pytaniu TV pokazuje dobrą odpowiedź, kto jak odpowiedział i ranking jako tabelę. Na końcu podium i
          tabela na zmianę.
        </p>
      </section>

      <section className="panel-sekcja">
        <h2>Jak liczymy punkty</h2>
        <div className="zasady-dwa">
          <div>
            <p>
              Każda odpowiedź dostaje <strong>ocenę od 0 do 1</strong> (jaka część jest dobrze), a punkty to ocena ×
              punkty za szybkość. <strong>Bez mnożników</strong>: każde pytanie waży tyle samo.
            </p>
            <ul className="zasady-punkty">
              <li>
                <strong>Szybkość:</strong> od razu 1000 pkt, potem liniowo w dół do 200 pkt. Okno spadku to{" "}
                {oknoMs("wybor") / 1000} s przy jednej odpowiedzi, prawdzie/fałszu i szacowaniu, {oknoMs("pary") / 1000}{" "}
                s przy kilku dobrych, parach i kolejności. Później zostaje stałe 200 pkt.
              </li>
              <li>
                <strong>Z limitem czasu</strong> (ustawionym przy uruchamianiu gry) punkty spadają przez cały limit, a po
                nim nie da się już odpowiedzieć.
              </li>
              <li>
                <strong>Szacowanie</strong> jest wyjątkiem: szybkość waży tylko 10%, liczy się precyzja.
              </li>
              <li>
                <strong>Cały quiz:</strong> najwyżej 1000 pkt za pytanie, więc np. 20 pytań to do {pkt(20000)} pkt.
              </li>
            </ul>
          </div>
          <WykresSzybkosci />
        </div>
      </section>

      <section className="panel-sekcja">
        <h2>Rodzaje pytań</h2>
        <div className="zasady-etapy">
          {KOLEJNOSC.map((t) => {
            const [od, do_] = przedzial(t, 1, 1);
            return (
              <article key={t} className="zasady-etap">
                <header>
                  <h3>
                    <span className={`rodzaj-pytania ${t}`}>{NAZWY_TYPOW[t]}</span>
                  </h3>
                </header>
                <ul className="zasady-lista">
                  {RODZAJE[t].zasady.map((z) => (
                    <li key={z}>{z}</li>
                  ))}
                </ul>
                <table className="zasady-tabela">
                  <thead>
                    <tr>
                      <th>Dobra odpowiedź</th>
                      <th>najwolniej</th>
                      <th>najszybciej</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>za jedno pytanie</td>
                      <td>{pkt(od)}</td>
                      <td className="zloto">{pkt(do_)}</td>
                    </tr>
                  </tbody>
                </table>
                <TabelaCzesciowych typ={t} mnoznik={1} />
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel-sekcja">
        <h2>Koniec gry</h2>
        <ul className="zasady-lista">
          <li>Wygrywa najwięcej punktów. Gracze z równą liczbą punktów dzielą miejsce.</li>
          <li>Podium i nagrody według punktów; TV pokazuje na zmianę podium i całą tabelę.</li>
          <li>W pub quizie nie ma etapów, ciekawostek, odpadania, finału trójki ani pijanego finału.</li>
        </ul>
      </section>
    </main>
  );
}
