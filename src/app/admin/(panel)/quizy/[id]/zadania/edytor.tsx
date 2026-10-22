"use client";

import { useActionState, useState } from "react";
import type { StanFormularza, Zadanie } from "@/lib/typy";
import { LITERY, NAZWY_TYPOW, TYPY_ZADAN, type TypZadania } from "@/lib/zadania";
import { bezResetu } from "../../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../../_komponenty/grafika";
import { KomunikatFormularza } from "../../../_komponenty/stan";
import { zapiszZadanie } from "../../akcje";
import { LIMITY } from "../../limity";

type Props = { quizId: string; zadanie?: Zadanie };

/** Wiersz edytora: `a` to odpowiedź / element / lewa strona pary, `b` prawa strona pary. */
type Wiersz = { klucz: number; a: string; b: string };

const OPISY: Record<TypZadania, string> = {
  wybor: "Odpowiedzi (kliknij literę poprawnej)",
  wielokrotny: "Odpowiedzi (zaznacz literami wszystkie poprawne)",
  kolejnosc: "Elementy we właściwej kolejności (gracze zobaczą je pomieszane)",
  pary: "Pary (prawa strona zostanie pomieszana)",
};

const MIN_WIERSZY: Record<TypZadania, number> = { wybor: 2, wielokrotny: 2, kolejnosc: 3, pary: 2 };

/** Wiersze i rozwiązanie z zapisanego zadania (kolejność i pary w poprawnym ułożeniu). */
function poczatek(zadanie?: Zadanie): { wiersze: string[][]; poprawna: number | null; zaznaczone: number[] } {
  if (!zadanie) return { wiersze: [[""], [""], [""], [""]], poprawna: null, zaznaczone: [] };
  switch (zadanie.typ) {
    case "wybor":
      return { wiersze: zadanie.dane.odpowiedzi.map((o) => [o]), poprawna: zadanie.dane.poprawna, zaznaczone: [] };
    case "wielokrotny":
      return { wiersze: zadanie.dane.odpowiedzi.map((o) => [o]), poprawna: null, zaznaczone: zadanie.dane.poprawna };
    case "kolejnosc":
      return { wiersze: zadanie.dane.poprawna.map((i) => [zadanie.dane.elementy[i]]), poprawna: null, zaznaczone: [] };
    case "pary":
      return {
        wiersze: zadanie.dane.lewe.map((l, i) => [l, zadanie.dane.prawe[zadanie.dane.poprawna[i]]]),
        poprawna: null,
        zaznaczone: [],
      };
  }
}

/** Indeksy wierszy, których tekst powtarza się (bez względu na wielkość liter). */
function powtorzenia(teksty: string[]): Set<number> {
  const klucze = teksty.map((t) => t.trim().toLocaleLowerCase("pl"));
  return new Set(klucze.map((k, i) => (k && klucze.indexOf(k) !== klucze.lastIndexOf(k) ? i : -1)).filter((i) => i >= 0));
}

