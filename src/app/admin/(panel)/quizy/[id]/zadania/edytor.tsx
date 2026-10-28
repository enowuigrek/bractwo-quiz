"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { napisMnoznika } from "@/lib/etapy";
import type { Etap, StanFormularza, Zadanie } from "@/lib/typy";
import { LITERY, NAZWY_TYPOW, PRAWDA_FALSZ, TYPY_ZADAN, liczbaZJednostka, type TypZadania } from "@/lib/zadania";
import { bezResetu } from "../../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../../_komponenty/grafika";
import { KomunikatFormularza } from "../../../_komponenty/stan";
import { zapiszZadanie } from "../../akcje";
import { LIMITY } from "../../limity";

type Props = {
  quizId: string;
  zadanie?: Zadanie;
  etapy: Etap[];
  /** Etap dla nowego pytania (np. ostatni). */
  domyslnyEtap: string | null;
  /** Rodzaj nowego pytania (z etapu, do którego jest dodawane). */
  domyslnyTyp?: TypZadania;
  /** Edytor rozwinięty na liście pytań (28.10): zapis zostaje na liście, bez przejścia na inną stronę. */
  naLiscie?: boolean;
  onZapisano?: () => void;
  onZwin?: () => void;
};

/** Wiersz edytora: `a` to odpowiedź / element / lewa strona pary, `b` prawa strona pary. */
type Wiersz = { klucz: number; a: string; b: string };

/** Najdłuższy tekst ciekawostki (mieści się na TV obok grafiki). */
const LIMITY_CIEKAWOSTKI = 400;

const OPISY: Record<TypZadania, string> = {
  wybor: "Odpowiedzi (kliknij literę poprawnej)",
  prawda_falsz: "Zdanie w polu „Pytanie” jest…",
  wielokrotny: "Odpowiedzi (zaznacz literami wszystkie poprawne)",
  kolejnosc: "Elementy we właściwej kolejności (gracze zobaczą je pomieszane)",
  pary: "Pary (prawa strona zostanie pomieszana)",
  szacowanie: "Liczba do odgadnięcia",
  ciekawostka: "Tekst ciekawostki (2–3 zdania pod tytułem, na TV obok grafiki)",
};

const MIN_WIERSZY: Record<TypZadania, number> = {
  wybor: 2,
  prawda_falsz: 0,
  wielokrotny: 2,
  kolejnosc: 3,
  pary: 2,
  szacowanie: 0,
  ciekawostka: 0,
};

/** Pola szacowania jako tekst (przecinek albo kropka), zamiana na liczby na serwerze. */
type PolaLiczby = {
  min: string;
  max: string;
  krok: string;
  tolerancja: string;
  jednostka: string;
  poprawna: string;
  poprawna_do: string;
};

const liczbaNaTekst = (n: number) => String(n).replace(".", ",");

