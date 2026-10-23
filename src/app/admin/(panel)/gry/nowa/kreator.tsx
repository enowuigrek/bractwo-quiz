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
  const [ileNagrod, setIleNagrod] = useState(0);
  // godzina startu z pola `datetime-local` (czas lokalny przeglądarki), do serwera idzie jako ISO
  const [start, setStart] = useState("");
  const startIso = start ? new Date(start).toISOString() : "";

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

          <fieldset>
            <legend>Nagrody</legend>
            <div className="wybor-czasu">
              {[
                { ile: 0, napis: "bez nagród" },
                { ile: 1, napis: "za 1. miejsce" },
                { ile: 3, napis: "za pierwszą trójkę" },
              ].map((o) => (
                <label key={o.ile} className={`wybor-czasu-opcja${ileNagrod === o.ile ? " wybrana" : ""}`}>
                  <input
                    type="radio"
                    name="nagrody"
                    value={o.ile}
                    checked={ileNagrod === o.ile}
                    onChange={() => setIleNagrod(o.ile)}
                  />
                  {o.napis}
                </label>
              ))}
            </div>
            {ileNagrod > 0 && (
              <div className="nagrody-pola">
                {Array.from({ length: ileNagrod }, (_, i) => i + 1).map((m) => (
                  <div key={m} className="nagroda-pole">
                    <span className="krok-nr">{m}.</span>
                    <div>
                      <input
                        name={`nagroda_${m}`}
                        className="pole"
                        placeholder={m === 1 ? "Nagroda, np. Lane Piwo gratis" : "Nagroda"}
                        aria-label={`Nagroda za ${m}. miejsce`}
                        maxLength={LIMITY.nagroda}
                        required
                      />
                      <input
                        name={`instrukcja_${m}`}
                        className="pole pole-male"
                        placeholder="Jak odebrać (opcjonalnie), np. Pokaż ten ekran barmanowi"
                        aria-label={`Jak odebrać nagrodę za ${m}. miejsce`}
                        maxLength={LIMITY.instrukcja}
                      />
                    </div>
                  </div>
                ))}
                <p className="podpowiedz">
                  Nagroda pokaże się na podium na TV, a zwycięzca zobaczy ją na telefonie razem z instrukcją.
                </p>
              </div>
            )}
          </fieldset>

          <div>
            <label htmlFor="start">Godzina startu (opcjonalnie)</label>
            <input
              id="start"
              type="datetime-local"
              className="pole"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
            <input type="hidden" name="planowany_start" value={startIso} />
            <p className="podpowiedz">
              Potrzebna do zapowiedzi: ekran lokalu pokaże godzinę i odliczanie, a prowadzący widzi je na pilocie.
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

          <fieldset>
            <legend>Kranoprzejęcie (opcjonalnie)</legend>
            <input
              name="browar_nazwa"
              className="pole"
              placeholder="Nazwa gościnnego browaru"
              aria-label="Nazwa gościnnego browaru"
              maxLength={80}
            />
            <input
              name="browar_instagram"
              className="pole"
              style={{ marginTop: 10 }}
              placeholder="Instagram browaru (opcjonalnie), np. @browar"
              aria-label="Instagram browaru"
              maxLength={60}
            />
            <div style={{ marginTop: 10 }}>
              <PoleGrafiki
                nazwa="browar_logo"
                etykieta="Logo browaru"
                podpowiedz="Pokaże się na TV obok logo lokalu. Najlepiej z przezroczystym tłem, do 5 MB."
              />
            </div>
          </fieldset>

          <PoleGrafiki
            nazwa="grafika"
            etykieta="Grafika na poczekalnię (opcjonalnie)"
            podpowiedz="Np. plakat wydarzenia. Pokazuje się na TV pod tytułem. PNG, JPG, WebP albo SVG, do 5 MB."
          />

          <KomunikatFormularza stan={stan} />
          <div className="kreator-przyciski">
            <button type="submit" name="start_tryb" value="teraz" className="przycisk zloty" disabled={trwa}>
              {trwa ? "Zapisuję…" : "Uruchom grę"}
            </button>
            <button
              type="submit"
              name="start_tryb"
              value="zapowiedz"
              className="przycisk"
              disabled={trwa || !startIso}
              title={startIso ? undefined : "Najpierw ustaw godzinę startu"}
            >
              Zapowiedz na ekranie lokalu
            </button>
          </div>
          <p className="podpowiedz">
            „Uruchom grę” od razu pokazuje na TV kod QR. „Zapowiedz” pokazuje na ekranie lokalu godzinę i odliczanie, a QR
            pojawi się, gdy prowadzący otworzy poczekalnię na pilocie.
          </p>
        </>
      )}
    </form>
  );
}
