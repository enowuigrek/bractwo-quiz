"use client";

import { useState } from "react";
import type { ZadanieWidoczne } from "@/lib/gra/typy";
import { LITERY, type DaneOdpowiedzi } from "@/lib/zadania";

// Odpowiadanie na telefonie w nowych typach pytań. Każdy komponent dostaje `key={zadanie.id}`,
// więc zaznaczenia czyszczą się przy następnym pytaniu. `wyslana`: odpowiedź już zapisana (blokuje zmiany).

type Props = {
  z: ZadanieWidoczne;
  wyslana: DaneOdpowiedzi | null;
  zablokowane: boolean;
  onWyslij: (dane: DaneOdpowiedzi) => void;
};

/** Wielokrotny wybór: zaznacz kafelki, potem „Zatwierdź”. */
export function OdpowiedzWielokrotna({ z, wyslana, zablokowane, onWyslij }: Props) {
  const [zaznaczone, ustaw] = useState<number[]>([]);
  const wybrane = wyslana?.odpowiedzi ?? zaznaczone;
  const koniec = !!wyslana || zablokowane;
  return (
    <>
      <ol className="odp-lista">
        {(z.dane.odpowiedzi ?? []).map((o, i) => {
          const tak = wybrane.includes(i);
          return (
            <li key={i}>
              <button
                className={`odp${tak ? " wybrana" : wyslana ? " przygaszona" : ""}`}
                disabled={koniec}
                aria-pressed={tak}
                onClick={() => ustaw((z) => (z.includes(i) ? z.filter((j) => j !== i) : [...z, i]))}
              >
                <span className="odp-litera">{tak ? "✓" : LITERY[i]}</span>
                <span className="odp-tekst">{o}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {!wyslana && (
        <button
          className="przycisk zloty odp-zatwierdz"
          disabled={koniec || zaznaczone.length === 0}
          onClick={() => onWyslij({ odpowiedzi: [...zaznaczone].sort((a, b) => a - b) })}
        >
          Zatwierdź{zaznaczone.length ? ` (${zaznaczone.length})` : ""}
        </button>
      )}
    </>
  );
}

/** Kolejność: stukaj elementy po kolei, każdy dostaje numer. „Cofnij” zdejmuje ostatni. */
export function OdpowiedzKolejnosc({ z, wyslana, zablokowane, onWyslij }: Props) {
  const elementy = z.dane.elementy ?? [];
  const [ulozenie, ustaw] = useState<number[]>([]);
  const ulozone = wyslana?.kolejnosc ?? ulozenie;
  const koniec = !!wyslana || zablokowane;
  const komplet = ulozenie.length === elementy.length;
  return (
    <>
      <ol className="odp-lista">
        {elementy.map((e, i) => {
          const nr = ulozone.indexOf(i);
          return (
            <li key={i}>
              <button
                className={`odp${nr >= 0 ? " wybrana" : ""}`}
                disabled={koniec || nr >= 0}
                onClick={() => ustaw((u) => [...u, i])}
              >
                <span className={`odp-litera${nr >= 0 ? " odp-numer" : ""}`}>{nr >= 0 ? nr + 1 : "·"}</span>
                <span className="odp-tekst">{e}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {!wyslana && (
        <div className="odp-akcje">
          <button
            className="przycisk"
            disabled={koniec || ulozenie.length === 0}
            onClick={() => ustaw((u) => u.slice(0, -1))}
          >
            Cofnij
          </button>
          <button
            className="przycisk zloty"
            disabled={koniec || !komplet}
            onClick={() => onWyslij({ kolejnosc: ulozenie })}
          >
            Zatwierdź
          </button>
        </div>
      )}
    </>
  );
}

/** Pary: stuknij lewy, potem prawy. Para dostaje wspólny numer; stuknięcie sparowanego rozłącza. */
export function OdpowiedzPary({ z, wyslana, zablokowane, onWyslij }: Props) {
  const lewe = z.dane.lewe ?? [];
  const prawe = z.dane.prawe ?? [];
  const [pary, ustawPary] = useState<(number | null)[]>(() => lewe.map(() => null));
  const [aktywny, ustawAktywny] = useState<number | null>(null);
  const polaczone = wyslana?.pary ?? pary;
  const koniec = !!wyslana || zablokowane;
  const komplet = pary.every((p) => p !== null);

  function stuknijLewy(i: number) {
    if (pary[i] !== null) {
      ustawPary((p) => p.map((x, j) => (j === i ? null : x)));
      ustawAktywny(i);
      return;
    }
    ustawAktywny((a) => (a === i ? null : i));
  }

  function stuknijPrawy(k: number) {
    const ktory = pary.indexOf(k);
    if (aktywny === null) {
      // stuknięcie sparowanego prawego rozłącza parę
      if (ktory >= 0) ustawPary((p) => p.map((x, j) => (j === ktory ? null : x)));
      return;
    }
    ustawPary((p) => p.map((x, j) => (j === aktywny ? k : x === k ? null : x)));
    ustawAktywny(null);
  }

  return (
    <>
      <div className="pary-siatka">
        <ol className="odp-lista">
          {lewe.map((l, i) => {
            const para = polaczone[i];
            return (
              <li key={i}>
                <button
                  className={`odp odp-para${aktywny === i ? " aktywna" : ""}${para != null ? ` para-${i % 6}` : ""}`}
                  disabled={koniec}
                  onClick={() => stuknijLewy(i)}
                >
                  <span className="odp-litera">{i + 1}</span>
                  <span className="odp-tekst">{l}</span>
                </button>
              </li>
            );
          })}
        </ol>
        <ol className="odp-lista">
          {prawe.map((r, k) => {
            const lewy = polaczone.indexOf(k);
            return (
              <li key={k}>
                <button
                  className={`odp odp-para${lewy >= 0 ? ` para-${lewy % 6}` : ""}`}
                  disabled={koniec}
                  onClick={() => stuknijPrawy(k)}
                >
                  <span className="odp-litera">{lewy >= 0 ? lewy + 1 : LITERY[k]}</span>
                  <span className="odp-tekst">{r}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {!wyslana && (
        <>
          <p className="pomocniczy" style={{ margin: "8px 0 0" }}>
            {aktywny !== null
              ? `Teraz stuknij parę dla „${lewe[aktywny]}” po prawej.`
              : "Stuknij element po lewej, potem jego parę po prawej."}
          </p>
          <button
            className="przycisk zloty odp-zatwierdz"
            disabled={koniec || !komplet}
            onClick={() => onWyslij({ pary: pary as number[] })}
          >
            Zatwierdź
          </button>
        </>
      )}
    </>
  );
}

/** Rozwiązanie po wyniku: co było dobrze, a co nie (nowe typy). */
export function Rozwiazanie({ z, moja }: { z: ZadanieWidoczne; moja: DaneOdpowiedzi | null }) {
  const p = z.dane.poprawna;
  if (z.typ === "wielokrotny" && Array.isArray(p)) {
    return (
      <ol className="odp-lista">
        {(z.dane.odpowiedzi ?? []).map((o, i) => {
          const dobra = p.includes(i);
          const moja_ = moja?.odpowiedzi?.includes(i) ?? false;
          const klasa = dobra ? " poprawna" : moja_ ? " bledna" : " przygaszona";
          return (
            <li key={i}>
              <div className={`odp${klasa}`}>
                <span className="odp-litera">{LITERY[i]}</span>
                <span className="odp-tekst">{o}</span>
                {dobra && <span className="ok">{moja_ ? "✓" : "pominięta"}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  if (z.typ === "kolejnosc" && Array.isArray(p)) {
    const el = z.dane.elementy ?? [];
    return (
      <ol className="odp-lista">
        {p.map((idx, pozycja) => {
          const twoja = moja?.kolejnosc?.[pozycja];
          const trafiona = twoja === idx;
          return (
            <li key={pozycja}>
              {/* pokazujemy właściwą kolejność; przy pomyłce dopisek, co gracz tu ułożył */}
              <div className={`odp${trafiona ? " poprawna" : moja ? " nietrafiona" : ""}`}>
                <span className="odp-litera">{pozycja + 1}</span>
                <span className="odp-tekst">
                  {el[idx]}
                  {moja && !trafiona && twoja !== undefined && <span className="odp-twoja">Ty: {el[twoja]}</span>}
                </span>
                {moja && <span className={trafiona ? "ok" : "zle"}>{trafiona ? "✓" : "✗"}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  if (z.typ === "pary" && Array.isArray(p)) {
    const prawe = z.dane.prawe ?? [];
    return (
      <ol className="odp-lista">
        {(z.dane.lewe ?? []).map((l, i) => {
          const twoja = moja?.pary?.[i];
          const trafiona = twoja === p[i];
          return (
            <li key={i}>
              <div className={`odp${trafiona ? " poprawna" : moja ? " nietrafiona" : ""}`}>
                <span className="odp-tekst">
                  {l} – <strong>{prawe[p[i]]}</strong>
                  {moja && !trafiona && twoja !== undefined && <span className="odp-twoja">Ty: {prawe[twoja]}</span>}
                </span>
                {moja && <span className={trafiona ? "ok" : "zle"}>{trafiona ? "✓" : "✗"}</span>}
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return null;
}
