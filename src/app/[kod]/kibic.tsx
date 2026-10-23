"use client";

import { useState } from "react";
import { Awatar } from "@/components/awatar";
import { HasloKibica } from "@/components/haslo-kibica";
import { komunikatBledu } from "@/lib/gra/nasluch";
import { HASLA, ODSTEP_OKRZYKOW_MS } from "@/lib/gra/okrzyki";
import type { StanSesji } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import type { Ja } from "./rozgrywka";

type Wynik = { przyjety: boolean; powod?: string; za_ms?: number; wyslane?: number };

/**
 * Telefon kibica w serii finału: wybiera finalistę (awatary) i stuka hasła z jego awatarem
 * („Dawaj [awatar]!”). Okrzyk wyskakuje na TV dymkiem nad drogą finalisty. Najwyżej jeden na 3 s
 * (pilnuje `kibicuj` w bazie, tu tylko przyciski czekają). `teraz`: zegar serwera.
 */
export function Kibicowanie({ stan, ja, teraz }: { stan: StanSesji; ja: Ja; teraz: number }) {
  const finalisci = stan.finalisci ?? [];
  const [wybrany, ustawWybrany] = useState(0);
  const [wolneOd, ustawWolneOd] = useState(0);
  const [wyslane, ustawWyslane] = useState(0);
  const [wysylam, ustawWysylam] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : Infinity;
  const f = finalisci[Math.min(wybrany, finalisci.length - 1)];

  const naglowek = (
    <p className="etykieta gra-pasek">
      <span>{stan.etap?.nazwa ?? "Finał"} · kibicujesz</span>
      {wyslane > 0 && <span className="gra-kod">📣 {wyslane}</span>}
    </p>
  );

  if (teraz < od || teraz >= do_ || !f) {
    return (
      <>
        {naglowek}
        <p className="gra-kibic">
          {teraz >= do_
            ? "Koniec serii! Patrz na telewizor."
            : `Finał! Odpowiadają ${finalisci.map((g) => g.nick).join(", ")}. Zaraz możesz im kibicować!`}
        </p>
      </>
    );
  }

  const czekaj = Math.max(0, wolneOd - teraz);
  const zablokowane = wysylam || czekaj > 0;

  async function kibicuj(haslo: number) {
    if (zablokowane || !f) return;
    ustawWysylam(true);
    ustawBlad(null);
    const { data, error } = await supabase().rpc("kibicuj", {
      p_token: ja.token,
      p_finalista: f.nick,
      p_haslo: haslo,
    });
    ustawWysylam(false);
    if (error) {
      ustawBlad(komunikatBledu(error));
      return;
    }
    const w = data as Wynik;
    if (w.przyjety) {
      ustawWolneOd(teraz + ODSTEP_OKRZYKOW_MS);
      ustawWyslane(w.wyslane ?? wyslane + 1);
    } else if (w.powod === "za_szybko") {
      ustawWolneOd(teraz + (w.za_ms ?? ODSTEP_OKRZYKOW_MS));
    } else {
      ustawBlad(w.powod === "nie_teraz" ? "Seria już się skończyła." : "Ten okrzyk nie przeszedł.");
    }
  }

  return (
    <>
      {naglowek}
      <h2 className="kibic-tytul">Komu kibicujesz?</h2>
      <div className="kibic-finalisci" role="radiogroup" aria-label="Finalista">
        {finalisci.map((g, i) => (
          <button
            key={g.nick}
            role="radio"
            aria-checked={g === f}
            aria-label={g.nick}
            className={`kibic-finalista${g === f ? " wybrany" : ""}`}
            onClick={() => ustawWybrany(i)}
          >
            <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={64} />
            <span>{g.nick}</span>
          </button>
        ))}
      </div>

      <div className="kibic-hasla">
        {HASLA.map((_, i) => (
          <button
            key={i}
            className="odp kibic-haslo"
            disabled={zablokowane}
            aria-label={`${HASLA[i][0]}${f.nick}${HASLA[i][1]}`}
            onClick={() => void kibicuj(i)}
          >
            <HasloKibica haslo={i} nick={f.nick} zdjecie={f.zdjecie} rozmiar={30} />
          </button>
        ))}
      </div>

      {/* pasek odstępu: po okrzyku hasła czekają 3 s */}
      <div className="kibic-odstep" aria-hidden>
        <div style={{ transform: `scaleX(${czekaj / ODSTEP_OKRZYKOW_MS})` }} />
      </div>
      <p className="pomocniczy kibic-podpis" aria-live="polite">
        {wyslane > 0 ? "Poszło na telewizor! Kolejny okrzyk za chwilę." : "Stuknij hasło, a pojawi się na telewizorze."}
      </p>
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
    </>
  );
}
