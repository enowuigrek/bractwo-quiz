"use client";
/* eslint-disable @next/next/no-img-element -- grafiki pytań z bucketu Supabase */

import { useState } from "react";
import { sekundy } from "@/lib/czas";
import { rozmycie } from "@/lib/gra/dodatki";
import { fazaTeraz, komunikatBledu, sekundaOdliczania } from "@/lib/gra/nasluch";
import type { MojWynik, StanSesji, WierszRankingu, ZapisOdpowiedzi } from "@/lib/gra/typy";
import { zapiszZPonowieniem } from "@/lib/gra/zapis";
import { LITERY, PODPOWIEDZI_TYPOW, jedenWybor, liczbaCzesci, ulamek, type DaneOdpowiedzi } from "@/lib/zadania";
import {
  OdpowiedzKolejnosc,
  OdpowiedzLiczba,
  OdpowiedzPary,
  OdpowiedzPrawdaFalsz,
  OdpowiedzWielokrotna,
  Rozwiazanie,
} from "./odpowiadanie";
import { Gotowy } from "./gotowy";
import { OdpowiedziGraczy } from "./odpowiedzi-graczy";

const POWODY: Record<Exclude<ZapisOdpowiedzi, { przyjeta: true }>["powod"], string> = {
  po_czasie: "Za późno, czas minął.",
  za_wczesnie: "Pytanie jeszcze się nie zaczęło. Spróbuj za chwilę.",
  nie_teraz: "To pytanie już się skończyło.",
  inne_zadanie: "To pytanie już się skończyło.",
  juz_odpowiedziano: "Twoja odpowiedź jest już zapisana.",
  kibic: "W finale odpowiadają tylko finaliści.",
  odpadl: "Odpadasz w tym quizie: teraz patrzysz i kibicujesz.",
};

