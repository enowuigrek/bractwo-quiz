"use client";
/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase albo z /public */

import { useActionState, useState } from "react";
import type { Lokal, StanFormularza } from "@/lib/typy";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../_komponenty/grafika";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { NA_ZAPISY_MIN } from "@/lib/gra/auto";
import { LIMITY } from "../../quizy/limity";
import { uruchomGre } from "../akcje";
import { ZdjecieNagrody } from "./zdjecie-nagrody";

export type QuizDoWyboru = { id: string; tytul: string; pytania: number };

/** `glowny`: zalogowany głównym hasłem (src/lib/admin.ts) widzi „Pijany finał” i widoczność gry. */
type Props = { lokale: Lokal[]; quizy: QuizDoWyboru[]; glowny: boolean };

/** Uruchamianie gry krokami: miasto → lokal → quiz, potem szczegóły. */
/** Godzina od teraz, zaokrąglona do 5 minut w górę: domyślny start zapowiedzi. */
function zaGodzine(): Date {
  const za = new Date(Date.now() + 60 * 60 * 1000);
  za.setMinutes(Math.ceil(za.getMinutes() / 5) * 5, 0, 0);
  return za;
}

/** Data (RRRR-MM-DD, pusta: dziś) i godzina (GG:MM) w czasie lokalnym jako ISO. */
function isoStartu(data: string, godzina: string): string {
  const dzien = data || new Date().toLocaleDateString("sv-SE");
  const czas = new Date(`${dzien}T${godzina}`);
  return Number.isNaN(czas.getTime()) ? "" : czas.toISOString();
}

