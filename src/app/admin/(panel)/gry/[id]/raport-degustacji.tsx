/* eslint-disable @next/next/no-img-element -- etykiety piw z bucketu Supabase */
import {
  KLAROWNOSC,
  KOLORY,
  liczbaOcen,
  najczestsza,
  napisOceny,
  slowoSuwaka,
  wynikiSali,
  type KartaPiwa,
  type Licznik,
} from "@/lib/degustacja";
import { opisPiwa, type DanePiwo } from "@/lib/zadania";

export type PiwoRaportu = { id: string; tresc: string; grafika_url: string | null; dane: DanePiwo };

const slowa = (l: Licznik[], z: number) => l.map((s) => `${s.napis} ${s.ile}/${z}`).join(", ");

/**
 * Raport degustacji dla piwowara (02.11, docs/DEGUSTACJA.md): każde piwo z tym, co poczuła sala, anonimowo. Zamiast
 * tabeli wyników zwykłej gry (degustacja nie ma punktów). Notatki gości bez imion.
 */
export function RaportDegustacji({ piwa, karty }: { piwa: PiwoRaportu[]; karty: { zadanie_id: string; dane: KartaPiwa }[] }) {
  if (!piwa.length) return <p className="lista-pusta">Degustacja nie ma piw.</p>;
  return (
    <div className="stos">
      {piwa.map((p) => {
        const kartyPiwa = karty.filter((k) => k.zadanie_id === p.id).map((k) => k.dane);
        const w = wynikiSali(kartyPiwa);
        const notatki = kartyPiwa.map((k) => k.notatka?.trim()).filter((n): n is string => !!n);
        const dane: [string, string | null][] = [
          ["Ocena", w.srednia !== null ? `${napisOceny(w.srednia)} / 5 (${liczbaOcen(w.ocen)})` : null],
          ["Barwa", najczestsza(w.kolor, KOLORY.map((k) => k.napis))],
          ["Klarowność", najczestsza(w.klarownosc, KLAROWNOSC)],
          ["Wypiłoby jeszcze jedno", w.jeszcze.z ? `${w.jeszcze.tak} z ${w.jeszcze.z}` : null],
          ["Aromat", w.aromaty.length ? slowa(w.aromaty, w.kart) : null],
          ["Smak", w.smaki.length ? slowa(w.smaki, w.kart) : null],
          ...w.suwaki
            .filter((s) => s.ile > 0)
            .map((s): [string, string] => [s.nazwa, `${slowoSuwaka(s, s.srednia)} (średnio ${Math.round(s.srednia)}/100, ${s.ile} os.)`]),
          [
            "Wady",
            w.oWadach ? (w.wady.length ? slowa(w.wady, w.oWadach) : `bez wad (${w.bezWad} os.)`) : null,
          ],
        ];
        return (
          <section key={p.id} className="karta">
            <div className="profil-naglowek">
              {p.grafika_url && <img src={p.grafika_url} alt="" className="profil-logo" />}
              <div className="stos-ciasny">
                <h3>{p.tresc}</h3>
                {opisPiwa(p.dane) && <p className="lista-opis">{opisPiwa(p.dane)}</p>}
              </div>
            </div>
            {w.kart === 0 ? (
              <p className="lista-pusta">Nikt nie ocenił tego piwa.</p>
            ) : (
              <dl className="dane-gry">
                {dane
                  .filter(([, x]) => x)
                  .map(([nazwa, wartosc]) => (
                    <div key={nazwa}>
                      <dt>{nazwa}</dt>
                      <dd>{wartosc}</dd>
                    </div>
                  ))}
              </dl>
            )}
            {notatki.length > 0 && (
              <ul className="lista">
                {notatki.map((n, i) => (
                  <li key={i}>
                    <div className="lista-glowna">„{n}”</div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
