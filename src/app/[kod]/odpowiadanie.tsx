"use client";

import { useEffect, useRef, useState } from "react";
import type { ZadanieWidoczne } from "@/lib/gra/typy";
import { LITERY, liczbaZJednostka, poprawnaSzacowania, type DaneOdpowiedzi } from "@/lib/zadania";

// Odpowiadanie na telefonie w nowych typach pytań. Każdy komponent dostaje `key={zadanie.id}`,
// więc zaznaczenia czyszczą się przy następnym pytaniu. `wyslana`: odpowiedź już zapisana (blokuje zmiany).

type Props = {
  z: ZadanieWidoczne;
  wyslana: DaneOdpowiedzi | null;
  zablokowane: boolean;
  onWyslij: (dane: DaneOdpowiedzi) => void;
};

/** Prawda / fałsz: dwa duże przyciski, jedno stuknięcie wysyła odpowiedź. */
/**
 * Prawda / fałsz. `okragle`: w serii dwa duże okrągłe przyciski (zielony ✓, czerwony ✗) nisko na ekranie,
 * pod kciuki, bo pytania lecą jedno po drugim i liczy się tempo.
 */
export function OdpowiedzPrawdaFalsz({
  z,
  wyslana,
  zablokowane,
  onWyslij,
  okragle = false,
}: Props & { okragle?: boolean }) {
  const wybrana = wyslana?.odpowiedz ?? null;
  return (
    <div className={`odp-pf${okragle ? " okragle" : ""}`}>
      {(z.dane.odpowiedzi ?? []).map((o, i) => (
        <button
          key={i}
          className={`odp-pf-przycisk ${i === 0 ? "prawda" : "falsz"}${
            wybrana === null ? "" : i === wybrana ? " wybrana" : " przygaszona"
          }`}
          disabled={wybrana !== null || zablokowane}
          onClick={() => onWyslij({ odpowiedz: i })}
          // okrągłe (seria): same znaki, napis tylko dla czytników ekranu
          aria-label={okragle ? o : undefined}
        >
          <span aria-hidden>{i === 0 ? "✓" : "✗"}</span>
          {!okragle && o}
        </button>
      ))}
    </div>
  );
}

/** Wartość z zakresu przyciągnięta do kroku (bez ogonów typu 0,30000000004). */
function naKrok(x: number, min: number, max: number, krok: number): number {
  const n = Math.round((x - min) / krok);
  const wynik = Math.min(max, Math.max(min, min + n * krok));
  return Number(wynik.toFixed(6));
}

/** Szacowanie: suwak z dużą liczbą i przyciskami −/+, potem „Zatwierdź”. */
export function OdpowiedzLiczba({ z, wyslana, zablokowane, onWyslij }: Props) {
  const min = z.dane.min ?? 0;
  const max = z.dane.max ?? 100;
  const krok = z.dane.krok ?? 1;
  const [wartosc, ustaw] = useState(() => naKrok((min + max) / 2, min, max, krok));
  const [ruszona, ustawRuszona] = useState(false);
  const pokaz = wyslana?.liczba ?? wartosc;
  const koniec = !!wyslana || zablokowane;
  const zmien = (x: number) => {
    ustaw(naKrok(x, min, max, krok));
    ustawRuszona(true);
  };
  return (
    <div className="odp-liczba">
      <p className="odp-liczba-wartosc" aria-live="polite">
        {liczbaZJednostka(pokaz, z.dane.jednostka)}
      </p>
      <div className="odp-liczba-suwak">
        <button
          type="button"
          className="odp-liczba-krok"
          disabled={koniec || pokaz <= min}
          onClick={() => zmien(wartosc - krok)}
          aria-label="Mniej"
        >
          −
        </button>
        <input
          type="range"
          min={min}
          max={max}
          step={krok}
          value={pokaz}
          disabled={koniec}
          onChange={(e) => zmien(Number(e.target.value))}
          aria-label="Twoja liczba"
        />
        <button
          type="button"
          className="odp-liczba-krok"
          disabled={koniec || pokaz >= max}
          onClick={() => zmien(wartosc + krok)}
          aria-label="Więcej"
        >
          +
        </button>
      </div>
      <p className="odp-liczba-zakres">
        <span>{liczbaZJednostka(min)}</span>
        <span>{liczbaZJednostka(max)}</span>
      </p>
      {!wyslana && (
        <button
          className="przycisk zloty odp-zatwierdz"
          disabled={koniec || !ruszona}
          onClick={() => onWyslij({ liczba: wartosc })}
        >
          {ruszona ? "Zatwierdź" : "Przesuń suwak"}
        </button>
      )}
    </div>
  );
}

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

