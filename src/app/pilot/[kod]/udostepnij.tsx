"use client";

import QRCode from "qrcode";
import { useEffect, useState, useSyncExternalStore } from "react";
import { LinkDoSkopiowania } from "@/app/admin/(panel)/gry/[id]/kopiuj";

const bezSubskrypcji = () => () => {};

/** QR jako SVG z adresu, który sami złożyliśmy (bez danych od użytkownika). */
function useQr(url: string | null): string | null {
  const [qr, ustawQr] = useState<{ url: string; svg: string } | null>(null);
  useEffect(() => {
    if (!url) return;
    let aktualny = true;
    void QRCode.toString(url, { type: "svg", margin: 0, errorCorrectionLevel: "M" }).then((svg) => {
      if (aktualny) ustawQr({ url, svg });
    });
    return () => {
      aktualny = false;
    };
  }, [url]);
  return qr && qr.url === url ? qr.svg : null;
}

/**
 * Dół pilota (26.10, Łukasz: po uruchomieniu gry od razu pilot, bez strony gry w panelu, a jej potrzebne rzeczy
 * niżej, na wszelki wypadek): QR dla kogoś, kto chce dołączyć, przekazanie pilota kodem QR i adres ekranu TV. Strona
 * gry w panelu (usuwanie, wyniki) jest w Rozgrywkach. Adresy z adresu bieżącej strony, bez domeny na sztywno.
 */
export function UdostepnijPilota({ kod, token }: { kod: string; token: string }) {
  const adres = useSyncExternalStore(
    bezSubskrypcji,
    () => window.location.origin,
    () => null,
  );
  const [otwarte, ustawOtwarte] = useState(false);
  const gracz = adres ? `${adres}/${kod}` : null;
  const pilot = adres ? `${adres}/pilot/${kod}?t=${token}` : null;
  // QR licz dopiero po rozwinięciu
  const qrGracza = useQr(otwarte ? gracz : null);
  const qrPilota = useQr(otwarte ? pilot : null);

  return (
    <details
      className="karta karta-zwijana pilot-udostepnij"
      onToggle={(e) => ustawOtwarte(e.currentTarget.open)}
    >
      <summary className="etykieta">Dołączanie, przekazanie pilota, ekran</summary>
      {gracz && pilot && adres && (
        <>
          <h3>Dla gracza</h3>
          {qrGracza && <div className="qr" dangerouslySetInnerHTML={{ __html: qrGracza }} />}
          <LinkDoSkopiowania url={gracz} />

          <h3>Przekaż pilota</h3>
          <p className="pomocniczy">Nie pokazuj graczom: link prowadzi do pilota.</p>
          {qrPilota && <div className="qr" dangerouslySetInnerHTML={{ __html: qrPilota }} />}
          <LinkDoSkopiowania url={pilot} />

          <h3>Ekran</h3>
          <LinkDoSkopiowania url={`${adres}/ekran/${kod}`} />
        </>
      )}
    </details>
  );
}
