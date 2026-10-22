"use client";
/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase albo z /public */

import { useActionState, useState } from "react";
import type { Lokal, StanFormularza } from "@/lib/typy";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../_komponenty/grafika";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { LIMITY } from "../../quizy/limity";
import { uruchomGre } from "../akcje";

export type QuizDoWyboru = { id: string; tytul: string; pytania: number };

type Props = { lokale: Lokal[]; quizy: QuizDoWyboru[] };

/** Uruchamianie gry krokami: miasto → lokal → quiz, potem szczegóły. */
export function Kreator({ lokale, quizy }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(uruchomGre, {});

  const miasta = [...new Set(lokale.map((p) => p.miasto).filter((m): m is string => !!m))].sort((a, b) =>
    a.localeCompare(b, "pl"),
  );
  const [miasto, setMiasto] = useState(miasta.length === 1 ? miasta[0] : "");
  const lokaleWMiescie = lokale.filter((p) => p.miasto === miasto);
  const [lokal, setLokal] = useState(lokaleWMiescie.length === 1 ? lokaleWMiescie[0].id : "");
  const [quiz, setQuiz] = useState("");
  const [czas, setCzas] = useState<string>(String(LIMITY.domyslnyCzas));
  const bezLimitu = czas === "bez";

  function wybierzMiasto(m: string) {
    setMiasto(m);
    const nowe = lokale.filter((p) => p.miasto === m);
    setLokal(nowe.length === 1 ? nowe[0].id : "");
  }

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <div>
        <label htmlFor="miasto" className="krok">
          <span className="krok-nr">1</span> Miasto
        </label>
        <select id="miasto" className="pole" value={miasto} onChange={(e) => wybierzMiasto(e.target.value)} required>
          <option value="" disabled>
            Wybierz miasto…
          </option>
          {miasta.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {miasto && (
        <fieldset>
          <legend className="krok">
            <span className="krok-nr">2</span> Lokal
          </legend>
          <div className="kafelki">
            {lokaleWMiescie.map((p) => (
              <label key={p.id} className="kafelek">
                <input
                  type="radio"
                  name="lokal_id"
                  value={p.id}
                  checked={lokal === p.id}
                  onChange={() => setLokal(p.id)}
                  required
                />
                {p.logo_url ? <img src={p.logo_url} alt="" /> : <span className="miniatura-pusta" />}
                {p.nazwa}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {lokal && (
        <div>
          <label htmlFor="quiz_id" className="krok">
            <span className="krok-nr">3</span> Quiz
          </label>
          <select id="quiz_id" name="quiz_id" className="pole" value={quiz} onChange={(e) => setQuiz(e.target.value)} required>
            <option value="" disabled>
              Wybierz quiz…
            </option>
            {quizy.map((q) => (
              <option key={q.id} value={q.id} disabled={q.pytania === 0}>
                {q.tytul} ({q.pytania === 0 ? "brak pytań" : `pytań: ${q.pytania}`})
              </option>
            ))}
          </select>
          {quizy.length === 0 && <p className="podpowiedz">Najpierw dodaj quiz w zakładce „Quizy”.</p>}
        </div>
      )}

      {quiz && (
        <>
          <div>
            <label htmlFor="okazja">Okazja (opcjonalnie, widać ją na TV)</label>
            <input id="okazja" name="okazja" className="pole" placeholder="np. Dzień Porteru" maxLength={80} />
          </div>

          <fieldset>
            <legend>Tryb</legend>
            <label className="przelacznik">
              <input type="radio" name="tryb" value="solo" defaultChecked /> każdy gra sam
            </label>
            <label className="przelacznik">
              <input type="radio" name="tryb" value="druzyny" /> drużyny (jeden telefon na drużynę)
            </label>
          </fieldset>

          <fieldset>
            <legend>Czas na odpowiedź (każde pytanie)</legend>
            <div className="wybor-czasu">
              {LIMITY.czasyGry.map((c) => {
                const wartosc = c === null ? "bez" : String(c);
                return (
                  <label key={wartosc} className={`wybor-czasu-opcja${czas === wartosc ? " wybrana" : ""}`}>
                    <input
                      type="radio"
                      name="czas_s"
                      value={wartosc}
                      checked={czas === wartosc}
                      onChange={() => setCzas(wartosc)}
                    />
                    {c === null ? "bez limitu" : `${c} s`}
                  </label>
                );
              })}
            </div>
            {bezLimitu && (
              <p className="podpowiedz">
                Pytanie trwa, aż odpowiedzą wszyscy albo prowadzący pokaże wynik.
              </p>
            )}
          </fieldset>

          <div>
            <label className="przelacznik">
              <input type="checkbox" name="bonus_czas" defaultChecked disabled={bezLimitu} /> bonus za szybkość
            </label>
            <p className="podpowiedz">
              {bezLimitu
                ? "Bez limitu czasu nie ma bonusu: poprawna odpowiedź zawsze daje 1000 pkt."
                : "Z bonusem poprawna odpowiedź daje 500–1000 pkt zależnie od czasu, bez niego zawsze 1000."}
            </p>
          </div>

          <div className="wiersz-pol">
            <div>
              <label htmlFor="max_graczy">Limit graczy</label>
              <input
                id="max_graczy"
                name="max_graczy"
                type="number"
                inputMode="numeric"
                className="pole"
                defaultValue={30}
                min={1}
                max={500}
                required
              />
            </div>
          </div>

          <PoleGrafiki
            nazwa="grafika"
            etykieta="Grafika na poczekalnię (opcjonalnie)"
            podpowiedz="Np. plakat wydarzenia. Pokazuje się na TV pod tytułem. PNG, JPG, WebP albo SVG, do 5 MB."
          />

          <KomunikatFormularza stan={stan} />
          <button type="submit" className="przycisk zloty" disabled={trwa}>
            {trwa ? "Uruchamiam…" : "Uruchom grę"}
          </button>
        </>
      )}
    </form>
  );
}
