"use client";

import { useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { adresZdjecia, KOLORY_KAPSLI, kolorZAdresu } from "@/lib/kapsel";
import { przygotujZdjecie } from "@/lib/zdjecie";
import { IkonaAparat } from "@/components/ikony";

type Props = {
  nick: string;
  /** Obecne zdjęcie (adres albo podgląd). */
  zdjecie: string | null;
  /** Dostaje gotowe zdjęcie 256×256 i jego podgląd. Może rzucić błąd, który pokażemy pod przyciskiem. */
  onWybrano: (zdjecie: Blob, podglad: string) => Promise<void> | void;
  onUsun?: () => Promise<void> | void;
  rozmiar?: number;
  /** Wybrany kolor kapsla (null: jeszcze nie wybrany, wtedy z adresu zdjęcia albo po nicku). */
  kolor?: string | null;
  onKolor?: (kolor: string) => Promise<void> | void;
};

/**
 * Kapsel gracza: selfie (przycisk otwiera przedni aparat, na komputerze wybór pliku; telefon przycina zdjęcie do
 * kwadratu i zmniejsza, zanim cokolwiek wyśle) i kolor kapsla do wyboru (26.10). Duży kapsel to podgląd: pusty,
 * z literą po wpisaniu nicku albo ze zdjęciem, w dowolnej kolejności.
 */
export function ZdjecieGracza({ nick, zdjecie, onWybrano, onUsun, rozmiar = 88, kolor = null, onKolor }: Props) {
  const pole = useRef<HTMLInputElement>(null);
  const [trwa, ustawTrwa] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);

  async function wybrano(plik: File | undefined) {
    if (!plik) return;
    ustawTrwa(true);
    ustawBlad(null);
    try {
      const gotowe = await przygotujZdjecie(plik);
      await onWybrano(gotowe, URL.createObjectURL(gotowe));
    } catch (e) {
      ustawBlad((e as Error).message);
    } finally {
      ustawTrwa(false);
      if (pole.current) pole.current.value = "";
    }
  }

  return (
    <div className="zdjecie-gracza">
      <Awatar nick={nick} zdjecie={zdjecie} rozmiar={rozmiar} kolor={kolor} />
      <div className="zdjecie-gracza-akcje">
        <button type="button" className="przycisk-zdjecie" onClick={() => pole.current?.click()} disabled={trwa}>
          {trwa ? (
            "Chwila…"
          ) : adresZdjecia(zdjecie) ? (
            "Zmień zdjęcie"
          ) : (
            <>
              <IkonaAparat /> Dodaj selfie
            </>
          )}
        </button>
        {adresZdjecia(zdjecie) && onUsun && (
          <button
            type="button"
            className="przycisk-cichy"
            disabled={trwa}
            onClick={async () => {
              ustawTrwa(true);
              try {
                await onUsun();
              } catch (e) {
                ustawBlad((e as Error).message);
              } finally {
                ustawTrwa(false);
              }
            }}
          >
            Usuń zdjęcie
          </button>
        )}
        <span className="pomocniczy">
          {adresZdjecia(zdjecie) ? "Pokaże się na telewizorze." : "Opcjonalnie. Pokaże się przy nicku na TV."}
        </span>
        {blad && (
          <span className="blad" role="alert">
            {blad}
          </span>
        )}
      </div>
      {onKolor && (
        <div className="wybor-kapsla" role="radiogroup" aria-label="Kolor kapsla">
          {KOLORY_KAPSLI.map((k) => {
            const wybrany = (kolor ?? kolorZAdresu(zdjecie)) === k;
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={wybrany}
                aria-label={`Kolor kapsla ${k}`}
                className={`wybor-kapsla-kolor${wybrany ? " wybrany" : ""}`}
                disabled={trwa}
                onClick={() => void onKolor(k)}
              >
                <Awatar nick="" rozmiar={32} kolor={k} />
              </button>
            );
          })}
        </div>
      )}
      <input
        ref={pole}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => void wybrano(e.target.files?.[0])}
      />
    </div>
  );
}