/** Kolory par: takie same jak `.para-0` … `.para-5` w globals.css. Bez czerwieni: kojarzy się z błędem. */
const KOLORY_PAR = ["#e3ac3f", "#8fb63a", "#6fa8dc", "#4fb8a8", "#c39bd3", "#f4ecd8"];

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
  // zaznaczony element czeka na parę z drugiej kolumny; zaczynać można z dowolnej strony
  const [aktywny, ustawAktywny] = useState<{ strona: "lewy" | "prawy"; i: number } | null>(null);
  const polaczone = wyslana?.pary ?? pary;
  const koniec = !!wyslana || zablokowane;
  const komplet = pary.every((p) => p !== null);
  const { siatka, linie } = useLiniePar(polaczone);

  // lewy i z prawym k w parę (oba tracą wcześniejsze pary)
  const polacz = (i: number, k: number) => {
    ustawPary((p) => p.map((x, j) => (j === i ? k : x === k ? null : x)));
    ustawAktywny(null);
  };

  function stuknijLewy(i: number) {
    if (aktywny?.strona === "prawy") return polacz(i, aktywny.i);
    // stuknięcie sparowanego rozłącza parę
    if (pary[i] !== null) {
      ustawPary((p) => p.map((x, j) => (j === i ? null : x)));
      ustawAktywny(null);
      return;
    }
    ustawAktywny((a) => (a?.strona === "lewy" && a.i === i ? null : { strona: "lewy", i }));
  }

  function stuknijPrawy(k: number) {
    if (aktywny?.strona === "lewy") return polacz(aktywny.i, k);
    const ktory = pary.indexOf(k);
    if (ktory >= 0) {
      ustawPary((p) => p.map((x, j) => (j === ktory ? null : x)));
      ustawAktywny(null);
      return;
    }
    ustawAktywny((a) => (a?.strona === "prawy" && a.i === k ? null : { strona: "prawy", i: k }));
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
                  className={`odp odp-para${aktywny?.strona === "lewy" && aktywny.i === i ? " aktywna" : ""}${
                    para != null ? ` para-${i % 6}` : ""
                  }`}
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
                  className={`odp odp-para${aktywny?.strona === "prawy" && aktywny.i === k ? " aktywna" : ""}${
                    lewy >= 0 ? ` para-${lewy % 6}` : ""
                  }`}
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
          {/* bez podpowiedzi „stuknij parę dla…”: zmieniała wysokość i przesuwała „Zatwierdź” (26.10) */}
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

/**
 * Rozwiązanie po wyniku: co było dobrze, a co nie (nowe typy). Same znaki ✓ ✗ i kolory, bez szarych dopisków w rodzaju
 * „Twoja kolejność” czy „Ty: …” (26.10, Łukasz: przy szybkim tempie nikt ich nie czyta).
 */
export function Rozwiazanie({ z, moja }: { z: ZadanieWidoczne; moja: DaneOdpowiedzi | null }) {
  const p = z.dane.poprawna;
  if (z.typ === "szacowanie" && typeof p === "number") {
    return (
      <div className="odp-liczba-wynik">
        <p>
          Poprawna: <strong className="ok">{poprawnaSzacowania(p, z.dane.poprawna_do, z.dane.jednostka)}</strong>
        </p>
      </div>
    );
  }
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
                {dobra && moja_ && <span className="ok">✓</span>}
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
