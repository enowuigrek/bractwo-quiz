"use client";

import { useEffect, useState } from "react";
import type { PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { dodajBoty } from "./akcje";

/**
 * Co ile pilot pyta bazę, czy któryś bot ma odpowiedzieć (`boty_odpowiadaj` losuje, kto teraz): w pytaniu boty
 * wpadają nieregularnie w pierwszych sekundach (zapisany czas jest udawany), w serii co kilka sekund.
 */
const CO_MS = 700;

/**
 * Boty do testów: w pytaniu i w serii finału pilot co chwilę woła `boty_odpowiadaj`, a baza każe części botów
 * odpowiedzieć teraz. W pytaniu zapisuje udawany czas 2–12 s (`wewn.udawany_czas_bota`), więc punkty i ranking
 * wyglądają jak u ludzi, a nikt nie czeka. Działa, dopóki pilot jest otwarty.
 */
export function useBoty(kod: string, token: string | null, stan: PilotStan | null) {
  const aktywne = !!token && !!stan?.boty && (stan.faza === "pytanie" || stan.faza === "seria");
  useEffect(() => {
    if (!aktywne || !token) return;
    const zegar = setInterval(() => {
      void supabase()
        .rpc("boty_odpowiadaj", { p_kod: kod, p_host_token: token })
        .then(() => undefined);
    }, CO_MS);
    return () => clearInterval(zegar);
  }, [aktywne, kod, token]);
}

/**
 * Karta w poczekalni: dodaje boty (nicki „Zenek Bot”, „Halina Bot”…), żeby testując nie grać samemu. Tylko dla
 * głównego (26.10), także przed otwarciem poczekalni: boty czekają w grze.
 */
export function BotyPilota({
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

  async function dodaj(ile: number) {
    if (wysylam) return;
    ustawWysylam(true);
    ustawBlad(null);
    const wynik = await dodajBoty(kod, token, ile).catch(() => ({ blad: "Brak połączenia. Spróbuj jeszcze raz." }));
    ustawWysylam(false);
    if ("blad" in wynik) {
      ustawBlad(wynik.blad);
      return;
    }
    onZmiana(wynik.stan);
  }

  return (
    <section className="karta">
      <p className="etykieta">
        Boty do testów{stan.boty ? ` · ${stan.boty}` : ""}
      </p>
      <button type="button" className="przycisk" disabled={wysylam} onClick={() => void dodaj(4)}>
        {wysylam ? "Dodaję…" : "Dodaj 4 boty"}
      </button>
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
    </section>
  );
}
