"use client";
/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase albo z /public */

import { useActionState, useState } from "react";
import type { Lokal, StanFormularza } from "@/lib/typy";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { PoleGrafiki } from "../../_komponenty/grafika";
import { MAX_GRACZY } from "@/lib/gra/wyscig";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { LIMITY, liczbaPytan } from "../../quizy/limity";
import { NAZWY_RODZAJOW, wszystkieTagi, type RodzajQuizu } from "@/lib/tagi";
import { uruchomGre } from "../akcje";
import { ZdjecieNagrody } from "./zdjecie-nagrody";
import { IkonaMiasto, IkonaPodium1, IkonaPodium3, IkonaPubQuiz, IkonaWyscig } from "@/components/ikony";

export type QuizDoWyboru = {
  id: string;
  tytul: string;
  pytania: number;
  tagi: string[];
  /** Klasyczny pub quiz (bez etapów) ma mniej opcji: bez pijanego finału, kranoprzejęcia i grafiki. */
  rodzaj: RodzajQuizu;
  /** Finał serią, po którym może być pijany finał. */
  pijany: boolean;
};

/** `glowny`: zalogowany głównym hasłem (src/lib/admin.ts) ustawia widoczność gry; lokal dostaje tylko swój lokal. */
type Props = { lokale: Lokal[]; quizy: QuizDoWyboru[]; glowny: boolean };

