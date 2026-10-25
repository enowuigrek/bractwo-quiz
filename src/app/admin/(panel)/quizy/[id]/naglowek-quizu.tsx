"use client";

import { startTransition, useActionState, useState } from "react";
import type { Quiz, StanFormularza } from "@/lib/typy";
import { IkonaEdytuj } from "@/components/ikony";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { zapiszQuiz } from "../akcje";
import { LIMITY } from "../limity";

/** Id formularza; przycisk „Zapisz quiz” na dole strony wysyła go z `wroc=1`. */
export const FORMULARZ_QUIZU = "quiz-naglowek";

/** Tytuł i opis quizu w nagłówku. Ołówek otwiera edycję w miejscu. */
export function NaglowekQuizu({ quiz }: { quiz: Quiz }) {
  const [edycja, ustawEdycje] = useState(false);
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(async (poprzedni, dane) => {
    const wynik = await zapiszQuiz(quiz.id, poprzedni, dane);
    if (wynik.ok) ustawEdycje(false);
    return wynik;
  }, {});

  return (
    <form
      id={FORMULARZ_QUIZU}
      className="quiz-naglowek"
      action={akcja}
      onSubmit={(e) => {
        // jak `bezResetu`, ale z wartością przycisku, który wysłał formularz (`wroc`)
        e.preventDefault();
        const dane = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
        startTransition(() => akcja(dane));
      }}
    >
      {edycja ? (
        <div className="karta formularz">
          <div>
            <label htmlFor="tytul">Tytuł</label>
            <input id="tytul" name="tytul" className="pole" defaultValue={quiz.tytul} required maxLength={LIMITY.tytul} autoFocus />
          </div>
          <div>
            <label htmlFor="opis">Opis (tylko dla obsługi)</label>
            <textarea id="opis" name="opis" className="pole" defaultValue={quiz.opis ?? ""} maxLength={LIMITY.opis} rows={2} />
          </div>
          <KomunikatFormularza stan={stan} />
          <div className="quiz-naglowek-przyciski">
            <button type="submit" className="przycisk-maly zloty" disabled={trwa}>
              {trwa ? "Zapisuję…" : "Zapisz"}
            </button>
            <button type="button" className="przycisk-maly" onClick={() => ustawEdycje(false)} disabled={trwa}>
              Anuluj
            </button>
          </div>
        </div>
      ) : (
        <>
          <input type="hidden" name="tytul" value={quiz.tytul} />
          <input type="hidden" name="opis" value={quiz.opis ?? ""} />
          <div className="quiz-naglowek-tytul">
            <h1>{quiz.tytul}</h1>
            <button
              type="button"
              className="przycisk-maly ikona"
              onClick={() => ustawEdycje(true)}
              aria-label="Edytuj tytuł i opis"
              data-podpis="Edytuj"
            >
              <IkonaEdytuj />
            </button>
          </div>
          {quiz.opis && <p className="pomocniczy quiz-naglowek-opis">{quiz.opis}</p>}
          {stan.blad && <KomunikatFormularza stan={stan} />}
        </>
      )}
    </form>
  );
}
