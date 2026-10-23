"use client";

import { useEffect, useRef, useState } from "react";
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

/** Kolejność: stukaj elementy po kolei, każdy dostaje numer. Stuknięcie ponumerowanego zdejmuje go, a dalsze numery się przesuwają. */
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
                disabled={koniec}
                onClick={() => ustaw((u) => (u.includes(i) ? u.filter((j) => j !== i) : [...u, i]))}
              >
                <span className={`odp-litera${nr >= 0 ? " odp-numer" : ""}`}>{nr >= 0 ? nr + 1 : "·"}</span>
                <span className="odp-tekst">{e}</span>
              </button>
            </li>
          );
        })}
      </ol>
      {!wyslana && (
        <button
          className="przycisk zloty odp-zatwierdz"
          disabled={koniec || !komplet}
          onClick={() => onWyslij({ kolejnosc: ulozenie })}
        >
          Zatwierdź
        </button>
      )}
    </>
  );
}

/** Kolory par: takie same jak `.para-0` … `.para-5` w globals.css. */
const KOLORY_PAR = ["#e3ac3f", "#8fb63a", "#6fa8dc", "#e2735a", "#c39bd3", "#f4ecd8"];

type Linia = { x1: number; y1: number; x2: number; y2: number; kolor: string };

/** „Kabelek” jak w mapach myśli: krótko poziomo, łuk do drugiej strony, znów poziomo. */
function kabelek({ x1, y1, x2, y2 }: Linia): string {
  const prosto = Math.min(6, (x2 - x1) / 5);
  const a = x1 + prosto;
  const b = x2 - prosto;
  const srodek = (a + b) / 2;
  return `M ${x1} ${y1} H ${a} C ${srodek} ${y1}, ${srodek} ${y2}, ${b} ${y2} H ${x2}`;
}

/**
 * Kabelki między połączonymi parami: od prawej krawędzi lewego kafelka do lewej krawędzi prawego.
 * Pozycje mierzymy z DOM po każdej zmianie par i przy zmianie rozmiaru siatki.
 */
function useLiniePar(polaczone: (number | null)[]) {
  const siatka = useRef<HTMLDivElement>(null);
  const [linie, ustawLinie] = useState<Linia[]>([]);
  const klucz = polaczone.join(",");

  useEffect(() => {
    const el = siatka.current;
    if (!el) return;
    function zmierz() {
      if (!el) return;
      const baza = el.getBoundingClientRect();
      const lewe = el.querySelectorAll<HTMLElement>("[data-lewy]");
      const prawe = el.querySelectorAll<HTMLElement>("[data-prawy]");
      const nowe: Linia[] = [];
      klucz.split(",").forEach((k, i) => {
        if (k === "") return;
        const a = lewe[i]?.getBoundingClientRect();
        const b = prawe[Number(k)]?.getBoundingClientRect();
        if (!a || !b) return;
        nowe.push({
          x1: a.right - baza.left,
          y1: a.top + a.height / 2 - baza.top,
          x2: b.left - baza.left,
          y2: b.top + b.height / 2 - baza.top,
          kolor: KOLORY_PAR[i % KOLORY_PAR.length],
        });
      });
      ustawLinie(nowe);
    }
    const klatka = requestAnimationFrame(zmierz);
    const obserwator = new ResizeObserver(zmierz);
    obserwator.observe(el);
    return () => {
      cancelAnimationFrame(klatka);
      obserwator.disconnect();
    };
  }, [klucz]);

  return { siatka, linie };
}

/** Pary: stuknij lewy, potem prawy. Para dostaje wspólny numer i kolor; stuknięcie sparowanego rozłącza. */
export function OdpowiedzPary({ z, wyslana, zablokowane, onWyslij }: Props) {
  const lewe = z.dane.lewe ?? [];
  const prawe = z.dane.prawe ?? [];
  const [pary, ustawPary] = useState<(number | null)[]>(() => lewe.map(() => null));
  const [aktywny, ustawAktywny] = useState<number | null>(null);
  const polaczone = wyslana?.pary ?? pary;
  const koniec = !!wyslana || zablokowane;
  const komplet = pary.every((p) => p !== null);
  const { siatka, linie } = useLiniePar(polaczone);

  function stuknijLewy(i: number) {
    if (pary[i] !== null) {
      ustawPary((p) => p.map((x, j) => (j === i ? null : x)));
      ustawAktywny(null);
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
      <div className="pary-siatka" ref={siatka}>
        <svg className="pary-linie" aria-hidden>
          {linie.map((l, i) => (
            <g key={i} stroke={l.kolor} fill={l.kolor}>
              <path d={kabelek(l)} fill="none" strokeWidth={3} strokeLinecap="round" />
              <circle cx={l.x1} cy={l.y1} r={4} />
              <circle cx={l.x2} cy={l.y2} r={4} />
            </g>
          ))}
        </svg>
        <ol className="odp-lista">
          {lewe.map((l, i) => {
            const para = polaczone[i];
            return (
              <li key={i}>
                <button
                  data-lewy
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
                  data-prawy
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
    const twoja = moja?.kolejnosc ?? null;
    // para sąsiadów (i, i+1) jest dobra, gdy u gracza element p[i+1] stoi tuż za p[i] (tak liczy `wewn.ocena`)
    const dobraPara = (i: number) => !!twoja && i + 1 < p.length && twoja[twoja.indexOf(p[i]) + 1] === p[i + 1];
    return (
      <>
        <ol className="odp-lista">
          {p.map((idx, pozycja) => {
            // zielony element ma przynajmniej jednego dobrego sąsiada
            const dobry = dobraPara(pozycja) || (pozycja > 0 && dobraPara(pozycja - 1));
            return (
              <li key={pozycja}>
                <div className={`odp${dobry ? " poprawna" : twoja ? " nietrafiona" : ""}`}>
                  <span className="odp-litera">{pozycja + 1}</span>
                  <span className="odp-tekst">{el[idx]}</span>
                  {twoja && <span className={dobry ? "ok" : "zle"}>{dobry ? "✓" : "✗"}</span>}
                </div>
              </li>
            );
          })}
        </ol>
        {twoja && <p className="odp-twoja-kolejnosc">Twoja kolejność: {twoja.map((i) => el[i]).join(" → ")}</p>}
      </>
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