export function Kreator({ lokale, quizy, glowny }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(uruchomGre, {});

  const miasta = [...new Set(lokale.map((p) => p.miasto).filter((m): m is string => !!m))].sort((a, b) =>
    a.localeCompare(b, "pl"),
  );
  const [miasto, setMiasto] = useState(miasta.length === 1 ? miasta[0] : "");
  const lokaleWMiescie = lokale.filter((p) => p.miasto === miasto);
  const [lokal, setLokal] = useState(lokaleWMiescie.length === 1 ? lokaleWMiescie[0].id : "");
  const [quiz, setQuiz] = useState("");
  const [czas, setCzas] = useState<string>(LIMITY.domyslnyCzas === null ? "bez" : String(LIMITY.domyslnyCzas));
  const bezLimitu = czas === "bez";
  const [ileNagrod, setIleNagrod] = useState(0);
  // pijany finał domyślnie włączony (tylko główny go widzi; obsługa nie wysyła tego pola)
  const [pijany, setPijany] = useState(true);
  // zapowiedź (domyślnie włączona): pokazuje na ekranie lokalu godzinę i odliczanie, wyłączona od razu poczekalnię
  // z QR. Data i godzina w czasie lokalnym przeglądarki, domyślnie godzinę od teraz (pola są dopiero po wyborze
  // quizu, więc serwer ich nie renderuje i godzina z przeglądarki nie gryzie się z HTML-em). Do serwera idzie ISO.
  const [auto, setAuto] = useState(false);
  const [zapowiedz, setZapowiedz] = useState(true);
  const [dataStartu, setDataStartu] = useState(() => zaGodzine().toLocaleDateString("sv-SE"));
  const [godzinaStartu, setGodzinaStartu] = useState(() =>
    zaGodzine().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
  );
  const startIso = zapowiedz && godzinaStartu ? isoStartu(dataStartu, godzinaStartu) : "";

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
            {/* bonus za szybkość jest zawsze; limit tylko odlicza czas, po którym nie da się już odpowiedzieć */}
            <p className="podpowiedz">
              {bezLimitu
                ? "Pytanie trwa, aż odpowiedzą wszyscy albo prowadzący pokaże wynik. Kto szybciej, ten więcej: dobra odpowiedź daje 1000 pkt na starcie i coraz mniej, do 500 po 30 s (wielokrotny, pary i kolejność: po 60 s)."
                : "Czas się odlicza i kto nie zdąży, nie odpowie. Dobra odpowiedź daje 500–1000 pkt: im szybciej, tym więcej."}
            </p>
          </fieldset>

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
                        placeholder={m === 1 ? "np. Lane Piwo gratis" : "Nagroda"}
                        aria-label={`Nagroda za ${m}. miejsce`}
                        maxLength={LIMITY.nagroda}
                        required
                      />
                      <input
                        name={`instrukcja_${m}`}
                        className="pole pole-male"
                        placeholder="Jak odebrać, np. przy barze"
                        aria-label={`Jak odebrać nagrodę za ${m}. miejsce`}
                        maxLength={LIMITY.instrukcja}
                      />
                      <ZdjecieNagrody miejsce={m} />
                    </div>
                  </div>
                ))}
                <p className="podpowiedz">
                  Nagroda pokaże się na podium na TV, a zwycięzca zobaczy ją na telefonie razem z instrukcją. Zdjęcie nagrody
                  stoi też przy szklance w wyścigu i na planszy finału.
                </p>
              </div>
            )}
          </fieldset>

          {/* tylko główny: obsługa nie wie o pijanym finale, a gry głównego są domyślnie ukryte przed nią */}
          {glowny && (
            <>
              <fieldset>
                <legend>Widoczność</legend>
                <label className="przelacznik">
                  <input type="checkbox" name="tylko_glowny" defaultChecked /> tylko dla mnie (obsługa nie zobaczy tej
                  gry w panelu)
                </label>
              </fieldset>

              <fieldset>
                <legend>Pijany finał</legend>
                <label className="przelacznik">
                  <input
                    type="checkbox"
                    name="pijany_final"
                    checked={pijany}
                    onChange={(e) => setPijany(e.target.checked)}
                  />{" "}
                  po finale dogrywka „Pijany finał”
                </label>
                <p className="podpowiedz">
                  Wynik jest już ustalony (prowadzący go widzi na pilocie), a gracze przez 60 s odpowiadają jeszcze na
                  pytania, które nic nie liczą, z coraz większym chaosem na ekranach. Tryb jest ukryty: telefony i TV udają, że finał
                  trwa dalej (pytanie 15/14…). Potem werble i podium. Działa w quizie z finałem serią. Pytania zmieniasz
                  w Quizy → Pijany finał.
                </p>
                {pijany && (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor="za_barem">Kto dziś stoi za barem (opcjonalnie)</label>
                    <input id="za_barem" name="za_barem" className="pole" placeholder="np. Kasia" maxLength={40} />
                    <p className="podpowiedz">Do pytania z {"{za_barem}"}. Bez imienia to pytanie odpada.</p>
                  </div>
                )}
              </fieldset>
            </>
          )}

          <fieldset>
            <legend>Zapowiedź</legend>
            <label className="przelacznik">
              <input type="checkbox" checked={zapowiedz} onChange={(e) => setZapowiedz(e.target.checked)} />{" "}
              najpierw zapowiedź z godziną startu
            </label>
            {zapowiedz && (
              <div className="wiersz-pol start-pola" style={{ marginTop: 10 }}>
                <div>
                  <label htmlFor="start_data">Data</label>
                  <input
                    id="start_data"
                    type="date"
                    className="pole"
                    value={dataStartu}
                    onChange={(e) => setDataStartu(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="start_godzina">Godzina</label>
                  <input
                    id="start_godzina"
                    type="time"
                    className="pole"
                    value={godzinaStartu}
                    onChange={(e) => setGodzinaStartu(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <input type="hidden" name="planowany_start" value={startIso} />
            <input type="hidden" name="start_tryb" value={zapowiedz ? "zapowiedz" : "teraz"} />
            <p className="podpowiedz">
              {zapowiedz
                ? auto
                  ? "Ekran lokalu pokaże godzinę i odliczanie, a o tej godzinie sam pokaże poczekalnię z kodem QR."
                  : "Ekran lokalu pokaże godzinę i odliczanie, a QR pojawi się, gdy prowadzący otworzy poczekalnię na pilocie."
                : "Bez zapowiedzi TV od razu pokazuje poczekalnię z kodem QR."}
            </p>
          </fieldset>

          <fieldset>
            <legend>Prowadzenie</legend>
            <label className="przelacznik">
              <input type="checkbox" name="auto" checked={auto} onChange={(e) => setAuto(e.target.checked)} />{" "}
              prowadzenie automatyczne
            </label>
            <p className="podpowiedz">
              {!auto
                ? "Każdy krok klika prowadzący na pilocie."
                : zapowiedz
                  ? `Gra prowadzi się sama: o godzinie startu otwiera poczekalnię, po ${NA_ZAPISY_MIN} minutach na dołączenie startuje quiz (jeśli ktoś dołączył) i dalej klika kolejne kroki. Na pilocie możesz w każdej chwili wyłączyć automat albo włączyć go z powrotem.`
                  : "Gra prowadzi się sama od startu, który klikasz na pilocie. Na pilocie możesz w każdej chwili wyłączyć automat albo włączyć go z powrotem."}
            </p>
          </fieldset>

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
              placeholder="Nazwa browaru"
              aria-label="Nazwa gościnnego browaru"
              maxLength={80}
            />
            <input
              name="browar_instagram"
              className="pole"
              style={{ marginTop: 10 }}
              placeholder="Instagram, np. @browar"
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
            <button type="submit" className="przycisk zloty" disabled={trwa || (zapowiedz && !startIso)}>
              {trwa ? "Zapisuję…" : zapowiedz ? "Uruchom grę z zapowiedzią" : "Uruchom grę"}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
