"use client";
/* eslint-disable @next/next/no-img-element -- grafiki pytań z bucketu Supabase */

import { useState } from "react";
import { fazaTeraz, komunikatBledu, sekundy } from "@/lib/gra/nasluch";
import type { MojWynik, StanSesji, WierszRankingu, ZapisOdpowiedzi } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { LITERY, PODPOWIEDZI_TYPOW, liczbaCzesci, ulamek, type DaneOdpowiedzi } from "@/lib/zadania";
import { OdpowiedzKolejnosc, OdpowiedzPary, OdpowiedzWielokrotna, Rozwiazanie } from "./odpowiadanie";

const POWODY: Record<Exclude<ZapisOdpowiedzi, { przyjeta: true }>["powod"], string> = {
  po_czasie: "Za późno, czas minął.",
  za_wczesnie: "Pytanie jeszcze się nie zaczęło. Spróbuj za chwilę.",
  nie_teraz: "To pytanie już się skończyło.",
  inne_zadanie: "To pytanie już się skończyło.",
  juz_odpowiedziano: "Twoja odpowiedź jest już zapisana.",
};

export type Ja = { nick: string; token: string };

type Wyslana = {
  zadanieId: string;
  dane: DaneOdpowiedzi;
  czasMs: number | null;
};

/** Telefon gracza w fazach przygotuj → pytanie → wynik. */
export function Rozgrywka({
  stan,
  ja,
  moj,
  teraz,
  odswiez,
}: {
  stan: StanSesji;
  ja: Ja;
  moj: MojWynik | null;
  teraz: number;
  odswiez: () => Promise<void>;
}) {
  const [wyslana, ustawWyslana] = useState<Wyslana | null>(null);
  const [wysylam, ustawWysylam] = useState(false);
  const [blad, ustawBlad] = useState<{
    zadanieId: string;
    tekst: string;
  } | null>(null);

  const z = stan.zadanie;
  const { faza, doStartu, doKonca, czasMinal, bezLimitu } = fazaTeraz(stan, teraz);
  const liczba = stan.quiz?.liczba_zadan ?? "?";

  if (!z) {
    return <p className="pomocniczy">Patrz na telewizor.</p>;
  }

  // Odpowiedź z tego telefonu albo, po odświeżeniu strony, zapisana w bazie.
  const mojaZBazy = moj && moj.zadanie_nr === z.nr ? moj.odpowiedz : null;
  const lokalna = wyslana?.zadanieId === z.id ? wyslana : null;
  const moja = lokalna?.dane ?? mojaZBazy?.dane ?? null;
  const wybrana = moja?.odpowiedz ?? null;
  const czasOdp = lokalna?.czasMs ?? mojaZBazy?.czas_ms ?? null;
  const bladTeraz = blad?.zadanieId === z.id ? blad.tekst : null;

  const naglowek = (
    <p className="etykieta gra-pasek">
      <span>
        Pytanie {z.lp}/{liczba}
      </span>
      {faza === "pytanie" && (
        <span className="gra-kod">
          {czasMinal
            ? z.czas_s
              ? "koniec czasu"
              : "wszyscy odpowiedzieli"
            : bezLimitu
              ? "bez limitu"
              : `${Math.ceil(doKonca / 1000)} s`}
        </span>
      )}
    </p>
  );

  if (faza === "przygotuj") {
    return (
      <>
        <p className="nadtytul">{ja.nick}</p>
        {naglowek}
        <div className="odliczanie" aria-live="polite">
          <span className="odliczanie-liczba">{Math.max(1, Math.ceil(doStartu / 1000))}</span>
          <span>Przygotuj się!</span>
        </div>
      </>
    );
  }

  async function odpowiedz(dane: DaneOdpowiedzi) {
    if (!z || wysylam || moja !== null || czasMinal) return;
    const zadanieId = z.id;
    ustawWyslana({ zadanieId, dane, czasMs: null });
    ustawWysylam(true);
    ustawBlad(null);
    const { data, error } = await supabase().rpc("zapisz_odpowiedz", {
      p_token: ja.token,
      p_zadanie_id: zadanieId,
      p_dane: dane,
    });
    ustawWysylam(false);
    if (error) {
      ustawWyslana(null);
      ustawBlad({
        zadanieId,
        tekst: `${komunikatBledu(error)}. Spróbuj jeszcze raz.`,
      });
      return;
    }
    const wynik = data as ZapisOdpowiedzi;
    if (wynik.przyjeta) {
      ustawWyslana({ zadanieId, dane, czasMs: wynik.czas_ms });
      return;
    }
    // odrzucona: pokazujemy powód i bierzemy stan z bazy (np. odpowiedź zapisaną wcześniej)
    ustawWyslana(null);
    ustawBlad({ zadanieId, tekst: POWODY[wynik.powod] });
    void odswiez();
  }

  if (faza === "pytanie") {
    const zostalo = z.czas_s ? Math.max(0, Math.min(1, doKonca / (z.czas_s * 1000))) : 0;
    return (
      <>
        {naglowek}
        {z.czas_s ? (
          <div className="gra-czas" aria-hidden>
            <div style={{ transform: `scaleX(${zostalo})` }} />
          </div>
        ) : null}
        <Pytanie stan={stan} />
        {z.typ !== "wybor" && <p className="gra-podpowiedz">{PODPOWIEDZI_TYPOW[z.typ]}</p>}
        {z.typ === "wielokrotny" ? (
          <OdpowiedzWielokrotna
            key={z.id}
            z={z}
            wyslana={moja}
            zablokowane={czasMinal || wysylam}
            onWyslij={(d) => void odpowiedz(d)}
          />
        ) : z.typ === "kolejnosc" ? (
          <OdpowiedzKolejnosc
            key={z.id}
            z={z}
            wyslana={moja}
            zablokowane={czasMinal || wysylam}
            onWyslij={(d) => void odpowiedz(d)}
          />
        ) : z.typ === "pary" ? (
          <OdpowiedzPary
            key={z.id}
            z={z}
            wyslana={moja}
            zablokowane={czasMinal || wysylam}
            onWyslij={(d) => void odpowiedz(d)}
          />
        ) : (
          <ol className="odp-lista">
            {(z.dane.odpowiedzi ?? []).map((o, i) => {
              const klasa = wybrana === null ? "" : i === wybrana ? " wybrana" : " przygaszona";
              return (
                <li key={i}>
                  <button
                    className={`odp${klasa}`}
                    disabled={wybrana !== null || czasMinal || wysylam}
                    onClick={() => void odpowiedz({ odpowiedz: i })}
                  >
                    <span className="odp-litera">{LITERY[i]}</span>
                    <span className="odp-tekst">{o}</span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {bladTeraz && (
          <p className="blad" role="alert">
            {bladTeraz}
          </p>
        )}
        <p className="gra-status" aria-live="polite">
          {moja !== null ? (
            czasOdp !== null ? (
              <>
                Odpowiedź zapisana w <span className="czas-odp">{sekundy(czasOdp)}</span>. Czekamy na wynik…
              </>
            ) : (
              "Wysyłam odpowiedź…"
            )
          ) : czasMinal ? (
            z.czas_s ? (
              "Czas minął. Czekamy na wynik…"
            ) : (
              "Wszyscy odpowiedzieli. Za chwilę wynik…"
            )
          ) : z.typ === "wybor" ? (
            "Wybierz odpowiedź."
          ) : (
            ""
          )}
        </p>
      </>
    );
  }

  // faza `wynik` albo `odpowiedzi` (TV pokazuje wtedy, kto jak odpowiedział)
  const poprawna = z.dane.poprawna;
  const poWyniku = moj?.faza === "wynik" || moj?.faza === "odpowiedzi";
  const ocena = mojaZBazy && poWyniku ? mojaZBazy : null;
  const gotowe = moj && moj.zadanie_nr === z.nr && poWyniku;
  const czesciowa = ocena && !ocena.poprawna && (ocena.ocena ?? 0) > 0;

  return (
    <>
      {naglowek}
      {!gotowe ? (
        <p className="pomocniczy">Liczę punkty…</p>
      ) : ocena?.poprawna ? (
        <div className="werdykt dobrze">
          <span className="werdykt-tytul">✓ Dobrze!</span>
          <span className="werdykt-punkty">+{ocena.punkty} pkt</span>
          <span className="pomocniczy">
            w <span className="czas-odp">{sekundy(ocena.czas_ms)}</span>
          </span>
        </div>
      ) : czesciowa ? (
        <div className="werdykt czesciowo">
          <span className="werdykt-tytul">Częściowo: {ulamek(ocena.ocena ?? 0, liczbaCzesci(z.typ, z.dane))}</span>
          <span className="werdykt-punkty">+{ocena.punkty} pkt</span>
          <span className="pomocniczy">
            w <span className="czas-odp">{sekundy(ocena.czas_ms)}</span>
          </span>
        </div>
      ) : ocena ? (
        <div className="werdykt zle">
          <span className="werdykt-tytul">✗ Niestety źle</span>
          <span className="werdykt-punkty">+0 pkt</span>
        </div>
      ) : (
        <div className="werdykt zle">
          <span className="werdykt-tytul">Brak odpowiedzi</span>
          <span className="werdykt-punkty">+0 pkt</span>
        </div>
      )}
      {gotowe && <Miejsce moj={moj} />}

      <Pytanie stan={stan} />
      {z.typ !== "wybor" ? (
        <Rozwiazanie z={z} moja={moja} />
      ) : (
        <ol className="odp-lista">
          {(z.dane.odpowiedzi ?? []).map((o, i) => {
            const klasa = i === poprawna ? " poprawna" : i === wybrana ? " bledna" : " przygaszona";
            return (
              <li key={i}>
                <div className={`odp${klasa}`}>
                  <span className="odp-litera">{LITERY[i]}</span>
                  <span className="odp-tekst">{o}</span>
                  {i === poprawna && <span className="ok">✓</span>}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      <p className="gra-status">Patrz na telewizor.</p>
    </>
  );
}

function Pytanie({ stan }: { stan: StanSesji }) {
  const z = stan.zadanie;
  if (!z) return null;
  return (
    <>
      <h2 className="gra-pytanie">{z.tresc}</h2>
      {z.grafika_url && <img src={z.grafika_url} alt="" className="gra-grafika" />}
    </>
  );
}

export function Miejsce({ moj }: { moj: MojWynik }) {
  if (moj.miejsce == null) return null;
  return (
    <div className="miejsce">
      <span className="miejsce-nr">{moj.miejsce}.</span>
      <span>
        miejsce z {moj.liczba_graczy}
        <br />
        <strong className="gra-kod">{moj.punkty.toLocaleString("pl-PL")} pkt</strong>
      </span>
    </div>
  );
}

/** Ranking na telefonie: punkty za ostatnie pytanie i zmiana miejsca. */
export function ZmianaMiejsca({ w }: { w: WierszRankingu }) {
  const zmiana = w.poprzednie_miejsce - w.miejsce;
  return (
    <p className="zmiana-miejsca">
      <span className="gra-kod">+{w.zdobyte} pkt</span> za ostatnie pytanie
      {zmiana > 0 && <span className="w-gore"> · ▲ {zmiana} w górę</span>}
      {zmiana < 0 && <span className="w-dol"> · ▼ {-zmiana} w dół</span>}
    </p>
  );
}
