"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/przegladarka";
import { przesuniecieZegara, useNasluchTematu } from "@/lib/gra/nasluch";
import { useNowaWersja } from "@/lib/ekran-tv";
import { wczytajEfekty, wznowEfekty, zagraj } from "@/lib/gra/efekty";
import type { Zapowiedz } from "@/lib/gra/zapowiedz";
import { MuzykaTv } from "./muzyka";
import { Plansze, type OstatniQuiz } from "./plansze";
import { Scena, Tv } from "./tv";
import { PlanszaProsta, ScenaProsta } from "../_prosty/prosty";
import { useTrybProsty } from "@/lib/gra/prosty";

type Props = {
  adres: string;
  lokal: { nazwa: string; logo_url: string | null };
  /** Adres aplikacji z protokołem, do linku w QR. */
  baza: string;
};

/**
 * Stały ekran lokalu (zakładka na TV). Bez gry pokazuje plansze, a gdy w lokalu ruszy gra,
 * sam przechodzi na nią (zdarzenie `gra` z bazy, zapasowo odpytywanie co 5 s). Po grze plansze
 * przez kilka godzin pokazują też jej podium.
 */
export function EkranLokalu({ adres, lokal, baza }: Props) {
  const [kod, ustawKod] = useState<string | null>(null);
  const [qr, ustawQr] = useState<{ kod: string; svg: string } | null>(null);
  const [ostatnia, ustawOstatnia] = useState<OstatniQuiz | null>(null);
  const [zapowiedz, ustawZapowiedz] = useState<Zapowiedz | null>(null);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);

  const pobierz = useCallback(async () => {
    const wyslano = Date.now();
    const { data, error } = await supabase().rpc("ekran_lokalu", { p_adres: adres });
    // chwilowy błąd sieci: zostaje to, co już widać
    if (error) return;
    const d = data as { kod: string | null; ostatnia: OstatniQuiz | null; zapowiedz: Zapowiedz | null; teraz: string };
    ustawPrzesuniecie(przesuniecieZegara(d.teraz, wyslano, Date.now()));
    ustawZapowiedz(d.zapowiedz);
    ustawKod(d.kod);
    ustawOstatnia(d.ostatnia?.podium.length ? d.ostatnia : null);
  }, [adres]);

  useNasluchTematu(`lokal:${adres}`, pobierz, ["gra"]);
  // plansze bez gry można przeładować od razu; w trakcie gry pilnuje tego ekran gry (Tv)
  useNowaWersja(!kod);
  // starsza przeglądarka telewizora: prosta plansza zamiast przewijanych plansz (src/lib/gra/prosty.ts)
  const prosty = useTrybProsty();

  useEffect(() => {
    if (!kod) return;
    let aktualny = true;
    void QRCode.toString(`${baza}/${kod}`, {
      type: "svg",
      margin: 0,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#f4ecd8" },
    }).then((svg) => {
      if (aktualny) ustawQr({ kod, svg });
    });
    return () => {
      aktualny = false;
    };
  }, [kod, baza]);

  if (kod && qr?.kod === kod) {
    return <Tv key={kod} kod={kod} qr={qr.svg} host={baza.replace(/^https?:\/\//, "")} />;
  }
  const dzwieki = (
    <>
      {/* zapowiedziana gra: muzyka poczekalni już teraz, a po otwarciu poczekalni gra dalej (muzyka.tsx) */}
      {zapowiedz?.muzyka && <ProbaEfektow />}
      {zapowiedz?.muzyka && (
        <MuzykaTv
          stan={{
            faza: "poczekalnia",
            muzyka: true,
            etap: null,
            faza_od: null,
            faza_do: null,
            ostatnie_w_etapie: false,
          }}
          teraz={0}
        />
      )}
    </>
  );
  if (prosty) {
    return (
      <ScenaProsta>
        <PlanszaProsta lokal={lokal} zapowiedz={zapowiedz} przesuniecie={przesuniecie} />
        {dzwieki}
      </ScenaProsta>
    );
  }
  return (
    <Scena nastroj={zapowiedz ? "poczekalnia" : undefined}>
      <Plansze lokal={lokal} ostatnia={ostatnia} zapowiedz={zapowiedz} przesuniecie={przesuniecie} />
      {dzwieki}
    </Scena>
  );
}

/**
 * Zapowiedź gry: po pierwszym OK na pilocie TV (albo kliknięciu) raz gra krótki efekt, żeby obsługa lokalu już przed
 * quizem usłyszała obok muzyki także efekty (src/lib/gra/efekty.ts). Ten sam gest odblokowuje je na całą grę.
 */
function ProbaEfektow() {
  useEffect(() => {
    wczytajEfekty(["ding"]);
    let zagrane = false;
    const gest = () => {
      wznowEfekty();
      if (zagrane) return;
      zagrane = true;
      window.setTimeout(() => zagraj("ding"), 400);
    };
    const gesty = ["click", "keydown", "touchend"] as const;
    for (const g of gesty) window.addEventListener(g, gest);
    return () => {
      for (const g of gesty) window.removeEventListener(g, gest);
    };
  }, []);
  return null;
}
