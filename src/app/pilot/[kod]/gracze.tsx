"use client";

import QRCode from "qrcode";
import { useEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { Okno, usePotwierdzenie } from "@/components/okno";
import { komunikatBledu } from "@/lib/gra/nasluch";
import type { GraczPilota } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { usunZdjecie } from "@/lib/zdjecie";

type Props = {
  kod: string;
  token: string;
  gracze: GraczPilota[];
  /** Trwa pytanie: przy nicku znaczek, czy gracz już odpowiedział. */
  pytanie: boolean;
  /** Po końcu gry lista jest tylko do wglądu. */
  koniec: boolean;
  odswiez: () => Promise<void>;
};

/**
 * Gracze na pilocie. Przy każdym: QR powrotu (gracz zamknął stronę albo zmienia telefon;
 * skanuje go i gra dalej z tymi samymi punktami), usunięcie gracza i usunięcie zdjęcia.
 */
export function GraczePilota({ kod, token, gracze, pytanie, koniec, odswiez }: Props) {
  const [potwierdz, oknoPotwierdzenia] = usePotwierdzenie();
  const [blad, ustawBlad] = useState<string | null>(null);
  const [qr, ustawQr] = useState<{ nick: string; svg: string } | null>(null);
  const oknoQr = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (qr && !oknoQr.current?.open) oknoQr.current?.showModal();
  }, [qr]);

  async function pokazQr(g: GraczPilota) {
    const svg = await QRCode.toString(`${window.location.origin}/${kod}#powrot=${g.token}`, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#000000", light: "#f4ecd8" },
    });
    ustawQr({ nick: g.nick, svg });
  }

  function zamknijQr() {
    oknoQr.current?.close();
    ustawQr(null);
  }

  async function usun(g: GraczPilota) {
    const tak = await potwierdz(`Usunąć gracza ${g.nick} z gry? Jego punkty znikną z rankingu.`, {
      tak: "Usuń gracza",
      niebezpieczne: true,
    });
    if (!tak) return;
    ustawBlad(null);
    const odp = await fetch("/api/gracz", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kod, host_token: token, nick: g.nick }),
    });
    if (!odp.ok) {
      const wynik = (await odp.json().catch(() => ({}))) as { blad?: string };
      ustawBlad(wynik.blad ?? "Nie udało się usunąć gracza.");
      return;
    }
    // rozgłoszenie zmiany i wynik, jeśli reszta już odpowiedziała
    const { error } = await supabase().rpc("po_usunieciu_gracza", {
      p_kod: kod,
      p_host_token: token,
    });
    if (error) ustawBlad(komunikatBledu(error));
    await odswiez();
  }

  async function zdejmijZdjecie(nick: string) {
    if (
      !(await potwierdz(`Usunąć zdjęcie gracza ${nick}? Na TV zostanie kółko z literą.`, {
        tak: "Usuń zdjęcie",
        niebezpieczne: true,
      }))
    ) {
      return;
    }
    try {
      await usunZdjecie({ kod, host_token: token, nick });
      await odswiez();
    } catch (e) {
      ustawBlad((e as Error).message);
    }
  }

  if (gracze.length === 0) {
    return (
      <p className="pomocniczy" style={{ margin: 0 }}>
        Nikt jeszcze nie dołączył. Gracze skanują QR z telewizora.
      </p>
    );
  }

  return (
    <>
      <ul className="pilot-gracze">
        {gracze.map((g) => (
          <li key={g.nick}>
            {g.zdjecie && !koniec ? (
              // zdjęcie trafia na TV: prowadzący może je zdjąć, gdy się nie nadaje
              <button
                type="button"
                className="nick-zdjecie"
                aria-label={`Usuń zdjęcie gracza ${g.nick}`}
                onClick={() => void zdejmijZdjecie(g.nick)}
              >
                <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={30} />
              </button>
            ) : (
              <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={30} />
            )}
            <span className="pilot-gracz-nick">
              {g.nick}
              {pytanie && <span className={g.odpowiedzial ? "ok" : "pomocniczy"}>{g.odpowiedzial ? " ✓" : " …"}</span>}
            </span>
            <span className="pilot-gracz-punkty">{g.punkty.toLocaleString("pl-PL")}</span>
            {!koniec && (
              <>
                <button
                  type="button"
                  className="przycisk-zdjecie"
                  onClick={() => void pokazQr(g)}
                  aria-label={`Kod powrotu dla ${g.nick}`}
                >
                  QR
                </button>
                <button
                  type="button"
                  className="przycisk-zdjecie pilot-usun"
                  onClick={() => void usun(g)}
                  aria-label={`Usuń gracza ${g.nick}`}
                >
                  ✕
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
      {!koniec && (
        <p className="pomocniczy" style={{ margin: "10px 0 0" }}>
          QR: gracz wypadł z gry albo zmienia telefon, skanuje i gra dalej. ✕ usuwa gracza. Dotknij zdjęcia, żeby je
          zdjąć.
        </p>
      )}
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
      <Okno
        ref={oknoQr}
        nie="Zamknij"
        onNie={zamknijQr}
        pytanie={
          qr && (
            <span className="pilot-qr">
              <span>
                Powrót do gry: <strong className="gra-kod">{qr.nick}</strong>
              </span>
              <span className="pilot-qr-kod" dangerouslySetInnerHTML={{ __html: qr.svg }} />
              <span className="pomocniczy">
                Niech {qr.nick} zeskanuje ten kod swoim telefonem. Pokazuj tylko tej osobie.
              </span>
            </span>
          )
        }
      >
        {null}
      </Okno>
      {oknoPotwierdzenia}
    </>
  );
}
