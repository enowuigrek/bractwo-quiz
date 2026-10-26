"use client";

import { useState } from "react";
import type { StanSesji } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Przy automatycznym prowadzeniu (`stan.auto`) na planszach (wstęp, etap, ciekawostka): gracz klika „Gotowy”,
 * a gdy gotowi są wszyscy, pilot sam idzie dalej (src/app/pilot/[kod]/auto.tsx). Bez automatu nic nie pokazuje.
 */
export function Gotowy({ stan, token }: { stan: StanSesji; token: string }) {
  // kliknięcie dotyczy tej jednej planszy (nowa plansza ma nowe `faza_od`)
  const [kliknieta, ustawKliknieta] = useState<string | null>(null);
  if (!stan.auto) return null;
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
        Gotowi: {stan.gotowi}/{stan.gotowi_z}. {gotowy ? "Czekamy na resztę…" : "Gra ruszy, gdy wszyscy będą gotowi."}
      </p>
    </div>
  );
}
