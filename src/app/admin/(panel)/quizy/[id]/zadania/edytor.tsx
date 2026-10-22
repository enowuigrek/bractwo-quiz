"use client";

import { useActionState, useState } from "react";
import type { StanFormularza, Zadanie } from "@/lib/typy";
import { bezResetu } from "../../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../../_komponenty/grafika";
import { KomunikatFormularza } from "../../../_komponenty/stan";
import { zapiszZadanie } from "../../akcje";
import { LIMITY } from "../../limity";

const LITERY = "ABCDEF";
const DOMYSLNY_CZAS = 20;

type Props = { quizId: string; zadanie?: Zadanie };

/** Edytor zadania typu „wybór”: pytanie, 2–6 odpowiedzi, jedna poprawna. */
export function EdytorZadania({ quizId, zadanie }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(
    zapiszZadanie.bind(null, quizId, zadanie?.id ?? null),
    {},
  );

  // klucze, żeby React nie mieszał pól przy usuwaniu odpowiedzi ze środka
  const [odpowiedzi, setOdpowiedzi] = useState(() =>
    (zadanie?.dane.odpowiedzi ?? ["", "", "", ""]).map((tekst, i) => ({ klucz: i, tekst })),
  );
  const [poprawna, setPoprawna] = useState<number | null>(zadanie?.dane.poprawna ?? null);
  const [nastepnyKlucz, setNastepnyKlucz] = useState(odpowiedzi.length);
  const [bezLimitu, setBezLimitu] = useState(zadanie ? zadanie.czas_s === null : false);

  // te same odpowiedzi (bez względu na wielkość liter) podświetlamy od razu, przed zapisem
  const porownanie = odpowiedzi.map((o) => o.tekst.trim().toLocaleLowerCase("pl"));
  const powtorzona = (i: number) => !!porownanie[i] && porownanie.indexOf(porownanie[i]) !== porownanie.lastIndexOf(porownanie[i]);
  const literyPowtorzen = odpowiedzi.map((_, i) => i).filter(powtorzona).map((i) => LITERY[i]);

  function dodaj() {
    setOdpowiedzi((o) => [...o, { klucz: nastepnyKlucz, tekst: "" }]);
    setNastepnyKlucz((k) => k + 1);
  }

  function usun(i: number) {
    setOdpowiedzi((o) => o.filter((_, j) => j !== i));
    setPoprawna((p) => (p === null || p === i ? null : p > i ? p - 1 : p));
  }

  function zmien(i: number, tekst: string) {
    setOdpowiedzi((o) => o.map((x, j) => (j === i ? { ...x, tekst } : x)));
  }

  return (
    <form {...bezResetu(akcja)} className="formularz">
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
        <legend>Odpowiedzi (kliknij literę poprawnej)</legend>
        <div className="odpowiedzi">
          {odpowiedzi.map((o, i) => (
            <div key={o.klucz} className="odpowiedz">
              <label className="odpowiedz-litera" title="Poprawna odpowiedź">
                <input
                  type="radio"
                  name="poprawna"
                  value={i}
                  checked={poprawna === i}
                  onChange={() => setPoprawna(i)}
                  required
                  aria-label={`Odpowiedź ${LITERY[i]} jest poprawna`}
                />
                {LITERY[i]}
              </label>
              <input
                name="odpowiedz"
                className={`pole${powtorzona(i) ? " pole-zle" : ""}`}
                aria-invalid={powtorzona(i) || undefined}
                value={o.tekst}
                onChange={(e) => zmien(i, e.target.value)}
                required
                maxLength={LIMITY.odpowiedz}
                aria-label={`Odpowiedź ${LITERY[i]}`}
              />
              <button
                type="button"
                className="przycisk-maly ikona niebezpieczny"
                onClick={() => usun(i)}
                disabled={odpowiedzi.length <= LIMITY.minOdpowiedzi}
                aria-label={`Usuń odpowiedź ${LITERY[i]}`}
                data-podpis="Usuń"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
        {literyPowtorzen.length > 0 && (
          <p className="blad" role="alert" style={{ margin: "8px 0 0" }}>
            Odpowiedzi {literyPowtorzen.join(" i ")} są takie same. Popraw je przed zapisem.
          </p>
        )}
        {odpowiedzi.length < LIMITY.maxOdpowiedzi && (
          <button type="button" className="przycisk-maly" onClick={dodaj} style={{ marginTop: 10 }}>
            + odpowiedź
          </button>
        )}
      </fieldset>

      <div>
        <div className="wiersz-pol wiersz-czasu">
          <div>
            <label htmlFor="czas_s">Czas na odpowiedź (s)</label>
            <input
              id="czas_s"
              name="czas_s"
              type="number"
              inputMode="numeric"
              className="pole"
              defaultValue={zadanie?.czas_s ?? DOMYSLNY_CZAS}
              min={LIMITY.minCzas}
              max={LIMITY.maxCzas}
              required={!bezLimitu}
              disabled={bezLimitu}
            />
          </div>
          <label className="przelacznik">
            <input type="checkbox" name="bez_limitu" checked={bezLimitu} onChange={(e) => setBezLimitu(e.target.checked)} />
            Bez limitu czasu
          </label>
        </div>
        {bezLimitu && (
          <p className="podpowiedz">
            Pytanie trwa, aż odpowiedzą wszyscy albo prowadzący pokaże wynik. Bez bonusu za szybkość: poprawna
            odpowiedź daje 1000 pkt.
          </p>
        )}
      </div>

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
