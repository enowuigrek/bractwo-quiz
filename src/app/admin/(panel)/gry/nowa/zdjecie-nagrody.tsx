"use client";
/* eslint-disable @next/next/no-img-element -- zdjęcia nagród z bucketu Supabase */

import { useRef, useState } from "react";
import { IkonaAparat } from "@/components/ikony";

/** Dłuższy bok wysyłanego zdjęcia (Vercel ma limit 4,5 MB na żądanie). */
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

type Stan = { etap: "pusty" } | { etap: "wysylam"; podglad: string } | { etap: "gotowe"; url: string };

/**
 * Zdjęcie nagrody w kreatorze: zrób zdjęcie (albo wybierz plik), przeglądarka je zmniejsza, a serwer zapisuje
 * w buckecie (`/api/nagroda`). Adres idzie w ukrytym polu `nagroda_zdjecie_<miejsce>`. Bez przeróbki przez AI
 * (wyłączona 25.10).
 */
export function ZdjecieNagrody({
  miejsce,
  poczatkowe = null,
  pilot = null,
  onZmiana,
}: {
  miejsce: number;
  /** Zdjęcie, które nagroda już ma (pilot: zmiana nagród przed startem). */
  poczatkowe?: string | null;
  /** Wysyłanie z pilota: kod i klucz pilota zamiast logowania w panelu. */
  pilot?: { kod: string; token: string } | null;
  /** Adres zdjęcia po każdej zmianie (pilot trzyma nagrody w stanie, nie w formularzu). */
  onZmiana?: (url: string | null) => void;
}) {
  const [stan, ustawStan] = useState<Stan>(poczatkowe ? { etap: "gotowe", url: poczatkowe } : { etap: "pusty" });
  const ustaw = (s: Stan) => {
    ustawStan(s);
    if (s.etap !== "wysylam") onZmiana?.(s.etap === "gotowe" ? s.url : null);
  };
  const pole = useRef<HTMLInputElement>(null);

  async function wyslij(zdjecie: Blob) {
    ustaw({ etap: "wysylam", podglad: URL.createObjectURL(zdjecie) });
    const dane = new FormData();
    dane.append("plik", zdjecie, "nagroda.jpg");
    if (pilot) {
      dane.append("kod", pilot.kod);
      dane.append("host_token", pilot.token);
    }
    try {
      const odp = await fetch("/api/nagroda", { method: "POST", body: dane });
      const wynik = (await odp.json()) as { ok: boolean; blad?: string; url?: string };
      if (wynik.ok && wynik.url) {
        ustaw({ etap: "gotowe", url: wynik.url });
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
      <input type="hidden" name={`nagroda_zdjecie_${miejsce}`} value={stan.etap === "gotowe" ? stan.url : ""} />
      <input
        ref={pole}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={async (e) => {
          const plik = e.target.files?.[0];
          e.target.value = "";
          if (plik) await wyslij(await zmniejsz(plik).catch(() => plik));
        }}
      />

      {/* jak pole pliku z logo browaru: przycisk, miniatura i podpis w jednym wierszu (26.10) */}
      <button
        type="button"
        className="przycisk-maly"
        disabled={stan.etap === "wysylam"}
        onClick={() => pole.current?.click()}
      >
        <IkonaAparat /> {stan.etap === "gotowe" ? "Inne zdjęcie" : "Zdjęcie nagrody"}
      </button>
      {stan.etap === "wysylam" && (
        <span className="zdjecie-nagrody-trwa" role="status">
          <img src={stan.podglad} alt="" />
          Wysyłam…
        </span>
      )}
      {stan.etap === "gotowe" && (
        <>
          <img
            src={stan.url}
            alt={`Zdjęcie nagrody za ${miejsce}. miejsce`}
            className="zdjecie-nagrody-miniatura"
          />
          <button type="button" className="przycisk-maly niebezpieczny" onClick={() => ustaw({ etap: "pusty" })}>
            Bez zdjęcia
          </button>
        </>
      )}
    </div>
  );
}