/** „1 lokal”, „3 lokale”, „5 lokali”. */
function liczbaLokali(n: number): string {
  if (n === 1) return "1 lokal";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "lokale" : "lokali"}`;
}

/** „1 quiz”, „3 quizy”, „5 quizów”. */
function liczbaQuizow(n: number): string {
  if (n === 1) return "1 quiz";
  const r10 = n % 10;
  const r100 = n % 100;
  return `${n} ${r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "quizy" : "quizów"}`;
}

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

/** Uruchamianie gry krokami (kafelki): miasto → lokal → rodzaj → quiz (z tematem), potem szczegóły. */
export function Kreator({ lokale, quizy, glowny }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(uruchomGre, {});

  const miasta = [...new Set(lokale.map((p) => p.miasto).filter((m): m is string => !!m))].sort((a, b) =>
    a.localeCompare(b, "pl"),
  );
  const [miasto, setMiasto] = useState(miasta.length === 1 ? miasta[0] : "");
  const lokaleWMiescie = lokale.filter((p) => p.miasto === miasto);
  const [lokal, setLokal] = useState(
    lokaleWMiescie.length === 1 ? lokaleWMiescie[0].id : lokale.length === 1 ? lokale[0].id : "",
  );
  // quiz w trzech krokach: rodzaj, temat (opcjonalnie), quiz z listy już przefiltrowanej
  const [rodzaj, setRodzaj] = useState<RodzajQuizu>("wyscig");
  const [temat, setTemat] = useState<string | null>(null);
  const [quiz, setQuiz] = useState("");
  const wRodzaju = quizy.filter((q) => q.rodzaj === rodzaj);
  const tematy = wszystkieTagi(wRodzaju);
  const doWyboru = temat ? wRodzaju.filter((q) => q.tagi.includes(temat)) : wRodzaju;
  const wybrany = quizy.find((q) => q.id === quiz);
  const klasyczny = wybrany?.rodzaj === "klasyczny";
  const [czas, setCzas] = useState<string>(LIMITY.domyslnyCzas === null ? "bez" : String(LIMITY.domyslnyCzas));
  const [ileNagrod, setIleNagrod] = useState(0);
  // pijany finał domyślnie włączony (od 26.10 włącza go też lokal)
  const [pijany, setPijany] = useState(true);
  // zapowiedź (domyślnie włączona): pokazuje na ekranie lokalu godzinę i odliczanie, wyłączona od razu poczekalnię
  // z QR. Data i godzina w czasie lokalnym przeglądarki, domyślnie godzinę od teraz (pola są dopiero po wyborze
  // quizu, więc serwer ich nie renderuje i godzina z przeglądarki nie gryzie się z HTML-em). Do serwera idzie ISO.
  // automat domyślnie przy klasycznym (przełącza wybór rodzaju niżej), przy wyścigu prowadzi człowiek
  const [auto, setAuto] = useState(false);
  const [zapowiedz, setZapowiedz] = useState(true);
  const [wydarzenie, setWydarzenie] = useState(false);
  const [dataStartu, setDataStartu] = useState(() => zaGodzine().toLocaleDateString("sv-SE"));
  const [godzinaStartu, setGodzinaStartu] = useState(() =>
    zaGodzine().toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
  );
  const startIso = zapowiedz && godzinaStartu ? isoStartu(dataStartu, godzinaStartu) : "";

  // panel lokalu: jeden lokal, więc bez kroków miasta i lokalu (numeracja od rodzaju)
  const bezWyboruLokalu = !glowny && lokale.length === 1;
  const krok = (n: number) => (bezWyboruLokalu ? n - 2 : n);

  function wybierzMiasto(m: string) {
    setMiasto(m);
    const nowe = lokale.filter((p) => p.miasto === m);
    setLokal(nowe.length === 1 ? nowe[0].id : "");
  }

  return (
    <form {...bezResetu(akcja)} className="formularz kreator">
      {/* kafelki zamiast list (26.10, Łukasz): miasto, lokal, rodzaj i quiz wybiera się jednym dotknięciem */}
      {bezWyboruLokalu && <input type="hidden" name="lokal_id" value={lokale[0].id} />}
      {!bezWyboruLokalu && (
      <fieldset>
        <legend className="krok">
          <span className="krok-nr">1</span> Miasto
        </legend>
        <div className="kafelki">
          {miasta.map((m) => (
            <label key={m} className="kafelek">
              <input type="radio" name="miasto" checked={miasto === m} onChange={() => wybierzMiasto(m)} required />
              <span className="kafelek-ikona">
                <IkonaMiasto />
              </span>
              <strong>{m}</strong>
              <span className="kafelek-opis">{liczbaLokali(lokale.filter((p) => p.miasto === m).length)}</span>
            </label>
          ))}
        </div>
      </fieldset>

      )}

      {miasto && !bezWyboruLokalu && (
        <fieldset>
          <legend className="krok">
            <span className="krok-nr">2</span> Lokal
          </legend>
          {/* równe kafelki; z logo bez podpisu (logo wystarcza), bez logo sama nazwa */}
          <div className="kafelki kafelki-lokali">
            {lokaleWMiescie.map((p) => (
              <label key={p.id} className="kafelek" title={p.nazwa}>
                <input
                  type="radio"
                  name="lokal_id"
                  value={p.id}
                  checked={lokal === p.id}
                  onChange={() => setLokal(p.id)}
                  required
                />
                {p.logo_url ? <img src={p.logo_url} alt={p.nazwa} /> : <strong>{p.nazwa}</strong>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {lokal && (
        <fieldset>
          <legend className="krok">
            <span className="krok-nr">{krok(3)}</span> Rodzaj
          </legend>
          <div className="kafelki kafelki-dwa">
            {(["wyscig", "klasyczny"] as const).map((r) => (
              <label key={r} className="kafelek">
                <input
                  type="radio"
                  name="rodzaj_quizu"
                  checked={rodzaj === r}
                  onChange={() => {
                    setRodzaj(r);
                    setTemat(null);
                    setQuiz("");
                    // klasyczny zwykle leci sam: godzina startu i automat, prowadzący tylko zagląda
                    setAuto(r === "klasyczny");
                  }}
                />
                <span className="kafelek-ikona duza">{r === "wyscig" ? <IkonaWyscig /> : <IkonaPubQuiz />}</span>
                <strong>{r === "wyscig" ? NAZWY_RODZAJOW[r] : "Pub quiz"}</strong>
                <span className="kafelek-opis">{liczbaQuizow(quizy.filter((q) => q.rodzaj === r).length)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {lokal && (
        <fieldset>
          <legend className="krok">
            <span className="krok-nr">{krok(4)}</span> Quiz
          </legend>
          {tematy.length > 0 && (
            <p className="tagi" style={{ margin: "0 0 14px" }}>
              <button type="button" className={`tag${temat ? "" : " wybrany"}`} onClick={() => setTemat(null)}>
                wszystkie
              </button>
              {tematy.map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`tag${temat === t ? " wybrany" : ""}`}
                  onClick={() => {
                    setTemat(t);
                    if (wybrany && !wybrany.tagi.includes(t)) setQuiz("");
                  }}
                >
                  {t}
                </button>
              ))}
            </p>
          )}
          <div className="kafelki kafelki-quizow">
            {doWyboru.map((q) => (
              <label key={q.id} className={`kafelek kafelek-quizu${q.pytania === 0 ? " pusty" : ""}`}>
                <input
                  type="radio"
                  name="quiz_id"
                  value={q.id}
                  checked={quiz === q.id}
                  onChange={() => setQuiz(q.id)}
                  disabled={q.pytania === 0}
                  required
                />
                <strong>{q.tytul}</strong>
                <span className="kafelek-opis">
                  {q.pytania === 0 ? "brak pytań" : liczbaPytan(q.pytania)}
                  {q.tagi.length > 0 && ` · ${q.tagi.join(", ")}`}
                </span>
              </label>
            ))}
          </div>
          {doWyboru.length === 0 && <p className="podpowiedz">Nie ma jeszcze takiego quizu. Dodaj go w zakładce „Quizy”.</p>}
        </fieldset>
      )}

      {quiz && (
        <>
          <div>
            <label htmlFor="okazja">Nazwa (opcjonalnie, widać ją na TV)</label>
            <input id="okazja" name="okazja" className="pole" placeholder="np. Dzień Porteru" maxLength={80} />
          </div>

          <fieldset>
            <legend>Czas na odpowiedź</legend>
            {/* równe przyciski; „∞” to bez limitu (kto szybciej, ten więcej, aż odpowiedzą wszyscy) */}
            <div className="wybor-rowny">
              {LIMITY.czasyGry.map((c) => {
                const wartosc = c === null ? "bez" : String(c);
                return (
                  <label
                    key={wartosc}
                    className={`wybor-czasu-opcja${czas === wartosc ? " wybrana" : ""}`}
                    title={c === null ? "bez limitu" : undefined}
                  >
                    <input
                      type="radio"
                      name="czas_s"
                      value={wartosc}
                      checked={czas === wartosc}
                      onChange={() => setCzas(wartosc)}
                      aria-label={c === null ? "bez limitu" : `${c} sekund`}
                    />
                    {c === null ? <span className="wybor-nieskonczonosc">∞</span> : `${c} s`}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <fieldset>
            <legend>Nagrody</legend>
            <label className="przelacznik">
              <input type="checkbox" checked={ileNagrod > 0} onChange={(e) => setIleNagrod(e.target.checked ? 1 : 0)} />{" "}
              z nagrodami
            </label>
            <input type="hidden" name="nagrody" value={ileNagrod} />
            {ileNagrod > 0 && (
              <>
                <div className="kafelki kafelki-dwa" style={{ marginTop: 12 }}>
                  {[
                    { ile: 1, napis: "1. miejsce", ikona: <IkonaPodium1 /> },
                    { ile: 3, napis: "pierwsza trójka", ikona: <IkonaPodium3 /> },
                  ].map((o) => (
                    <button
                      key={o.ile}
                      type="button"
                      className={`kafelek${ileNagrod === o.ile ? " wybrany" : ""}`}
                      aria-pressed={ileNagrod === o.ile}
                      onClick={() => setIleNagrod(o.ile)}
                    >
                      <span className="kafelek-ikona duza">{o.ikona}</span>
                      <span className="kafelek-opis">{o.napis}</span>
                    </button>
                  ))}
                </div>
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
                </div>
              </>
            )}
          </fieldset>

          {/* tylko główny: jego gry są domyślnie ukryte przed panelem lokalu, w którym grał */}
          {glowny && (
              <fieldset>
                <legend>Widoczność</legend>
                <label className="przelacznik">
                  <input type="checkbox" name="tylko_glowny" defaultChecked /> tylko dla mnie (lokal nie zobaczy tej
                  gry w swoim panelu)
                </label>
              </fieldset>
          )}

              {/* pijany finał tylko po finale wyścigu po piwo (klasyczny pub quiz nie ma finału) */}
              {wybrany?.pijany && (
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
                  {pijany && (
                    <div style={{ marginTop: 10 }}>
                      <label htmlFor="za_barem">Kto dziś stoi za barem (opcjonalnie)</label>
                      <input id="za_barem" name="za_barem" className="pole" placeholder="np. Kasia" maxLength={40} />
                    </div>
                  )}
                </fieldset>
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
          </fieldset>

          <fieldset>
            <legend>Prowadzenie</legend>
            <label className="przelacznik">
              <input type="checkbox" name="auto" checked={auto} onChange={(e) => setAuto(e.target.checked)} />{" "}
              prowadzenie automatyczne
            </label>
          </fieldset>

          <div>
            <label htmlFor="max_graczy">Limit graczy</label>
            <input
              id="max_graczy"
              name="max_graczy"
              type="number"
              inputMode="numeric"
              className="pole"
              defaultValue={MAX_GRACZY}
              min={1}
              max={MAX_GRACZY}
              required
            />
          </div>

          {/* wydarzenie (kranoprzejęcie; grafika na poczekalnię wyłączona 26.10) tylko w wyścigu: klasyczny pub quiz to mniejsza impreza */}
          {!klasyczny && (
            <fieldset>
              <legend>Wydarzenie</legend>
              <label className="przelacznik">
                <input type="checkbox" checked={wydarzenie} onChange={(e) => setWydarzenie(e.target.checked)} />{" "}
                kranoprzejęcie (gościnny browar)
              </label>
              {wydarzenie && (
                <div className="kreator-wydarzenie">
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
                    placeholder="Instagram, np. @browar"
                    aria-label="Instagram browaru"
                    maxLength={60}
                  />
                  <PoleGrafiki nazwa="browar_logo" etykieta="Logo browaru" />
                </div>
              )}
            </fieldset>
          )}

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
