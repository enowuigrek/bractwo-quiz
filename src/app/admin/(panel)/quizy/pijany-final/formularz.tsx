"use client";

import { useActionState, useState } from "react";
import { LIMITY_PIJANE, type PijanePytanie } from "@/lib/pijany";
import type { StanFormularza } from "@/lib/typy";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { zapiszPijanePytania } from "./akcje";

type Wiersz = { klucz: number; tresc: string; komentarzPrawda: string; komentarzFalsz: string; piwne: boolean };

let licznik = 0;
const nowyKlucz = () => ++licznik;
const pustyWiersz = (piwne: boolean): Wiersz => ({
  klucz: nowyKlucz(),
  tresc: "",
  komentarzPrawda: "",
  komentarzFalsz: "",
  piwne,
});

/**
 * Wklejone pytania, każde w osobnej linii; komentarze po pionowej kresce: „pytanie | po ✓ | po ✗”.
 * Puste linie są pomijane.
 */
function zWklejonych(tekst: string, piwne: boolean): Wiersz[] {
  return tekst
    .split("\n")
    .map((linia) => linia.split("|").map((x) => x.trim()))
    .filter(([tresc]) => tresc)
    .map(([tresc, komentarzPrawda = "", komentarzFalsz = ""]) => ({
      klucz: nowyKlucz(),
      tresc,
      komentarzPrawda,
      komentarzFalsz,
      piwne,
    }));
}

/**
 * Pytania pijanego finału (wspólne dla wszystkich quizów): treść i komentarze po ✓ i ✗, zapis całości jednym
 * przyciskiem. Dwie części: z „O piwie” lecą na początek 3 losowe, z „Odklejonych” reszta, losowo. Przeszkadzaczy się
 * tu nie wybiera: idą według pozycji.
 */
export function FormularzPijany({ pytania }: { pytania: PijanePytanie[] }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zapiszPijanePytania, {});
  const limit = LIMITY_PIJANE.pytan;
  const [wiersze, ustawWiersze] = useState<Wiersz[]>(() =>
    pytania.map((p) => ({
      klucz: nowyKlucz(),
      tresc: p.tresc,
      komentarzPrawda: p.komentarz_prawda ?? "",
      komentarzFalsz: p.komentarz_falsz ?? "",
      piwne: !!p.piwne,
    })),
  );

  const zmien = (klucz: number, zmiana: Partial<Wiersz>) =>
    ustawWiersze((l) => l.map((w) => (w.klucz === klucz ? { ...w, ...zmiana } : w)));
  const usun = (klucz: number) => ustawWiersze((l) => l.filter((w) => w.klucz !== klucz));
  // przeniesione do innej części trafia na jej koniec
  const przenies = (klucz: number) =>
    ustawWiersze((l) => {
      const w = l.find((x) => x.klucz === klucz);
      return w ? [...l.filter((x) => x.klucz !== klucz), { ...w, piwne: !w.piwne }] : l;
    });
  const dodaj = (nowe: Wiersz[]) => ustawWiersze((l) => [...l, ...nowe].slice(0, limit));

  const pola = (w: Wiersz, nr: number) => (
    <div className="lista-glowna pijane-pytanie">
      <input
        className="pole"
        value={w.tresc}
        maxLength={LIMITY_PIJANE.tresc}
        onChange={(e) => zmien(w.klucz, { tresc: e.target.value })}
        aria-label={`Pytanie ${nr}`}
        placeholder="np. Czy szklanka jest w połowie pełna?"
      />
      <div className="pijane-komentarze">
        <input
          className="pole"
          value={w.komentarzPrawda}
          maxLength={LIMITY_PIJANE.komentarz}
          onChange={(e) => zmien(w.klucz, { komentarzPrawda: e.target.value })}
          aria-label={`Komentarz po ✓ w pytaniu ${nr}`}
          placeholder="Komentarz po ✓ (opcjonalny)"
        />
        <input
          className="pole"
          value={w.komentarzFalsz}
          maxLength={LIMITY_PIJANE.komentarz}
          onChange={(e) => zmien(w.klucz, { komentarzFalsz: e.target.value })}
          aria-label={`Komentarz po ✗ w pytaniu ${nr}`}
          placeholder="Komentarz po ✗ (opcjonalny)"
        />
      </div>
    </div>
  );

  return (
    <form action={akcja}>
      <input
        type="hidden"
        name="pytania"
        value={JSON.stringify(
          [...wiersze.filter((w) => w.piwne), ...wiersze.filter((w) => !w.piwne)].map(
            ({ tresc, komentarzPrawda, komentarzFalsz, piwne }) => ({
              tresc,
              komentarz_prawda: komentarzPrawda,
              komentarz_falsz: komentarzFalsz,
              piwne,
            }),
          ),
        )}
      />
      {[true, false].map((piwne) => (
        <Grupa
          key={String(piwne)}
          piwne={piwne}
          wiersze={wiersze.filter((w) => w.piwne === piwne)}
          pelna={wiersze.length >= limit}
          pola={pola}
          usun={usun}
          przenies={przenies}
          dodaj={dodaj}
        />
      ))}
      <p className="panel-sekcja">
        <button type="submit" className="przycisk zloty" disabled={trwa}>
          {trwa ? "Zapisuję…" : "Zapisz pytania"}
        </button>
      </p>
      <KomunikatFormularza stan={stan} />
    </form>
  );
}

