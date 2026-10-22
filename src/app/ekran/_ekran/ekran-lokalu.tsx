"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { useNasluchTematu } from "@/lib/gra/nasluch";
import { supabase } from "@/lib/supabase/przegladarka";
import { Plansze } from "./plansze";
import { Scena, Tv } from "./tv";

type Props = {
  adres: string;
  lokal: { nazwa: string; logo_url: string | null };
  /** Adres aplikacji z protokołem, do linku w QR. */
  baza: string;
};

/**
 * Stały ekran lokalu (zakładka na TV). Bez gry pokazuje plansze, a gdy w lokalu ruszy gra,
 * sam przechodzi na nią (zdarzenie `gra` z bazy, zapasowo odpytywanie co 5 s).
 */
export function EkranLokalu({ adres, lokal, baza }: Props) {
  const [kod, ustawKod] = useState<string | null>(null);
  const [qr, ustawQr] = useState<{ kod: string; svg: string } | null>(null);

  const pobierz = useCallback(async () => {
    const { data, error } = await supabase().rpc("ekran_lokalu", { p_adres: adres });
    // chwilowy błąd sieci: zostaje to, co już widać
    if (error) return;
    ustawKod((data as { kod: string | null }).kod);
  }, [adres]);

  useNasluchTematu(`lokal:${adres}`, pobierz, ["gra"]);

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
  return (
    <Scena>
      <Plansze lokal={lokal} />
    </Scena>
  );
}
