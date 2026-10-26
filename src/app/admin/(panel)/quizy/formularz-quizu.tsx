"use client";

import { useActionState, useState } from "react";
import { SZABLONY_ETAPOW, SZABLONY_QUIZU, napisMnoznika } from "@/lib/etapy";
import type { RodzajQuizu } from "@/lib/tagi";
import type { StanFormularza } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { bezResetu } from "../_komponenty/bez-resetu";
import { KomunikatFormularza } from "../_komponenty/stan";
import { utworzQuiz } from "./akcje";
import { LIMITY, liczbaPytan } from "./limity";

/**
 * Nowy quiz: najpierw szablon, potem tytuł i opis. „Wyścig po piwo” ma stały zestaw konkurencji (kreator ich nie
 * zmienia), klasyczny pub quiz to same pytania bez etapów. Po utworzeniu przechodzi do edycji pytań.
 */
export function FormularzQuizu({ glowny, rodzaj }: { glowny: boolean; rodzaj: RodzajQuizu }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(utworzQuiz, {});
  // rodzaj z zakładki listy quizów (klucze szablonów to rodzaje)
  const [szablon, ustawSzablon] = useState<string>(rodzaj);
  const etapy = SZABLONY_QUIZU.find((s) => s.klucz === szablon)?.etapy ?? [];
  const razem = etapy.reduce((s, e) => s + e.pytania, 0);

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <fieldset>
        <legend>Rodzaj quizu</legend>
        <div className="szablony-quizu">
          {SZABLONY_QUIZU.map((s) => (
            <label key={s.klucz} className={`szablon-quizu${szablon === s.klucz ? " wybrany" : ""}`}>
              <input
                type="radio"
                name="szablon"
                value={s.klucz}
                checked={szablon === s.klucz}
                onChange={() => ustawSzablon(s.klucz)}
              />
              <strong>{s.nazwa}</strong>
              <span>{s.opis}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {etapy.length > 0 && (
        <fieldset>
          <legend>Etapy · razem {liczbaPytan(razem)}</legend>
          <ol className="lista etapy-szablonu">
            {etapy.map((e, i) => {
              const s = SZABLONY_ETAPOW.find((x) => x.klucz === e.szablon);
              if (!s) return null;
              return (
                <li key={e.szablon}>
                  <span className="krok-nr">{i + 1}.</span>
                  <div className="lista-glowna">
                    <div className="lista-tytul">{s.nazwa}</div>
                    <div className="lista-opis">
                      {s.typy.map((t) => NAZWY_TYPOW[t].toLowerCase()).join(", ")} · punkty {napisMnoznika(s.mnoznik)}
                      {s.czas_s ? ` · ${s.czas_s} s` : ""}
                      {s.finalowy ? " · finał trójki" : ""}
                    </div>
                  </div>
                  <span className="etapy-szablonu-liczba" aria-label="Liczba pytań">
                    {liczbaPytan(e.pytania)}
                  </span>
                </li>
              );
            })}
          </ol>
        </fieldset>
      )}

      <div>
        <label htmlFor="tytul">Tytuł</label>
        <input
          id="tytul"
          name="tytul"
          className="pole"
          placeholder="np. Portery i stouty"
          required
          maxLength={LIMITY.tytul}
        />
      </div>
      <div>
        <label htmlFor="opis">Opis (tylko dla obsługi)</label>
        <textarea id="opis" name="opis" className="pole" maxLength={LIMITY.opis} rows={2} />
      </div>
      <div>
        <label htmlFor="tagi">Tematy (po przecinku, do filtrowania)</label>
        <input id="tagi" name="tagi" className="pole" placeholder="np. filmy, lata 90." maxLength={200} />
      </div>
      {/* tylko główny: jego nowe quizy są domyślnie ukryte przed obsługą (zmiana później na stronie quizu) */}
      {glowny && (
        <label className="przelacznik">
          <input type="checkbox" name="tylko_glowny" defaultChecked /> tylko dla mnie (obsługa nie zobaczy tego quizu)
        </label>
      )}

      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Tworzę…" : "Utwórz quiz i dodaj pytania"}
      </button>
    </form>
  );
}
