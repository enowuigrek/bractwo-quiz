"use client";
/* eslint-disable @next/next/no-img-element -- grafiki z bucketu Supabase (także SVG), bez optymalizacji next/image */

import { useEffect, useRef, useState } from "react";
import { IkonaKosz } from "@/components/ikony";

export function Miniatura({ src, alt }: { src: string | null; alt: string }) {
  return src ? <img src={src} alt={alt} className="miniatura" /> : <span className="miniatura-pusta" aria-hidden />;
}

type PoleGrafikiProps = {
  /** Nazwa pola z plikiem. Usunięcie obecnej grafiki wysyła `${nazwa}_usun=on`. */
  nazwa: string;
  etykieta: string;
  obecna?: string | null;
  podpowiedz?: string;
  /** Zdjęcie konta: po wyborze pliku okno kadrowania w kole, wynik to kwadrat 512×512 (30.10). */
  kadruj?: boolean;
};

const TYPY = "image/png,image/jpeg,image/webp,image/svg+xml";

/**
 * Wybór grafiki (30.10): podgląd obecnej albo nowej, przycisk „Wybierz plik” w stylu panelu i kosz zamiast
 * przełącznika „usuń” (po kliknięciu „Cofnij”). Z `kadruj` nowe zdjęcie przechodzi przez okno kadrowania.
 */
export function PoleGrafiki({ nazwa, etykieta, obecna, podpowiedz, kadruj = false }: PoleGrafikiProps) {
  const pole = useRef<HTMLInputElement>(null);
  const [usun, ustawUsun] = useState(false);
  const [nowa, ustawNowa] = useState<string | null>(null);
  const [doKadrowania, ustawDoKadrowania] = useState<File | null>(null);

  // adres podglądu nowego pliku zwalniamy, gdy przestaje być potrzebny
  useEffect(() => () => {
    if (nowa) URL.revokeObjectURL(nowa);
  }, [nowa]);

  const ustawPlik = (plik: File | null) => {
    if (!pole.current) return;
    const dt = new DataTransfer();
    if (plik) dt.items.add(plik);
    pole.current.files = dt.files;
    ustawNowa(plik ? URL.createObjectURL(plik) : null);
  };

  const podglad = nowa ?? (usun ? null : obecna);
  return (
    <div className="pole-grafiki">
      <label htmlFor={nazwa}>{etykieta}</label>
      <div className="pole-grafiki-wiersz">
        {podglad && <img src={podglad} alt="" className={`pole-grafiki-podglad${kadruj ? " okragly" : ""}`} />}
        {/* prawdziwy przycisk, nie etykieta: `.formularz label` robiła z klasy przycisku blok z tekstem u góry (30.10) */}
        <button type="button" className="przycisk-maly" onClick={() => pole.current?.click()}>
          {podglad ? "Zmień" : "Wybierz plik"}
        </button>
        {nowa ? (
          <button type="button" className="przycisk-maly" onClick={() => ustawPlik(null)}>
            Cofnij
          </button>
        ) : obecna && !usun ? (
          <button
            type="button"
            className="przycisk-maly ikona niebezpieczny"
            onClick={() => ustawUsun(true)}
            aria-label={`Usuń: ${etykieta}`}
            data-podpis="Usuń"
          >
            <IkonaKosz />
          </button>
        ) : obecna && usun ? (
          <button type="button" className="przycisk-maly" onClick={() => ustawUsun(false)}>
            Cofnij
          </button>
        ) : null}
      </div>
      {usun && !nowa && <input type="hidden" name={`${nazwa}_usun`} value="on" />}
      <input
        ref={pole}
        id={nazwa}
        name={nazwa}
        type="file"
        accept={TYPY}
        className="pole-grafiki-plik"
        onChange={(e) => {
          const plik = e.target.files?.[0] ?? null;
          if (!plik) return ustawNowa(null);
          // SVG i tak się nie kadruje (wektor); reszta przy zdjęciu konta idzie do okna kadrowania
          if (kadruj && plik.type !== "image/svg+xml") ustawDoKadrowania(plik);
          else ustawNowa(URL.createObjectURL(plik));
        }}
      />
      <p className="podpowiedz">{podpowiedz ?? "PNG, JPG, WebP albo SVG, do 5 MB."}</p>
      {doKadrowania && (
        <Kadrowanie
          plik={doKadrowania}
          onGotowe={(plik) => {
            ustawPlik(plik);
            ustawDoKadrowania(null);
          }}
          onAnuluj={() => {
            ustawPlik(null);
            ustawDoKadrowania(null);
          }}
        />
      )}
    </div>
  );
}