/** Finał trójki, a ten gracz nie jest w trójce: patrzy i kibicuje. */
export function czyKibic(stan: StanSesji, nick: string): boolean {
  return !!stan.finalisci && !stan.finalisci.some((f) => f.nick === nick);
}

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
  const kibic = czyKibic(stan, ja.nick);
  // plansza etapu pokazała już, jak odpowiadać, więc bez podpowiedzi rodzaju pytania
  const zEtapami = (stan.quiz?.liczba_etapow ?? 0) > 0;

  if (!z) {
    return <p className="pomocniczy">Za chwilę następne pytanie.</p>;
  }

  // ciekawostka: plansza bez odpowiedzi, na telefonie to samo co na TV, mniejsze
  if (z.typ === "ciekawostka") {
    return (
      <>
        <p className="nadtytul">Ciekawostka</p>
        <h2 className="gra-pytanie">{z.tresc}</h2>
        {z.grafika_url && <img src={z.grafika_url} alt="" className="gra-grafika" />}
        {z.dane.tekst && <p>{z.dane.tekst}</p>}
        <Gotowy stan={stan} token={ja.token} />
      </>
    );
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
        Pytanie {z.lp}
      </span>
      {faza === "pytanie" && (
        <span className="gra-kod">
          {/* bez limitu czasu nic nie piszemy: napis „bez limitu” tylko mylił */}
          {czasMinal
            ? z.czas_s
              ? "koniec czasu"
              : "wszyscy odpowiedzieli"
            : bezLimitu
              ? ""
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
          <span className="odliczanie-liczba">{sekundaOdliczania(doStartu)}</span>
          <span>Przygotuj się!</span>
          {/* rodzaj pytania już w odliczaniu, żeby nikt nie był zaskoczony parami czy kolejnością;
              w quizie z etapami tłumaczy to plansza etapu */}
          {kibic ? (
            <span className="odliczanie-typ">Finał: tym razem kibicujesz</span>
          ) : (
            !zEtapami && <span className="odliczanie-typ">{PODPOWIEDZI_TYPOW[z.typ]}</span>
          )}
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
    const { data, error } = await zapiszZPonowieniem("zapisz_odpowiedz", {
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
    // po ponowieniu: pierwsza próba weszła, tylko odpowiedź nie doszła. Wybór zostaje, czas i punkty dociągamy z bazy
    if (wynik.powod === "juz_odpowiedziano") {
      void odswiez();
      return;
    }
    // odrzucona: pokazujemy powód i bierzemy stan z bazy (np. odpowiedź zapisaną wcześniej)
    ustawWyslana(null);
    ustawBlad({ zadanieId, tekst: POWODY[wynik.powod] });
    void odswiez();
  }

  if (faza === "pytanie") {
    const zostalo = z.czas_s ? Math.max(0, Math.min(1, doKonca / (z.czas_s * 1000))) : 0;
    const pasek = z.czas_s ? (
      <div className="gra-czas" aria-hidden>
        <div style={{ transform: `scaleX(${zostalo})` }} />
      </div>
    ) : null;
    // finał trójki: reszta widzi pytanie, ale nie odpowiada
    if (kibic) {
      return (
        <>
          {naglowek}
          {pasek}
          <Pytanie stan={stan} teraz={teraz} />
          <p className="gra-kibic">
            Finał! Odpowiadają {stan.finalisci?.map((f) => f.nick).join(", ")}. Kibicuj!
          </p>
        </>
      );
    }
    return (
      <>
        {naglowek}
        {pasek}
        <Pytanie stan={stan} teraz={teraz} />
        {/* bez instrukcji pod pytaniem (26.10, Łukasz: zasady są na planszach między etapami, a tekst tylko
            przeszkadzał i przesuwał przyciski) */}
        {z.typ === "prawda_falsz" ? (
          <OdpowiedzPrawdaFalsz
            key={z.id}
            z={z}
            wyslana={moja}
            zablokowane={czasMinal || wysylam}
            onWyslij={(d) => void odpowiedz(d)}
          />
        ) : z.typ === "szacowanie" ? (
          <OdpowiedzLiczba
            key={z.id}
            z={z}
            wyslana={moja}
            zablokowane={czasMinal || wysylam}
            onWyslij={(d) => void odpowiedz(d)}
          />
        ) : z.typ === "wielokrotny" ? (
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
      {kibic ? (
        <div className="werdykt czesciowo">
          <span className="werdykt-tytul">Finał trójki</span>
          <span className="pomocniczy">Tym razem kibicujesz.</span>
        </div>
      ) : !gotowe ? (
        <p className="pomocniczy">Liczę punkty…</p>
      ) : ocena?.poprawna ? (
        <div className="werdykt dobrze">
          <span className="werdykt-tytul">✓ Dobrze!</span>
          <span className="werdykt-punkty">+{ocena.punkty} pkt</span>
        </div>
      ) : czesciowa ? (
        <div className="werdykt czesciowo">
          <span className="werdykt-tytul">
            {z.typ === "szacowanie" ? "Blisko!" : `Częściowo: ${ulamek(ocena.ocena ?? 0, liczbaCzesci(z.typ, z.dane))}`}
          </span>
          <span className="werdykt-punkty">+{ocena.punkty} pkt</span>
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
      {gotowe && moj.miejsce != null && (
        <p className="wynik-miejsce">
          <strong>{moj.miejsce}.</strong> miejsce z {moj.liczba_graczy} ·{" "}
          <span className="gra-kod">{moj.punkty.toLocaleString("pl-PL")} pkt</span>
        </p>
      )}

      {/* gdy TV pokazuje, kto jak odpowiedział, telefon to samo zamiast rozwiązania (26.10) */}
      {faza === "odpowiedzi" ? (
        <OdpowiedziGraczy kod={stan.kod} zadanieId={z.id} nick={ja.nick} typ={z.typ} />
      ) : (
      // po wyniku bez grafiki i ciaśniej, żeby ekran mieścił się bez przewijania
      <div className="gra-wynik">
        <Pytanie stan={stan} bezGrafiki />
        {!jedenWybor(z.typ) ? (
          <Rozwiazanie z={z} moja={moja} />
        ) : (
          <ol className="odp-lista">
            {(z.dane.odpowiedzi ?? []).map((o, i) => {
              const klasa = i === poprawna ? " poprawna" : i === wybrana ? " bledna" : " przygaszona";
              return (
                <li key={i}>
                  <div className={`odp${klasa}`}>
                    <span className="odp-litera">{z.typ === "prawda_falsz" ? (i === 0 ? "✓" : "✗") : LITERY[i]}</span>
                    <span className="odp-tekst">{o}</span>
                    {i === poprawna && <span className="ok">✓</span>}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
      )}
    </>
  );
}

/** Treść pytania, grafika (odsłaniana wyostrza się z czasem) i podpowiedzi, które już się odsłoniły. */
function Pytanie({ stan, bezGrafiki = false, teraz }: { stan: StanSesji; bezGrafiki?: boolean; teraz?: number }) {
  const z = stan.zadanie;
  if (!z) return null;
  const rozmyta = teraz === undefined ? 0 : rozmycie(stan, teraz);
  return (
    <>
      <h2 className="gra-pytanie">{z.tresc}</h2>
      {z.grafika_url && !bezGrafiki && (
        <img
          src={z.grafika_url}
          alt=""
          className="gra-grafika"
          style={rozmyta ? { filter: `blur(${rozmyta / 2}px)` } : undefined}
        />
      )}
      {z.podpowiedzi.length > 0 && (
        <ol className="gra-podpowiedzi" aria-label="Podpowiedzi">
          {z.podpowiedzi.map((p, i) => (
            <li key={i}>
              <span>Podpowiedź {i + 1}</span> {p}
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/**
 * Miejsce gracza. `status`: kolor numeru względem najbliższego odcięcia (zielony: przechodzi dalej, czerwony: odpada),
 * zamiast opisu „Na dobrej drodze” / „Zagrożony odpadnięciem” (26.10, Łukasz: mniej czytania, więcej symboli).
 */
export function Miejsce({ moj, status = null }: { moj: MojWynik; status?: "na-drodze" | "zagrozony" | null }) {
  if (moj.miejsce == null) return null;
  return (
    <div className={`miejsce${status ? ` ${status}` : ""}`}>
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
