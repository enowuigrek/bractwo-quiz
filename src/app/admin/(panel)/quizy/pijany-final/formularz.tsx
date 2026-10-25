"use client";

import { useActionState, useState } from "react";
import { EFEKTY_PIJANE, LIMITY_PIJANE, type EfektPijany, type PijanePytanie } from "@/lib/pijany";
import type { StanFormularza } from "@/lib/typy";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { zapiszPijanePytania } from "./akcje";

type Wiersz = { klucz: number; tresc: string; efekt: EfektPijany; komentarzPrawda: string; komentarzFalsz: string };

let licznik = 0;
const nowyKlucz = () => ++licznik;

/**
 * Lista pytań pijanego finału: treść, przeszkadzacz, komentarze po ✓ i ✗, kolejność; zapis całości jednym
 * przyciskiem. Bez `quizId` wspólna pula, z `quizId` wejście tego quizu.
 */
export function FormularzPijany({ pytania, quizId = null }: { pytania: PijanePytanie[]; quizId?: string | null }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zapiszPijanePytania.bind(null, quizId), {});
  const limit = quizId ? LIMITY_PIJANE.wejscie : LIMITY_PIJANE.pytan;
  const [wiersze, ustawWiersze] = useState<Wiersz[]>(() =>
    pytania.map((p) => ({
      klucz: nowyKlucz(),
      tresc: p.tresc,
      efekt: p.efekt,
      komentarzPrawda: p.komentarz_prawda ?? "",
      komentarzFalsz: p.komentarz_falsz ?? "",
    })),
  );

  const zmien = (i: number, zmiana: Partial<Wiersz>) =>
    ustawWiersze((l) => l.map((w, j) => (j === i ? { ...w, ...zmiana } : w)));
  const przesun = (i: number, o: number) =>
    ustawWiersze((l) => {
      const n = [...l];
      [n[i], n[i + o]] = [n[i + o], n[i]];
      return n;
    });

  return (
    <form action={akcja}>
      <input
        type="hidden"
        name="pytania"
        value={JSON.stringify(
          wiersze.map(({ tresc, efekt, komentarzPrawda, komentarzFalsz }) => ({
            tresc,
            efekt,
            komentarz_prawda: komentarzPrawda,
            komentarz_falsz: komentarzFalsz,
          })),
        )}
      />
      <ol className="lista pijane-pytania">
        {wiersze.map((w, i) => (
          <li key={w.klucz}>
            <span className="krok-nr">{i + 1}.</span>
            <div className="lista-glowna pijane-pytanie">
              <input
                className="pole"
                value={w.tresc}
                maxLength={LIMITY_PIJANE.tresc}
                onChange={(e) => zmien(i, { tresc: e.target.value })}
                aria-label={`Pytanie ${i + 1}`}
                placeholder="np. Czy szklanka jest w połowie pełna?"
              />
              <select
                className="pole"
                value={w.efekt}
                onChange={(e) => zmien(i, { efekt: e.target.value as EfektPijany })}
                aria-label={`Przeszkadzacz w pytaniu ${i + 1}`}
              >
                {Object.entries(EFEKTY_PIJANE).map(([k, opis]) => (
                  <option key={k} value={k}>
                    {opis}
                  </option>
                ))}
              </select>
              <div className="pijane-komentarze">
                <input
                  className="pole"
                  value={w.komentarzPrawda}
                  maxLength={LIMITY_PIJANE.komentarz}
                  onChange={(e) => zmien(i, { komentarzPrawda: e.target.value })}
                  aria-label={`Komentarz po ✓ w pytaniu ${i + 1}`}
                  placeholder="Komentarz po ✓ (opcjonalny)"
                />
                <input
                  className="pole"
                  value={w.komentarzFalsz}
                  maxLength={LIMITY_PIJANE.komentarz}
                  onChange={(e) => zmien(i, { komentarzFalsz: e.target.value })}
                  aria-label={`Komentarz po ✗ w pytaniu ${i + 1}`}
                  placeholder="Komentarz po ✗ (opcjonalny)"
                />
              </div>
            </div>
            <div className="lista-akcje">
              <button
                type="button"
                className="przycisk-maly ikona"
                onClick={() => przesun(i, -1)}
                disabled={i === 0}
                aria-label={`Przesuń pytanie ${i + 1} wyżej`}
              >
                ↑
              </button>
              <button
                type="button"
                className="przycisk-maly ikona"
                onClick={() => przesun(i, 1)}
                disabled={i === wiersze.length - 1}
                aria-label={`Przesuń pytanie ${i + 1} niżej`}
              >
                ↓
              </button>
              <button
                type="button"
                className="przycisk-maly ikona niebezpieczny"
                onClick={() => ustawWiersze((l) => l.filter((_, j) => j !== i))}
                aria-label={`Usuń pytanie ${i + 1}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ol>
      <p className="panel-sekcja" style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button
          type="button"
          className="przycisk"
          disabled={wiersze.length >= limit}
          onClick={() =>
            ustawWiersze((l) => [
              ...l,
              { klucz: nowyKlucz(), tresc: "", efekt: "brak", komentarzPrawda: "", komentarzFalsz: "" },
            ])
          }
        >
          + pytanie
        </button>
        <button type="submit" className="przycisk zloty" disabled={trwa}>
          {trwa ? "Zapisuję…" : "Zapisz pytania"}
        </button>
      </p>
      <KomunikatFormularza stan={stan} />
    </form>
  );
}
