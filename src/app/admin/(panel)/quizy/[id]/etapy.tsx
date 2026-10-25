"use client";

import { useActionState, useState } from "react";
import {
  CZASY_ETAPU,
  LIMITY_ETAPU,
  MAX_PLAN_PYTAN,
  MNOZNIKI,
  napisMnoznika,
  SZABLONY_ETAPOW,
  typDomyslny,
} from "@/lib/etapy";
import type { Etap, StanFormularza } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { IkonaEdytuj } from "@/components/ikony";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { dodajEtap, zapiszEtap } from "../akcje";

type Pola = Pick<Etap, "nazwa" | "opis" | "mnoznik" | "czas_s" | "finalowy" | "seria" | "plan_pytan" | "typ_domyslny">;

const PUSTY: Pola = {
  nazwa: "",
  opis: "",
  mnoznik: 1,
  czas_s: null,
  finalowy: false,
  seria: false,
  plan_pytan: null,
  typ_domyslny: null,
};

/** Formularz etapu: nowy (z szablonem) albo edycja istniejącego. */
function FormularzEtapu({
  quizId,
  etap,
  onGotowe,
  onAnuluj,
}: {
  quizId: string;
  etap?: Etap;
  onGotowe: () => void;
  onAnuluj?: () => void;
}) {
  const [pola, ustawPola] = useState<Pola>(etap ?? PUSTY);
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(async (poprzedni, dane) => {
    const wynik = etap ? await zapiszEtap(quizId, etap.id, poprzedni, dane) : await dodajEtap(quizId, poprzedni, dane);
    if (wynik.ok) {
      if (!etap) ustawPola(PUSTY);
      onGotowe();
    }
    return wynik;
  }, {});
  const zmien = (zmiana: Partial<Pola>) => ustawPola((p) => ({ ...p, ...zmiana }));
  const id = etap?.id ?? "nowy";

  return (
    <form {...bezResetu(akcja)} className="karta formularz etap-formularz">
      <input type="hidden" name="typ_domyslny" value={pola.typ_domyslny ?? ""} />
      {!etap && (
        <div>
          <span className="etykieta-pola">Szablon (wypełnia pola, potem możesz wszystko zmienić)</span>
          <div className="wybor-czasu">
            {SZABLONY_ETAPOW.map((s) => (
              <button
                key={s.klucz}
                type="button"
                className={`wybor-czasu-opcja${pola.nazwa === s.nazwa ? " wybrana" : ""}`}
                title={`Pasuje: ${s.typy.map((t) => NAZWY_TYPOW[t].toLowerCase()).join(", ")}`}
                onClick={() =>
                  zmien({
                    nazwa: s.nazwa,
                    opis: s.opis,
                    mnoznik: s.mnoznik,
                    czas_s: s.czas_s,
                    finalowy: s.finalowy,
                    seria: s.seria,
                    typ_domyslny: typDomyslny(s),
                    plan_pytan: pola.plan_pytan ?? 3,
                  })
                }
              >
                {s.nazwa}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <label htmlFor={`nazwa-${id}`}>Nazwa etapu</label>
        <input
          id={`nazwa-${id}`}
          name="nazwa"
          className="pole"
          value={pola.nazwa}
          onChange={(e) => zmien({ nazwa: e.target.value })}
          required
          maxLength={LIMITY_ETAPU.nazwa}
          placeholder="np. Rozgrzewka"
        />
      </div>
      <div>
        <label htmlFor={`opis-${id}`}>Zasady na planszy etapu (jedno, dwa zdania)</label>
        <textarea
          id={`opis-${id}`}
          name="opis"
          className="pole"
          value={pola.opis ?? ""}
          onChange={(e) => zmien({ opis: e.target.value })}
          maxLength={LIMITY_ETAPU.opis}
          rows={2}
        />
      </div>
      <fieldset>
        <legend>Punkty</legend>
        <div className="wybor-czasu">
          {MNOZNIKI.map((m) => (
            <label key={m} className={`wybor-czasu-opcja${pola.mnoznik === m ? " wybrana" : ""}`}>
              <input
                type="radio"
                name="mnoznik"
                value={m}
                checked={pola.mnoznik === m}
                onChange={() => zmien({ mnoznik: m })}
              />
              {napisMnoznika(m)}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Czas na odpowiedź</legend>
        <div className="wybor-czasu">
          {CZASY_ETAPU.map((c) => (
            <label key={c ?? "gra"} className={`wybor-czasu-opcja${pola.czas_s === c ? " wybrana" : ""}`}>
              <input
                type="radio"
                name="czas_s"
                value={c ?? ""}
                checked={pola.czas_s === c}
                onChange={() => zmien({ czas_s: c })}
              />
              {c === null ? (pola.seria ? "60 s (seria)" : "jak w grze") : `${c} s`}
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor={`plan-${id}`}>Ile pytań ma mieć etap (opcjonalnie)</label>
        <input
          id={`plan-${id}`}
          name="plan_pytan"
          type="number"
          className="pole pole-waskie"
          min={1}
          max={MAX_PLAN_PYTAN}
          value={pola.plan_pytan ?? ""}
          onChange={(e) => zmien({ plan_pytan: e.target.value ? Number(e.target.value) : null })}
        />
      </div>
      <label className="pole-wyboru">
        <input
          type="checkbox"
          name="seria"
          value="1"
          checked={pola.seria}
          onChange={(e) => zmien({ seria: e.target.checked })}
        />
        <span>
          <strong>Seria:</strong> wszystkie pytania etapu naraz, każdy odpowiada we własnym tempie, bez wyniku po każdym
          pytaniu. Czas wyżej to czas na całą serię (puste: 60 s). TV pokazuje na żywo, kto jest bliżej piwa.
        </span>
      </label>
      <label className="pole-wyboru">
        <input
          type="checkbox"
          name="finalowy"
          value="1"
          checked={pola.finalowy}
          onChange={(e) => zmien({ finalowy: e.target.checked })}
        />
        <span>
          <strong>Finał trójki:</strong> odpowiadają tylko trzej najlepsi, reszta kibicuje. Najlepiej jako ostatni etap.
        </span>
      </label>
      <KomunikatFormularza stan={stan} />
      <div className="quiz-naglowek-przyciski">
        <button type="submit" className="przycisk-maly zloty" disabled={trwa}>
          {trwa ? "Zapisuję…" : etap ? "Zapisz etap" : "Dodaj etap"}
        </button>
        {onAnuluj && (
          <button type="button" className="przycisk-maly" onClick={onAnuluj} disabled={trwa}>
            Anuluj
          </button>
        )}
      </div>
    </form>
  );
}

/** „+ Dodaj etap” pod listą pytań quizu z etapami: rozwija formularz z szablonami. */
export function NowyEtap({ quizId }: { quizId: string }) {
  const [otwarty, ustawOtwarty] = useState(false);
  if (!otwarty) {
    return (
      <button type="button" className="przycisk" onClick={() => ustawOtwarty(true)}>
        + Dodaj etap
      </button>
    );
  }
  return <FormularzEtapu quizId={quizId} onGotowe={() => ustawOtwarty(false)} onAnuluj={() => ustawOtwarty(false)} />;
}

/** Nagłówek etapu nad jego pytaniami: nazwa, mnożnik, czas, finał; ołówek otwiera edycję w miejscu. */
export function NaglowekEtapu({
  quizId,
  etap,
  akcje,
  pytan,
  plan,
}: {
  quizId: string;
  etap: Etap;
  akcje: React.ReactNode;
  /** Ile pytań etap ma teraz. */
  pytan: number;
  /** −/+ planowanej liczby pytań (formularze z akcjami serwera). */
  plan: React.ReactNode;
}) {
  const [edycja, ustawEdycje] = useState(false);
  if (edycja) {
    return (
      <FormularzEtapu
        quizId={quizId}
        etap={etap}
        onGotowe={() => ustawEdycje(false)}
        onAnuluj={() => ustawEdycje(false)}
      />
    );
  }
  return (
    <div className="etap-naglowek">
      <div className="lista-glowna">
        <h3 className="etap-tytul">
          <span className="etap-nr">Etap {etap.nr}</span> {etap.nazwa}
        </h3>
        <p className="etap-znaczki">
          <span className="znaczek aktywny">punkty {napisMnoznika(etap.mnoznik)}</span>
          <span className="znaczek">
            {etap.seria ? `${etap.czas_s ?? 60} s na serię` : etap.czas_s ? `${etap.czas_s} s` : "czas jak w grze"}
          </span>
          {etap.finalowy && <span className="znaczek aktywny">finał trójki</span>}
          {etap.seria && <span className="znaczek aktywny">seria</span>}
          <span className={`znaczek${etap.plan_pytan && pytan >= etap.plan_pytan ? " aktywny" : ""}`}>
            pytania {pytan}
            {etap.plan_pytan ? ` z ${etap.plan_pytan}` : ""}
          </span>
          {plan}
        </p>
        {etap.opis && <p className="lista-opis">{etap.opis}</p>}
      </div>
      <div className="lista-akcje">
        <button
          type="button"
          className="przycisk-maly ikona"
          onClick={() => ustawEdycje(true)}
          aria-label={`Edytuj etap ${etap.nr}`}
          data-podpis="Edytuj"
        >
          <IkonaEdytuj />
        </button>
        {akcje}
      </div>
    </div>
  );
}
