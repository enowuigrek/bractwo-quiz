"use client";

import { useState } from "react";

/**
 * Pod selfie w poczekalni: „Przerób w stylu Bractwa”. Za zgodą gracza serwer wysyła zdjęcie do OpenAI
 * (`/api/awatar`, ok. 20 s) i podmienia je na przerobione. Raz na gracza; nowe selfie można przerobić znowu.
 */
export function PrzerobkaAwatara({
  token,
  zdjecie,
  odswiez,
}: {
  token: string;
  zdjecie: string | null;
  odswiez: () => Promise<void>;
}) {
  const [trwa, ustawTrwa] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
  if (!zdjecie || zdjecie.includes("-ai-")) return null;

  async function przerob() {
    ustawTrwa(true);
    ustawBlad(null);
    try {
      const odp = await fetch("/api/awatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const wynik = (await odp.json()) as { ok: boolean; blad?: string };
      if (!wynik.ok) ustawBlad(wynik.blad ?? "Nie udało się przerobić zdjęcia.");
      await odswiez();
    } catch {
      ustawBlad("Brak połączenia. Spróbuj jeszcze raz.");
    } finally {
      ustawTrwa(false);
    }
  }

  return (
    <div className="przerobka-awatara">
      <button type="button" className="przycisk-zdjecie" onClick={() => void przerob()} disabled={trwa}>
        {trwa ? "Przerabiam, ok. 20 s…" : "✨ Przerób w stylu Bractwa"}
      </button>
      <span className="pomocniczy">Zdjęcie trafi na chwilę do OpenAI, które dorysuje złote światło baru.</span>
      {blad && (
        <span className="blad" role="alert">
          {blad}
        </span>
      )}
    </div>
  );
}
