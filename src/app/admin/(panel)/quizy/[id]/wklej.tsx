"use client";

import { useActionState, useState } from "react";
import { IkonaGotowe, IkonaKopiuj } from "@/components/ikony";
import {
  czytajPytania,
  MAX_PYTAN_PROMPTU,
  POZIOMY_PROMPTU,
  promptPytan,
  RODZAJE_PROMPTU,
  type PoziomPromptu,
  type RodzajPromptu,
} from "@/lib/import-pytan";
import type { StanFormularza } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { skopiuj } from "../../gry/[id]/kopiuj";
import { wklejPytania } from "../akcje";
import { liczbaPytan } from "../limity";

/**
 * Klasyczny quiz: pytania hurtem z AI w dwóch krokach. Krótki formularz (temat, liczba, rodzaje, poziom) składa
 * gotowy prompt do skopiowania, a odpowiedź AI wkleja się w pole niżej. Podgląd czyta tekst na bieżąco, a zapis
 * sprawdza każde pytanie jak formularz pytania i dodaje wszystkie na koniec quizu.
 */
export function WklejPytania({ quizId, temat: domyslnyTemat }: { quizId: string; temat: string }) {
  const [tekst, ustawTekst] = useState("");
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(async (poprzedni, dane) => {
    const wynik = await wklejPytania(quizId, poprzedni, dane);
    if (wynik.ok) ustawTekst("");
    return wynik;
  }, {});
  const [skopiowano, ustawSkopiowano] = useState(false);
  const { pytania, bledy } = czytajPytania(tekst);

  // formularz promptu: temat domyślnie z tytułu quizu
  const [temat, ustawTemat] = useState(domyslnyTemat);
  const [liczba, ustawLiczbe] = useState(30);
  const [rodzaje, ustawRodzaje] = useState<RodzajPromptu[]>(["jedna", "kilka", "liczba", "pary"]);
  const [poziom, ustawPoziom] = useState<PoziomPromptu>("mieszany");
  const [uwagi, ustawUwagi] = useState("");
  const prompt = promptPytan({ temat, liczba, rodzaje, poziom, uwagi });
  // kolejność rodzajów w prompcie zawsze jak w `RODZAJE_PROMPTU`
  const przelaczRodzaj = (r: RodzajPromptu) =>
    ustawRodzaje((l) =>
      l.includes(r)
        ? l.filter((x) => x !== r)
        : (Object.keys(RODZAJE_PROMPTU) as RodzajPromptu[]).filter((x) => x === r || l.includes(x)),
    );

  async function kopiujPrompt() {
    if (await skopiuj(prompt)) {
      ustawSkopiowano(true);
      setTimeout(() => ustawSkopiowano(false), 2000);
    }
  }

  return (
    <div className="wklej-pytania">
      <div className="formularz wklej-prompt">
        <h3 className="wklej-krok">
          <span className="krok-nr">1</span> Prompt dla AI
        </h3>
        <div>
          <label htmlFor="prompt-temat">Temat</label>
          <input
            id="prompt-temat"
            className="pole"
            value={temat}
            onChange={(e) => ustawTemat(e.target.value)}
            placeholder="np. filmy z lat 90."
            maxLength={200}
          />
        </div>
        <div className="wiersz-pol">
          <div>
            <label htmlFor="prompt-liczba">Liczba pytań</label>
            <input
              id="prompt-liczba"
              type="number"
              inputMode="numeric"
              className="pole"
              min={5}
              max={MAX_PYTAN_PROMPTU}
              value={liczba}
              onChange={(e) => ustawLiczbe(Math.min(MAX_PYTAN_PROMPTU, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
        </div>
        <fieldset>
          <legend>Rodzaje pytań</legend>
          <div className="wybor-czasu">
            {(Object.keys(RODZAJE_PROMPTU) as RodzajPromptu[]).map((r) => (
              <label key={r} className={`wybor-czasu-opcja${rodzaje.includes(r) ? " wybrana" : ""}`}>
                <input type="checkbox" checked={rodzaje.includes(r)} onChange={() => przelaczRodzaj(r)} />
                {RODZAJE_PROMPTU[r].nazwa}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>Poziom</legend>
          <div className="wybor-czasu">
            {(Object.keys(POZIOMY_PROMPTU) as PoziomPromptu[]).map((p) => (
              <label key={p} className={`wybor-czasu-opcja${poziom === p ? " wybrana" : ""}`}>
                <input type="radio" name="prompt-poziom" checked={poziom === p} onChange={() => ustawPoziom(p)} />
                {POZIOMY_PROMPTU[p].nazwa}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="prompt-uwagi">Dodatkowo (opcjonalnie)</label>
          <input
            id="prompt-uwagi"
            className="pole"
            value={uwagi}
            onChange={(e) => ustawUwagi(e.target.value)}
            placeholder="np. tylko polskie filmy, bez pytań o Marvela"
            maxLength={300}
          />
        </div>
        <button type="button" className="przycisk zloty" onClick={() => void kopiujPrompt()} disabled={!rodzaje.length}>
          {skopiowano ? <IkonaGotowe /> : <IkonaKopiuj />} {skopiowano ? "Skopiowano" : "Kopiuj prompt"}
        </button>
        <p className="pomocniczy" style={{ margin: 0 }}>
          Wklej go do czatu z AI (Claude, ChatGPT…), a odpowiedź wklej w kroku 2.
        </p>
        <details className="wklej-podglad-promptu">
          <summary>Podgląd promptu</summary>
          <textarea className="pole wklej-pole" readOnly rows={10} value={prompt} aria-label="Prompt dla AI" />
        </details>
      </div>

      <form action={akcja} className="formularz">
        <h3 className="wklej-krok">
          <span className="krok-nr">2</span> Odpowiedź AI
        </h3>
        <div>
          <label htmlFor="wklej-tekst">Wklej pytania</label>
          <textarea
            id="wklej-tekst"
            name="tekst"
            className="pole wklej-pole"
            rows={10}
            value={tekst}
            onChange={(e) => ustawTekst(e.target.value)}
            placeholder={"[jedna] Z jakiego kraju pochodzi styl pils?\n- Niemcy\n+ Czechy\n- Austria\n- Belgia"}
          />
        </div>

        {tekst.trim() && (
          <div className="wklej-podglad">
            {bledy.map((b) => (
              <p key={b} className="blad" role="alert" style={{ margin: 0 }}>
                {b}
              </p>
            ))}
            {pytania.length > 0 && (
              <ol className="lista">
                {pytania.map((p, i) => (
                  <li key={i}>
                    <div className="lista-glowna">
                      <div className="lista-tytul">{p.tresc}</div>
                      <div className="lista-opis">
                        {NAZWY_TYPOW[p.typ]} · {p.opis}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        <KomunikatFormularza stan={stan} />
        <button type="submit" className="przycisk zloty" disabled={trwa || !pytania.length || bledy.length > 0}>
          {trwa
            ? "Dodaję…"
            : pytania.length && !bledy.length
              ? `Dodaj ${liczbaPytan(pytania.length)}`
              : bledy.length
                ? "Popraw błędy, żeby dodać"
                : "Dodaj pytania"}
        </button>
      </form>
    </div>
  );
}
