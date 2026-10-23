"use client";

import { useActionState, useState } from "react";
import { MAX_ETAPOW, MAX_PLAN_PYTAN, SZABLONY_ETAPOW, SZABLONY_QUIZU, napisMnoznika } from "@/lib/etapy";
import type { StanFormularza } from "@/lib/typy";
import { NAZWY_TYPOW } from "@/lib/zadania";
import { bezResetu } from "../_komponenty/bez-resetu";
import { KomunikatFormularza } from "../_komponenty/stan";
import { utworzQuiz } from "./akcje";
import { LIMITY, liczbaPytan } from "./limity";

type EtapSzablonu = { szablon: string; pytania: number };

/**
 * Nowy quiz: tytuł, opis i szablon z etapami. Etapy i liczbę pytań w każdym można zmienić przed
 * utworzeniem (i potem na stronie quizu). Po utworzeniu przechodzi do edycji pytań.
 */
export function FormularzQuizu({ glowny }: { glowny: boolean }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(utworzQuiz, {});
  const [szablon, ustawSzablon] = useState(SZABLONY_QUIZU[0].klucz);
  const [etapy, ustawEtapy] = useState<EtapSzablonu[]>(SZABLONY_QUIZU[0].etapy);
  const [doDodania, ustawDoDodania] = useState(SZABLONY_ETAPOW[0].klucz);
  const razem = etapy.reduce((s, e) => s + e.pytania, 0);

  function wybierz(klucz: string) {
    ustawSzablon(klucz);
    ustawEtapy(SZABLONY_QUIZU.find((s) => s.klucz === klucz)?.etapy ?? []);
  }
  const zmien = (i: number, o: number) =>
    ustawEtapy((l) =>
      l.map((e, j) => (j === i ? { ...e, pytania: Math.min(MAX_PLAN_PYTAN, Math.max(1, e.pytania + o)) } : e)),
    );
  const przesun = (i: number, o: -1 | 1) =>
    ustawEtapy((l) => {
      const j = i + o;
      if (j < 0 || j >= l.length) return l;
      const nowe = [...l];
      [nowe[i], nowe[j]] = [nowe[j], nowe[i]];
      return nowe;
    });

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <input type="hidden" name="etapy" value={JSON.stringify(etapy)} />
      <div>
        <label htmlFor="tytul">Tytuł</label>
        <input
          id="tytul"
          name="tytul"
          className="pole"
          placeholder="np. Portery i stouty"
          required
          maxLength={LIMITY.tytul}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="opis">Opis (tylko dla obsługi)</label>
        <textarea id="opis" name="opis" className="pole" maxLength={LIMITY.opis} rows={2} />
      </div>
      {/* tylko główny: jego nowe quizy są domyślnie ukryte przed obsługą (zmiana później na stronie quizu) */}
      {glowny && (
        <label className="przelacznik">
          <input type="checkbox" name="tylko_glowny" defaultChecked /> tylko dla mnie (obsługa nie zobaczy tego quizu)
        </label>
      )}

      <fieldset>
        <legend>Szablon</legend>
        <div className="szablony-quizu">
          {SZABLONY_QUIZU.map((s) => (
            <label key={s.klucz} className={`szablon-quizu${szablon === s.klucz ? " wybrany" : ""}`}>
              <input type="radio" name="szablon" checked={szablon === s.klucz} onChange={() => wybierz(s.klucz)} />
              <strong>{s.nazwa}</strong>
              <span>{s.opis}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {etapy.length > 0 && (
        <fieldset>
          <legend>Etapy · razem {liczbaPytan(razem)} (zmienisz to też później)</legend>
          <ol className="lista etapy-szablonu">
            {etapy.map((e, i) => {
              const s = SZABLONY_ETAPOW.find((x) => x.klucz === e.szablon);
              if (!s) return null;
              return (
                <li key={`${e.szablon}-${i}`}>
                  <span className="krok-nr">{i + 1}.</span>
                  <div className="lista-glowna">
                    <div className="lista-tytul">{s.nazwa}</div>
                    <div className="lista-opis">
                      {s.typy.map((t) => NAZWY_TYPOW[t].toLowerCase()).join(", ")} · punkty {napisMnoznika(s.mnoznik)}
                      {s.czas_s ? ` · ${s.czas_s} s` : ""}
                      {s.finalowy ? " · finał trójki" : ""}
                    </div>
                  </div>
                  <div className="lista-akcje etapy-szablonu-akcje">
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => zmien(i, -1)}
                      disabled={e.pytania <= 1}
                      aria-label={`Mniej pytań w etapie ${s.nazwa}`}
                    >
                      −
                    </button>
                    <span className="etapy-szablonu-liczba" aria-label="Liczba pytań">
                      {e.pytania}
                    </span>
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => zmien(i, 1)}
                      disabled={e.pytania >= MAX_PLAN_PYTAN}
                      aria-label={`Więcej pytań w etapie ${s.nazwa}`}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => przesun(i, -1)}
                      disabled={i === 0}
                      aria-label={`Przesuń etap ${s.nazwa} wyżej`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => przesun(i, 1)}
                      disabled={i === etapy.length - 1}
                      aria-label={`Przesuń etap ${s.nazwa} niżej`}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className="przycisk-maly ikona niebezpieczny"
                      onClick={() => ustawEtapy((l) => l.filter((_, j) => j !== i))}
                      aria-label={`Usuń etap ${s.nazwa}`}
                    >
                      ✕
                    </button>
                  </div>
                </li>
              );
            })}
          </ol>
        </fieldset>
      )}

      {etapy.length < MAX_ETAPOW && szablon !== "bez" && (
        <div className="etapy-szablonu-dodaj">
          <select
            className="pole"
            value={doDodania}
            onChange={(e) => ustawDoDodania(e.target.value)}
            aria-label="Etap do dodania"
          >
            {SZABLONY_ETAPOW.map((s) => (
              <option key={s.klucz} value={s.klucz}>
                {s.nazwa}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="przycisk-maly"
            onClick={() => ustawEtapy((l) => [...l, { szablon: doDodania, pytania: 3 }])}
          >
            + etap
          </button>
        </div>
      )}

      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Tworzę…" : "Utwórz quiz i dodaj pytania"}
      </button>
    </form>
  );
}
