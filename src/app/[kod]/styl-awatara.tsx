"use client";
/* eslint-disable @next/next/no-img-element -- podglądy zdjęć z pamięci telefonu */

import { useState } from "react";
import { przygotujZdjecie } from "@/lib/zdjecie";

export type Zdjecie = { blob: Blob; podglad: string };

/**
 * Przed dołączeniem: wybór selfie zwykłego albo w stylu Bractwa (OpenAI przez `/api/awatar`, ok. 20 s).
 * Przeróbka robi się dopiero po stuknięciu, a do gry trafia to zdjęcie, które gracz zaznaczy.
 */
export function StylAwatara({
  kod,
  oryginal,
  zwykle,
  wybrane,
  onWybierz,
}: {
  kod: string;
  oryginal: File;
  zwykle: Zdjecie;
  wybrane: Zdjecie;
  onWybierz: (z: Zdjecie) => void;
}) {
  const [przerobione, ustawPrzerobione] = useState<Zdjecie | null>(null);
  const [trwa, ustawTrwa] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);

  async function przerob() {
    ustawTrwa(true);
    ustawBlad(null);
    try {
      const dane = new FormData();
      dane.append("kod", kod);
      dane.append("plik", new File([await przygotujZdjecie(oryginal, 512)], "selfie.jpg", { type: "image/jpeg" }));
      const odp = await fetch("/api/awatar", { method: "POST", body: dane });
      const wynik = (await odp.json()) as { ok: boolean; obraz?: string; blad?: string };
      if (!wynik.ok || !wynik.obraz) {
        ustawBlad(wynik.blad ?? "Przeróbka się nie udała.");
        return;
      }
      const ai = await fetch(wynik.obraz).then((o) => o.blob());
      const blob = await przygotujZdjecie(new File([ai], "ai.webp", { type: "image/webp" }));
      const gotowe = { blob, podglad: URL.createObjectURL(blob) };
      ustawPrzerobione(gotowe);
      onWybierz(gotowe);
    } catch {
      ustawBlad("Brak połączenia. Spróbuj jeszcze raz.");
    } finally {
      ustawTrwa(false);
    }
  }

  return (
    <div className="styl-awatara">
      <div className="styl-awatara-opcje" role="radiogroup" aria-label="Które zdjęcie dodać">
        <button
          type="button"
          role="radio"
          aria-checked={wybrane === zwykle}
          className={`styl-awatara-opcja${wybrane === zwykle ? " wybrana" : ""}`}
          onClick={() => onWybierz(zwykle)}
        >
          <img src={zwykle.podglad} alt="" />
          <span>Zwykłe</span>
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={!!przerobione && wybrane === przerobione}
          className={`styl-awatara-opcja${przerobione && wybrane === przerobione ? " wybrana" : ""}`}
          onClick={() => (przerobione ? onWybierz(przerobione) : void przerob())}
          disabled={trwa}
        >
          {przerobione ? (
            <img src={przerobione.podglad} alt="" />
          ) : (
            <span className="styl-awatara-puste" aria-hidden>
              {trwa ? "⏳" : "✨"}
            </span>
          )}
          <span>{trwa ? "Przerabiam…" : "W stylu Bractwa"}</span>
        </button>
      </div>
      <span className="pomocniczy">
        {trwa
          ? "Ok. 20 sekund. Możesz w tym czasie wpisać nick."
          : "Przeróbka: zdjęcie trafi na chwilę do OpenAI, które dorysuje złote światło baru."}
      </span>
      {blad && (
        <span className="blad" role="alert">
          {blad}
        </span>
      )}
    </div>
  );
}
