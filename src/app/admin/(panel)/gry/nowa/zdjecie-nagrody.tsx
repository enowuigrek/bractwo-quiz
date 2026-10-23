"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { useRef, useState } from "react";

/** Dłuższy bok zdjęcia wysyłanego do przeróbki (więcej nie poprawia wyniku, a Vercel ma limit 4,5 MB). */
const BOK = 1024;

/** Zmniejsza zdjęcie z aparatu do JPEG o dłuższym boku `BOK`. */
async function zmniejsz(plik: File): Promise<Blob> {
  const obraz = await createImageBitmap(plik);
  const skala = Math.min(1, BOK / Math.max(obraz.width, obraz.height));
  const plotno = document.createElement("canvas");
  plotno.width = Math.round(obraz.width * skala);
  plotno.height = Math.round(obraz.height * skala);
  plotno.getContext("2d")?.drawImage(obraz, 0, 0, plotno.width, plotno.height);
  obraz.close();
  return new Promise((ok, zle) =>
    plotno.toBlob((b) => (b ? ok(b) : zle(new Error("Nie udało się odczytać zdjęcia."))), "image/jpeg", 0.88),
  );
}

type Stan =
  | { etap: "pusty" }
  | { etap: "przerabiam"; podglad: string }
  | { etap: "gotowe"; oryginal: string; przerobione: string | null; wybrane: string; blad?: string };

/**
 * Zdjęcie nagrody w kreatorze: zrób zdjęcie (albo wybierz plik), serwer przerabia je w stylu
 * Bractwa (`/api/nagroda`, ok. 20–40 s). Potem wybór: przeróbka albo oryginał, „Jeszcze raz”, „Usuń”.
 * Wybrany adres idzie w ukrytym polu `nagroda_zdjecie_<miejsce>`.
 */
export function ZdjecieNagrody({ miejsce }: { miejsce: number }) {
  const [stan, ustaw] = useState<Stan>({ etap: "pusty" });
  const ostatni = useRef<Blob | null>(null);
  const pole = useRef<HTMLInputElement>(null);

  async function przerob(zdjecie: Blob) {
    ostatni.current = zdjecie;
    ustaw({ etap: "przerabiam", podglad: URL.createObjectURL(zdjecie) });
    const dane = new FormData();
    dane.append("plik", zdjecie, "nagroda.jpg");
    try {
      const odp = await fetch("/api/nagroda", { method: "POST", body: dane });
      const wynik = (await odp.json()) as { ok: boolean; blad?: string; oryginal?: string; przerobione?: string };
      if (wynik.ok && wynik.oryginal && wynik.przerobione) {
        ustaw({ etap: "gotowe", oryginal: wynik.oryginal, przerobione: wynik.przerobione, wybrane: wynik.przerobione });
      } else if (wynik.oryginal) {
        ustaw({
          etap: "gotowe",
          oryginal: wynik.oryginal,
          przerobione: null,
          wybrane: wynik.oryginal,
          blad: wynik.blad,
        });
      } else {
        ustaw({ etap: "pusty" });
        alert(wynik.blad ?? "Nie udało się wysłać zdjęcia.");
      }
    } catch {
      ustaw({ etap: "pusty" });
      alert("Brak połączenia. Spróbuj jeszcze raz.");
    }
  }

  return (
    <div className="zdjecie-nagrody">
      <input type="hidden" name={`nagroda_zdjecie_${miejsce}`} value={stan.etap === "gotowe" ? stan.wybrane : ""} />
      <input
        ref={pole}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const plik = e.target.files?.[0];
          e.target.value = "";
          if (plik) await przerob(await zmniejsz(plik).catch(() => plik));
        }}
      />

      {stan.etap === "pusty" && (
        <button type="button" className="przycisk-maly" onClick={() => pole.current?.click()}>
          📷 Zdjęcie nagrody (przeróbka AI)
        </button>
      )}

      {stan.etap === "przerabiam" && (
        <div className="zdjecie-nagrody-trwa" role="status">
          <img src={stan.podglad} alt="" />
          <span>Przerabiam zdjęcie w stylu Bractwa, ok. 30 s…</span>
        </div>
      )}

      {stan.etap === "gotowe" && (
        <>
          {stan.blad && <p className="blad">{stan.blad}</p>}
          <div
            className="zdjecie-nagrody-wybor"
            role="radiogroup"
            aria-label={`Zdjęcie nagrody za ${miejsce}. miejsce`}
          >
            {[
              { url: stan.przerobione, napis: "Po przeróbce" },
              { url: stan.oryginal, napis: "Oryginał" },
            ].map(
              (o) =>
                o.url && (
                  <button
                    key={o.napis}
                    type="button"
                    role="radio"
                    aria-checked={stan.wybrane === o.url}
                    className={`zdjecie-nagrody-opcja${stan.wybrane === o.url ? " wybrana" : ""}`}
                    onClick={() => ustaw({ ...stan, wybrane: o.url as string })}
                  >
                    <img src={o.url} alt="" />
                    <span>{o.napis}</span>
                  </button>
                ),
            )}
          </div>
          <div className="zdjecie-nagrody-akcje">
            <button
              type="button"
              className="przycisk-maly"
              // w stanie „gotowe” ostatnie zdjęcie zawsze jest w pamięci
              onClick={() => ostatni.current && void przerob(ostatni.current)}
            >
              Przerób jeszcze raz
            </button>
            <button type="button" className="przycisk-maly" onClick={() => pole.current?.click()}>
              Inne zdjęcie
            </button>
            <button type="button" className="przycisk-maly niebezpieczny" onClick={() => ustaw({ etap: "pusty" })}>
              Bez zdjęcia
            </button>
          </div>
        </>
      )}
    </div>
  );
}
