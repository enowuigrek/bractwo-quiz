"use client";

import { useState } from "react";
import { komunikatBledu } from "@/lib/gra/nasluch";
import type { PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Odpadanie w etapach przed finałem, do zmiany przed startem (poczekalnia). Domyślne progi liczy baza z liczby
 * graczy (`wewn.progi_domyslne`: do 8 nikt, 9–15: 6 przed walką o finał, od 16 też połowa etap wcześniej),
 * dopóki prowadzący ich nie zmieni; start quizu je zapisuje. Odciąć można po etapach od 2. do tego przed walką
 * o finał (walka o finał zawsze daje trójkę finalistów). Każda zmiana zapisuje się od razu (`ustaw_progi`).
 */
export function ProgiPilota({
  stan,
  kod,
  token,
  onZmiana,
}: {
  stan: PilotStan;
  kod: string;
  token: string;
  onZmiana: (nowy: PilotStan) => void;
}) {
  const [wysylam, ustawWysylam] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
  const final = stan.etapy.find((e) => e.finalowy);
  if (!final) return null;
  // etapy, po których można odciąć: od 2. do tego przed walką o finał (walka to etap tuż przed finałem)
  const etapy = stan.etapy.filter((e) => e.nr >= 2 && e.nr <= final.nr - 2);
  if (etapy.length === 0) return null;
  const n = stan.liczba_graczy;

  async function zapisz(nr: number, wartosc: number | null) {
    if (wysylam) return;
    const progi = { ...stan.progi };
    if (wartosc === null) delete progi[String(nr)];
    else progi[String(nr)] = wartosc;
    ustawWysylam(true);
    ustawBlad(null);
    const { data, error } = await supabase().rpc("ustaw_progi", { p_kod: kod, p_host_token: token, p_progi: progi });
    ustawWysylam(false);
    if (error) {
      ustawBlad(komunikatBledu(error));
      return;
    }
    onZmiana(data as PilotStan);
  }

  return (
    <section className="karta" style={{ marginTop: 18 }}>
      <p className="etykieta" style={{ marginTop: 0 }}>
        Odpadanie przed finałem
      </p>
      <ul className="progi-pilota">
        {etapy.map((e) => {
          const prog = stan.progi[String(e.nr)] ?? null;
          return (
            <li key={e.nr}>
              <span>
                Po etapie {e.nr} <span className="pomocniczy">· {e.nazwa}</span>
              </span>
              <span className="progi-pilota-wartosc">
                <button
                  type="button"
                  className="przycisk-zdjecie"
                  disabled={wysylam || prog === null}
                  onClick={() => void zapisz(e.nr, prog !== null && prog > 3 ? prog - 1 : null)}
                  aria-label={`Mniej graczy po etapie ${e.nr}`}
                >
                  −
                </button>
                <strong>{prog === null ? "wszyscy" : `zostaje ${prog}`}</strong>
                <button
                  type="button"
                  className="przycisk-zdjecie"
                  disabled={wysylam || (prog !== null && prog >= n - 1)}
                  onClick={() =>
                    // włączenie odcięcia: na start ok. trzy czwarte grających
                    void zapisz(e.nr, prog === null ? Math.max(3, Math.min(n - 1, Math.ceil(n * 0.75))) : prog + 1)
                  }
                  aria-label={`Więcej graczy po etapie ${e.nr}`}
                >
                  +
                </button>
              </span>
            </li>
          );
        })}
      </ul>
      <p className="pomocniczy" style={{ margin: "8px 0 0" }}>
        {stan.progi_wlasne
          ? "Ustawione ręcznie. "
          : `Domyślnie z liczby graczy (teraz ${n}), liczone na nowo, gdy ktoś dołączy. `}
        Do finału zawsze wchodzi trójka po walce o finał. Odpadnięci patrzą i kibicują.
      </p>
      {blad && (
        <p className="blad" role="alert" style={{ margin: "8px 0 0" }}>
          {blad}
        </p>
      )}
    </section>
  );
}