/** Edytor zadania: typ, pytanie i wiersze zależne od typu, jedna grafika. */
export function EdytorZadania({ quizId, zadanie }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(
    zapiszZadanie.bind(null, quizId, zadanie?.id ?? null),
    {},
  );

  const start = poczatek(zadanie);
  const [typ, setTyp] = useState<TypZadania>(zadanie?.typ ?? "wybor");
  // klucze, żeby React nie mieszał pól przy usuwaniu wierszy ze środka
  const [wiersze, setWiersze] = useState<Wiersz[]>(() =>
    start.wiersze.map(([a, b = ""], klucz) => ({ klucz, a, b })),
  );
  const [nastepnyKlucz, setNastepnyKlucz] = useState(start.wiersze.length);
  const [poprawna, setPoprawna] = useState<number | null>(start.poprawna);
  const [zaznaczone, setZaznaczone] = useState<number[]>(start.zaznaczone);

  const powtorzoneA = powtorzenia(wiersze.map((w) => w.a));
  const powtorzoneB = typ === "pary" ? powtorzenia(wiersze.map((w) => w.b)) : new Set<number>();
  const minimum = MIN_WIERSZY[typ];

  // dane do zapisu; kolejność i pary miesza serwer
  const dane =
    typ === "wybor"
      ? { odpowiedzi: wiersze.map((w) => w.a), poprawna }
      : typ === "wielokrotny"
        ? { odpowiedzi: wiersze.map((w) => w.a), poprawna: [...zaznaczone].sort((x, y) => x - y) }
        : typ === "kolejnosc"
          ? { elementy: wiersze.map((w) => w.a) }
          : { pary: wiersze.map((w) => [w.a, w.b]) };

  function zmienTyp(nowy: TypZadania) {
    setTyp(nowy);
    setPoprawna(null);
    setZaznaczone([]);
  }

  function dodaj() {
    setWiersze((w) => [...w, { klucz: nastepnyKlucz, a: "", b: "" }]);
    setNastepnyKlucz((k) => k + 1);
  }

  function usun(i: number) {
    setWiersze((w) => w.filter((_, j) => j !== i));
    setPoprawna((p) => (p === null || p === i ? null : p > i ? p - 1 : p));
    setZaznaczone((z) => z.filter((j) => j !== i).map((j) => (j > i ? j - 1 : j)));
  }

  function przesun(i: number, o: -1 | 1) {
    setWiersze((w) => {
      const j = i + o;
      if (j < 0 || j >= w.length) return w;
      const nowe = [...w];
      [nowe[i], nowe[j]] = [nowe[j], nowe[i]];
      return nowe;
    });
  }

  function zmien(i: number, pole: "a" | "b", tekst: string) {
    setWiersze((w) => w.map((x, j) => (j === i ? { ...x, [pole]: tekst } : x)));
  }

  const przyciskUsun = (i: number) => (
    <button
      type="button"
      className="przycisk-maly ikona niebezpieczny"
      onClick={() => usun(i)}
      disabled={wiersze.length <= minimum}
      aria-label={`Usuń wiersz ${i + 1}`}
      data-podpis="Usuń"
    >
      ✕
    </button>
  );

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <input type="hidden" name="typ" value={typ} />
      <input type="hidden" name="dane" value={JSON.stringify(dane)} />

      <fieldset>
        <legend>Rodzaj pytania</legend>
        <div className="wybor-czasu">
          {TYPY_ZADAN.map((t) => (
            <label key={t} className={`wybor-czasu-opcja${typ === t ? " wybrana" : ""}`}>
              <input type="radio" name="typ_wybor" value={t} checked={typ === t} onChange={() => zmienTyp(t)} />
              {NAZWY_TYPOW[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor="tresc">Pytanie</label>
        <textarea
          id="tresc"
          name="tresc"
          className="pole"
          defaultValue={zadanie?.tresc}
          required
          maxLength={LIMITY.tresc}
          rows={3}
          autoFocus={!zadanie}
        />
      </div>

      <fieldset>
        <legend>{OPISY[typ]}</legend>
        <div className="odpowiedzi">
          {wiersze.map((w, i) => {
            const poleA = (
              <input
                className={`pole${powtorzoneA.has(i) ? " pole-zle" : ""}`}
                aria-invalid={powtorzoneA.has(i) || undefined}
                value={w.a}
                onChange={(e) => zmien(i, "a", e.target.value)}
                required
                maxLength={LIMITY.odpowiedz}
                aria-label={typ === "pary" ? `Para ${i + 1}, lewa strona` : `Wiersz ${i + 1}`}
              />
            );
            if (typ === "pary") {
              return (
                <div key={w.klucz} className="odpowiedz odpowiedz-para">
                  {poleA}
                  <span className="odpowiedz-laczenie" aria-hidden>
                    ↔
                  </span>
                  <input
                    className={`pole${powtorzoneB.has(i) ? " pole-zle" : ""}`}
                    aria-invalid={powtorzoneB.has(i) || undefined}
                    value={w.b}
                    onChange={(e) => zmien(i, "b", e.target.value)}
                    required
                    maxLength={LIMITY.odpowiedz}
                    aria-label={`Para ${i + 1}, prawa strona`}
                  />
                  {przyciskUsun(i)}
                </div>
              );
            }
            if (typ === "kolejnosc") {
              return (
                <div key={w.klucz} className="odpowiedz odpowiedz-kolejnosc">
                  <span className="odpowiedz-litera">{i + 1}</span>
                  {poleA}
                  <span className="odpowiedz-strzalki">
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => przesun(i, -1)}
                      disabled={i === 0}
                      aria-label={`Przesuń wiersz ${i + 1} wyżej`}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className="przycisk-maly ikona"
                      onClick={() => przesun(i, 1)}
                      disabled={i === wiersze.length - 1}
                      aria-label={`Przesuń wiersz ${i + 1} niżej`}
                    >
                      ↓
                    </button>
                  </span>
                  {przyciskUsun(i)}
                </div>
              );
            }
            return (
              <div key={w.klucz} className="odpowiedz">
                <label className="odpowiedz-litera" title="Poprawna odpowiedź">
                  {typ === "wybor" ? (
                    <input
                      type="radio"
                      name="poprawna_wybor"
                      checked={poprawna === i}
                      onChange={() => setPoprawna(i)}
                      required
                      aria-label={`Odpowiedź ${LITERY[i]} jest poprawna`}
                    />
                  ) : (
                    <input
                      type="checkbox"
                      checked={zaznaczone.includes(i)}
                      onChange={(e) =>
                        setZaznaczone((z) => (e.target.checked ? [...z, i] : z.filter((j) => j !== i)))
                      }
                      aria-label={`Odpowiedź ${LITERY[i]} jest poprawna`}
                    />
                  )}
                  {LITERY[i]}
                </label>
                {poleA}
                {przyciskUsun(i)}
              </div>
            );
          })}
        </div>
        {(powtorzoneA.size > 0 || powtorzoneB.size > 0) && (
          <p className="blad" role="alert" style={{ margin: "8px 0 0" }}>
            Zaznaczone na czerwono wiersze są takie same. Popraw je przed zapisem.
          </p>
        )}
        {wiersze.length < LIMITY.maxOdpowiedzi && (
          <button type="button" className="przycisk-maly" onClick={dodaj} style={{ marginTop: 10 }}>
            + {typ === "pary" ? "para" : typ === "kolejnosc" ? "element" : "odpowiedź"}
          </button>
        )}
      </fieldset>

      <PoleGrafiki
        nazwa="grafika"
        etykieta="Grafika do pytania (opcjonalnie)"
        obecna={zadanie?.grafika_url}
        podpowiedz="Pokazuje się na TV i telefonach razem z pytaniem. PNG, JPG, WebP albo SVG, do 5 MB."
      />

      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Zapisuję…" : zadanie ? "Zapisz pytanie" : "Dodaj pytanie"}
      </button>
    </form>
  );
}
