"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { poprawnyKod } from "@/lib/gra/kod";

/**
 * Pole na kod gry na `/ekran` (TV bez ekranu lokalu). Sprawdzenie, czy gra istnieje, robi już strona docelowa.
 * `cel`: początek adresu, do którego doklejamy kod.
 */
export function WpiszKod({ cel, przycisk }: { cel: string; przycisk: string }) {
  const router = useRouter();
  const [kod, ustawKod] = useState("");
  const [wysylam, ustawWysylam] = useState(false);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!poprawnyKod(kod)) return;
        ustawWysylam(true);
        router.push(`${cel}${kod.toUpperCase()}`);
      }}
    >
      <label htmlFor="kod" className="etykieta">
        Kod gry
      </label>
      <input
        id="kod"
        className="pole pole-kod"
        value={kod}
        onChange={(e) => ustawKod(e.target.value.replace(/[^a-z]/gi, "").slice(0, 4).toUpperCase())}
        inputMode="text"
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        placeholder="ABCD"
        maxLength={4}
        autoFocus
      />
      <button type="submit" className="przycisk zloty" style={{ marginTop: 14 }} disabled={!poprawnyKod(kod) || wysylam}>
        {przycisk}
      </button>
    </form>
  );
}
