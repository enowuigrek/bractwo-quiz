"use client";

import { useActionState, useState } from "react";
import { IkonaGotowe, IkonaKopiuj } from "@/components/ikony";
import { czytajPytania, PROMPT_PYTAN } from "@/lib/import-pytan";
import type { StanFormularza } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { skopiuj } from "../../gry/[id]/kopiuj";
import { wklejPytania } from "../akcje";
import { liczbaPytan } from "../limity";

/**
 * Klasyczny quiz: pytania wklejone hurtem (np. z czatu z AI według promptu pod polem). Podgląd czyta tekst na
 * bieżąco, a zapis sprawdza każde pytanie jak formularz pytania i dodaje wszystkie na koniec quizu.
 */
export function WklejPytania({ quizId }: { quizId: string }) {
  const [tekst, ustawTekst] = useState("");
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(async (poprzedni, dane) => {
    const wynik = await wklejPytania(quizId, poprzedni, dane);
    if (wynik.ok) ustawTekst("");
    return wynik;
  }, {});
  const [skopiowano, ustawSkopiowano] = useState(false);
  const { pytania, bledy } = czytajPytania(tekst);

  async function kopiujPrompt() {
    if (await skopiuj(PROMPT_PYTAN)) {
      ustawSkopiowano(true);
      setTimeout(() => ustawSkopiowano(false), 2000);
    }
  }

  return (
    <div className="wklej-pytania">
      <form action={akcja} className="formularz">
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

      <div className="wklej-prompt">
        <p className="pomocniczy" style={{ margin: 0 }}>
          <strong>Pytania z AI:</strong> skopiuj prompt, dopisz w nawiasach temat i liczbę pytań, wklej do czatu (Claude,
          ChatGPT…), a odpowiedź wklej w pole wyżej. Potem przejrzyj pytania i dodaj grafiki.
        </p>
        <textarea className="pole wklej-pole" readOnly rows={8} value={PROMPT_PYTAN} aria-label="Prompt dla AI" />
        <button type="button" className="przycisk" onClick={() => void kopiujPrompt()}>
          {skopiowano ? <IkonaGotowe /> : <IkonaKopiuj />} {skopiowano ? "Skopiowano" : "Kopiuj prompt"}
        </button>
      </div>
    </div>
  );
}