/** Wiersze i rozwiązanie z zapisanego zadania (kolejność i pary w poprawnym ułożeniu). */
function poczatek(zadanie?: Zadanie): { wiersze: string[][]; poprawna: number | null; zaznaczone: number[] } {
  if (!zadanie) return { wiersze: [[""], [""], [""], [""]], poprawna: null, zaznaczone: [] };
  switch (zadanie.typ) {
    case "wybor":
      return { wiersze: zadanie.dane.odpowiedzi.map((o) => [o]), poprawna: zadanie.dane.poprawna, zaznaczone: [] };
    case "prawda_falsz":
      return { wiersze: [[""], [""], [""], [""]], poprawna: zadanie.dane.poprawna, zaznaczone: [] };
    case "szacowanie":
    case "ciekawostka":
      return { wiersze: [[""], [""], [""], [""]], poprawna: null, zaznaczone: [] };
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
  return new Set(
    klucze.map((k, i) => (k && klucze.indexOf(k) !== klucze.lastIndexOf(k) ? i : -1)).filter((i) => i >= 0),
  );
}

/** Edytor zadania: typ, pytanie i wiersze zależne od typu, jedna grafika. */
export function EdytorZadania({
  quizId,
  zadanie,
  etapy,
  domyslnyEtap,
  domyslnyTyp,
  naLiscie,
  onZapisano,
  onZwin,
}: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(
    zapiszZadanie.bind(null, quizId, zadanie?.id ?? null),
    {},
  );
  // kilka edytorów naraz na liście pytań: identyfikatory pól muszą się różnić
  const uid = useId();
  // na liście udany zapis zwija edytor (każdy zapis daje nowy obiekt stanu)
  const poZapisie = useRef(onZapisano);
  useEffect(() => {
    poZapisie.current = onZapisano;
  });
  useEffect(() => {
    if (stan.ok) poZapisie.current?.();
  }, [stan]);

  const start = poczatek(zadanie);
  const [typ, setTyp] = useState<TypZadania>(zadanie?.typ ?? domyslnyTyp ?? "wybor");
  // klucze, żeby React nie mieszał pól przy usuwaniu wierszy ze środka
  const [wiersze, setWiersze] = useState<Wiersz[]>(() => start.wiersze.map(([a, b = ""], klucz) => ({ klucz, a, b })));
  const [nastepnyKlucz, setNastepnyKlucz] = useState(start.wiersze.length);
  const [poprawna, setPoprawna] = useState<number | null>(start.poprawna);
  const [zaznaczone, setZaznaczone] = useState<number[]>(start.zaznaczone);
  const [liczba, setLiczba] = useState<PolaLiczby>(() =>
    zadanie?.typ === "szacowanie"
      ? {
          min: liczbaNaTekst(zadanie.dane.min),
          max: liczbaNaTekst(zadanie.dane.max),
          krok: liczbaNaTekst(zadanie.dane.krok),
          tolerancja: liczbaNaTekst(zadanie.dane.tolerancja),
          jednostka: zadanie.dane.jednostka ?? "",
          poprawna: liczbaNaTekst(zadanie.dane.poprawna),
          poprawna_do: zadanie.dane.poprawna_do === undefined ? "" : liczbaNaTekst(zadanie.dane.poprawna_do),
        }
      : { min: "", max: "", krok: "1", tolerancja: "", jednostka: "", poprawna: "", poprawna_do: "" },
  );
  const [podpowiedzi, setPodpowiedzi] = useState<string[]>(() => zadanie?.dane.podpowiedzi ?? []);
  const [tekst, setTekst] = useState(zadanie?.typ === "ciekawostka" ? zadanie.dane.tekst : "");
  const [odslaniaj, setOdslaniaj] = useState(zadanie?.dane.odslaniaj ?? false);

  const powtorzoneA = powtorzenia(wiersze.map((w) => w.a));
  const powtorzoneB = typ === "pary" ? powtorzenia(wiersze.map((w) => w.b)) : new Set<number>();
  const minimum = MIN_WIERSZY[typ];

  // dane do zapisu; kolejność i pary miesza serwer
  const daneTypu =
    typ === "wybor"
      ? { odpowiedzi: wiersze.map((w) => w.a), poprawna }
      : typ === "prawda_falsz"
        ? { poprawna }
        : typ === "szacowanie"
          ? liczba
          : typ === "ciekawostka"
            ? { tekst }
          : typ === "wielokrotny"
            ? { odpowiedzi: wiersze.map((w) => w.a), poprawna: [...zaznaczone].sort((x, y) => x - y) }
            : typ === "kolejnosc"
              ? { elementy: wiersze.map((w) => w.a) }
              : { pary: wiersze.map((w) => [w.a, w.b]) };
  const dane = { ...daneTypu, podpowiedzi, odslaniaj };
  const zLiczbami = typ === "szacowanie";
  const zWierszami = typ !== "prawda_falsz" && typ !== "ciekawostka" && !zLiczbami;
  // podgląd tolerancji: domyślnie ćwierć zakresu
  const zakres = Number(liczba.max.replace(",", ".")) - Number(liczba.min.replace(",", "."));

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
      {naLiscie && <input type="hidden" name="na_liscie" value="1" />}

      {etapy.length > 0 && (
        <div>
          <label htmlFor={`${uid}-etap`}>Etap</label>
          <select id={`${uid}-etap`} name="etap_id" className="pole" defaultValue={zadanie?.etap_id ?? domyslnyEtap ?? ""}>
            {etapy.map((e) => (
              <option key={e.id} value={e.id}>
                {e.nr}. {e.nazwa} ({napisMnoznika(e.mnoznik)}
                {e.czas_s ? `, ${e.czas_s} s` : ""}
                {e.finalowy ? ", finał trójki" : ""})
              </option>
            ))}
          </select>
        </div>
      )}

      <fieldset>
        <legend>Rodzaj pytania</legend>
        {/* kafelki w kolorach rodzajów (`.rodzaj-pytania`, jak w pilocie i na liście pytań), wybrany wypełniony */}
        <div className="rodzaje-pytan">
          {/* klasyczny quiz (bez etapów) nie ma ciekawostek; istniejącą starą da się dalej edytować */}
          {TYPY_ZADAN.filter((t) => t !== "ciekawostka" || etapy.length > 0 || zadanie?.typ === "ciekawostka").map((t) => (
            <label key={t} className={`rodzaj-pytania ${t}${typ === t ? " wybrana" : ""}`}>
              <input type="radio" name="typ_wybor" value={t} checked={typ === t} onChange={() => zmienTyp(t)} />
              {NAZWY_TYPOW[t]}
            </label>
          ))}
        </div>
      </fieldset>

      <div>
        <label htmlFor={`${uid}-tresc`}>{typ === "ciekawostka" ? "Tytuł ciekawostki" : "Pytanie"}</label>
        <textarea
          id={`${uid}-tresc`}
          name="tresc"
          className="pole"
          defaultValue={zadanie?.tresc}
          required
          maxLength={LIMITY.tresc}
          rows={3}
          autoFocus={!zadanie}
        />
      </div>

      {typ === "ciekawostka" && (
        <div>
          <label htmlFor={`${uid}-ciekawostka`}>{OPISY[typ]}</label>
          <textarea
            id={`${uid}-ciekawostka`}
            className="pole"
            value={tekst}
            onChange={(e) => setTekst(e.target.value)}
            required
            maxLength={LIMITY_CIEKAWOSTKI}
            rows={4}
          />
          <p className="podpowiedz">
            Ciekawostka to plansza bez odpowiedzi i punktów: grafika (poniżej), tytuł i ten tekst. Prowadzący przechodzi
            dalej z pilota. Nie liczy się do numeracji pytań.
          </p>
        </div>
      )}

      {typ === "prawda_falsz" && (
        <fieldset>
          <legend>{OPISY[typ]}</legend>
          <div className="wybor-czasu">
            {PRAWDA_FALSZ.map((napis, i) => (
              <label key={napis} className={`wybor-czasu-opcja${poprawna === i ? " wybrana" : ""}`}>
                <input type="radio" name="pf" checked={poprawna === i} onChange={() => setPoprawna(i)} required />
                {napis}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {zLiczbami && (
        <fieldset>
          <legend>{OPISY[typ]}</legend>
          <div className="pola-liczby">
            {(
              [
                ["poprawna", "Poprawna liczba", "np. 1516"],
                ["poprawna_do", "Poprawna do (przedział)", "np. 9,5"],
                ["jednostka", "Jednostka (opcjonalnie)", "np. %, IBU, rok"],
                ["min", "Suwak od", "np. 1400"],
                ["max", "Suwak do", "np. 1700"],
                ["krok", "Krok suwaka", "1"],
                [
                  "tolerancja",
                  "Zero punktów od odległości",
                  Number.isFinite(zakres) && zakres > 0 ? liczbaZJednostka(zakres / 4) : "ćwierć zakresu",
                ],
              ] as const
            ).map(([pole, napis, przyklad]) => (
              <div key={pole}>
                <label htmlFor={`${uid}-${pole}`}>{napis}</label>
                <input
                  id={`${uid}-${pole}`}
                  className="pole"
                  inputMode={pole === "jednostka" ? "text" : "decimal"}
                  value={liczba[pole]}
                  onChange={(e) => setLiczba((l) => ({ ...l, [pole]: e.target.value }))}
                  placeholder={przyklad}
                  required={pole !== "jednostka" && pole !== "tolerancja" && pole !== "poprawna_do"}
                  maxLength={pole === "jednostka" ? 12 : 16}
                />
              </div>
            ))}
          </div>
          <p className="pomocniczy" style={{ margin: "8px 0 0" }}>
            Gracze ustawiają liczbę suwakiem. Trafienie (co do kroku) to pełne punkty, potem coraz mniej, aż do zera w
            podanej odległości (puste: ćwierć zakresu).
          </p>
        </fieldset>
      )}

      {zWierszami && (
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
      )}

      <PoleGrafiki
        nazwa="grafika"
        etykieta="Grafika do pytania (opcjonalnie)"
        obecna={zadanie?.grafika_url}
        podpowiedz="Pokazuje się na TV i telefonach razem z pytaniem. PNG, JPG, WebP albo SVG, do 5 MB."
      />
      <label className="pole-wyboru">
        <input type="checkbox" checked={odslaniaj} onChange={(e) => setOdslaniaj(e.target.checked)} />
        <span>
          <strong>Odsłaniana grafika:</strong> na początku rozmyta, wyostrza się do końca czasu. Dobre do „zgadnij po
          etykiecie”.
        </span>
      </label>

      <fieldset>
        <legend>Podpowiedzi (opcjonalnie, odsłaniają się po kolei w trakcie pytania)</legend>
        <div className="odpowiedzi">
          {podpowiedzi.map((p, i) => (
            <div key={i} className="odpowiedz">
              <span className="odpowiedz-litera">{i + 1}</span>
              <input
                className="pole"
                value={p}
                onChange={(e) => setPodpowiedzi((l) => l.map((x, j) => (j === i ? e.target.value : x)))}
                maxLength={LIMITY.odpowiedz}
                aria-label={`Podpowiedź ${i + 1}`}
              />
              <button
                type="button"
                className="przycisk-maly ikona niebezpieczny"
                onClick={() => setPodpowiedzi((l) => l.filter((_, j) => j !== i))}
                aria-label={`Usuń podpowiedź ${i + 1}`}
                data-podpis="Usuń"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {podpowiedzi.length < LIMITY.maxPodpowiedzi && (
          <button
            type="button"
            className="przycisk-maly"
            onClick={() => setPodpowiedzi((l) => [...l, ""])}
            style={{ marginTop: podpowiedzi.length ? 10 : 0 }}
          >
            + podpowiedź
          </button>
        )}
        {podpowiedzi.length > 0 && (
          <p className="pomocniczy" style={{ margin: "8px 0 0" }}>
            Pierwsza widać od startu, kolejne co równy kawałek czasu (bez limitu czasu: co 10 s). Z bonusem za szybkość
            późniejsza odpowiedź daje mniej punktów.
          </p>
        )}
      </fieldset>

      <KomunikatFormularza stan={stan} />
      <div className="edytor-przyciski">
        <button type="submit" className="przycisk zloty" disabled={trwa}>
          {trwa ? "Zapisuję…" : zadanie ? "Zapisz pytanie" : "Dodaj pytanie"}
        </button>
        {naLiscie ? (
          <button type="button" className="przycisk" onClick={onZwin} disabled={trwa}>
            Zwiń
          </button>
        ) : (
          // od razu kolejne pytanie w tym samym etapie, bez wracania do listy
          <button type="submit" name="dalej" value="1" className="przycisk" disabled={trwa}>
            {zadanie ? "Zapisz i dodaj nowe" : "Dodaj i następne"}
          </button>
        )}
      </div>
    </form>
  );
}