/**
 * Jedna część: „O piwie” (złota) albo „Odklejone” (szara), z dodawaniem po jednym i wklejaniem kilku naraz.
 */
function Grupa({
  piwne,
  wiersze,
  pelna,
  pola,
  usun,
  przenies,
  dodaj,
}: {
  piwne: boolean;
  wiersze: Wiersz[];
  pelna: boolean;
  pola: (w: Wiersz, nr: number) => React.ReactNode;
  usun: (klucz: number) => void;
  przenies: (klucz: number) => void;
  dodaj: (nowe: Wiersz[]) => void;
}) {
  const [wklejanie, ustawWklejanie] = useState<string | null>(null);
  return (
    <section className={`pijana-grupa ${piwne ? "piwne" : "reszta"}`}>
      <h2>
        <span className="pijana-grupa-kropka" aria-hidden />
        {piwne ? "O piwie" : "Odklejone"} <span className="pomocniczy">({wiersze.length})</span>
      </h2>
      <p className="pomocniczy" style={{ marginTop: 0 }}>
        {piwne
          ? "Na początek 3 losowe, spokojnie, jak dalszy ciąg finału. Czwarte to pytanie z imieniem zza baru ({za_barem}), a bez imienia jeszcze jedno stąd."
          : "Potem losowo, aż skończy się czas. Tu już można odlecieć."}
      </p>
      <ul className="lista pijane-pytania">
        {wiersze.map((w, i) => (
          <li key={w.klucz}>
            {pola(w, i + 1)}
            <div className="lista-akcje">
              <button
                type="button"
                className="przycisk-maly"
                onClick={() => przenies(w.klucz)}
                aria-label={`Przenieś pytanie do części „${piwne ? "Odklejone" : "O piwie"}”`}
              >
                {piwne ? "↓ Odklejone" : "↑ O piwie"}
              </button>
              <button
                type="button"
                className="przycisk-maly ikona niebezpieczny"
                onClick={() => usun(w.klucz)}
                aria-label={`Usuń pytanie ${i + 1}`}
              >
                ✕
              </button>
            </div>
          </li>
        ))}
      </ul>
      {wklejanie !== null && (
        <div className="pijana-wklej">
          <textarea
            className="pole"
            rows={5}
            value={wklejanie}
            onChange={(e) => ustawWklejanie(e.target.value)}
            placeholder={
              "Każde pytanie w osobnej linii. Komentarze po kresce:\npytanie | komentarz po ✓ | komentarz po ✗"
            }
            aria-label="Wklej kilka pytań"
            autoFocus
          />
          <p style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "8px 0 0" }}>
            <button
              type="button"
              className="przycisk-maly"
              disabled={!wklejanie.trim()}
              onClick={() => {
                dodaj(zWklejonych(wklejanie, piwne));
                ustawWklejanie(null);
              }}
            >
              Dodaj do listy
            </button>
            <button type="button" className="przycisk-maly" onClick={() => ustawWklejanie(null)}>
              Anuluj
            </button>
          </p>
        </div>
      )}
      <p style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" className="przycisk-maly" disabled={pelna} onClick={() => dodaj([pustyWiersz(piwne)])}>
          + pytanie
        </button>
        {wklejanie === null && (
          <button type="button" className="przycisk-maly" disabled={pelna} onClick={() => ustawWklejanie("")}>
            Wklej kilka naraz
          </button>
        )}
      </p>
    </section>
  );
}