/** Bok pola kadrowania w px i bok zapisywanego zdjęcia. */
const POLE = 280;
const WYNIK = 512;

/**
 * Okno kadrowania zdjęcia w kole (30.10): zdjęcie przesuwa się palcem albo myszą, suwak przybliża; zdjęcie zawsze
 * wypełnia koło. „Gotowe” zapisuje kwadrat `WYNIK`×`WYNIK` (JPEG), który trafia do pola formularza.
 */
function Kadrowanie({ plik, onGotowe, onAnuluj }: { plik: File; onGotowe: (plik: File) => void; onAnuluj: () => void }) {
  const okno = useRef<HTMLDialogElement>(null);
  const [adres] = useState(() => URL.createObjectURL(plik));
  const [obraz, ustawObraz] = useState<HTMLImageElement | null>(null);
  const [zoom, ustawZoom] = useState(1);
  const [poz, ustawPoz] = useState({ x: 0, y: 0 });
  const chwyt = useRef<{ x: number; y: number; px: number; py: number } | null>(null);

  useEffect(() => {
    okno.current?.showModal();
    const img = new Image();
    img.onload = () => {
      ustawObraz(img);
      const s = POLE / Math.min(img.naturalWidth, img.naturalHeight);
      ustawPoz({ x: (POLE - img.naturalWidth * s) / 2, y: (POLE - img.naturalHeight * s) / 2 });
    };
    img.src = adres;
    return () => URL.revokeObjectURL(adres);
  }, [adres]);

  const skala = obraz ? (POLE / Math.min(obraz.naturalWidth, obraz.naturalHeight)) * zoom : 1;
  const szer = (obraz?.naturalWidth ?? 0) * skala;
  const wys = (obraz?.naturalHeight ?? 0) * skala;
  // zdjęcie zawsze zakrywa całe pole
  const przytnij = (x: number, y: number, s = szer, w = wys) => ({
    x: Math.min(0, Math.max(POLE - s, x)),
    y: Math.min(0, Math.max(POLE - w, y)),
  });

  const zmienZoom = (z: number) => {
    if (!obraz) return;
    // przybliżanie wokół środka pola
    const nowaSkala = (POLE / Math.min(obraz.naturalWidth, obraz.naturalHeight)) * z;
    const sx = (POLE / 2 - poz.x) / skala;
    const sy = (POLE / 2 - poz.y) / skala;
    ustawZoom(z);
    ustawPoz(
      przytnij(POLE / 2 - sx * nowaSkala, POLE / 2 - sy * nowaSkala, obraz.naturalWidth * nowaSkala, obraz.naturalHeight * nowaSkala),
    );
  };

  const gotowe = () => {
    if (!obraz) return;
    const plotno = document.createElement("canvas");
    plotno.width = plotno.height = WYNIK;
    const ctx = plotno.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(obraz, -poz.x / skala, -poz.y / skala, POLE / skala, POLE / skala, 0, 0, WYNIK, WYNIK);
    plotno.toBlob(
      (blob) => {
        if (blob) onGotowe(new File([blob], "zdjecie.jpg", { type: "image/jpeg" }));
      },
      "image/jpeg",
      0.9,
    );
  };

  return (
    <dialog ref={okno} className="okno kadrowanie" onCancel={onAnuluj}>
      <div className="okno-tresc">
        <div
          className="kadrowanie-pole"
          style={{ width: POLE, height: POLE }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            chwyt.current = { x: e.clientX, y: e.clientY, px: poz.x, py: poz.y };
          }}
          onPointerMove={(e) => {
            const c = chwyt.current;
            if (c) ustawPoz(przytnij(c.px + e.clientX - c.x, c.py + e.clientY - c.y));
          }}
          onPointerUp={() => {
            chwyt.current = null;
          }}
        >
          {obraz && (
            <img
              src={adres}
              alt=""
              draggable={false}
              style={{ width: szer, height: wys, transform: `translate(${poz.x}px, ${poz.y}px)` }}
            />
          )}
          <span className="kadrowanie-kolo" aria-hidden />
        </div>
        <input
          type="range"
          className="kadrowanie-zoom"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => zmienZoom(Number(e.target.value))}
          aria-label="Przybliżenie"
        />
        <div className="okno-przyciski">
          <button type="button" className="przycisk" onClick={onAnuluj}>
            Anuluj
          </button>
          <button type="button" className="przycisk zloty" onClick={gotowe} disabled={!obraz}>
            Gotowe
          </button>
        </div>
      </div>
    </dialog>
  );
}
