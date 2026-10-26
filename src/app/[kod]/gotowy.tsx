"use client";

import { useState } from "react";
import type { StanSesji } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Na planszach (wstęp, etap, ciekawostka) gracz klika „Gotowy”. Od 26.10 zawsze, także gdy prowadzi człowiek:
 * prowadzący widzi w pilocie, kto już jest gotowy, i nie rusza bez nich. Przy automacie (`stan.auto`), gdy gotowi
 * są wszyscy, gra sama idzie dalej (src/app/pilot/[kod]/auto.tsx).
 */
export function Gotowy({ stan, token }: { stan: StanSesji; token: string }) {
  // kliknięcie dotyczy tej jednej planszy (nowa plansza ma nowe `faza_od`)
  const [kliknieta, ustawKliknieta] = useState<string | null>(null);
  const plansza = stan.faza_od ?? "";
  const gotowy = kliknieta === plansza;

  async function klik() {
    ustawKliknieta(plansza);
    const { error } = await supabase().rpc("gotowy", { p_token: token });
    if (error) ustawKliknieta(null);
  }

  return (
    <div className="gotowy">
      <button type="button" className="przycisk zloty" disabled={gotowy} onClick={() => void klik()}>
        {gotowy ? "✓ Gotowy" : "Gotowy!"}
      </button>
      <p className="pomocniczy">
        Gotowi: {stan.gotowi}/{stan.gotowi_z}. {gotowy ? "Czekamy na resztę…" : "Kliknij, gdy możemy grać dalej."}
      </p>
    </div>
  );
}
