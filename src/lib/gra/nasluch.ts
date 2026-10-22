"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/przegladarka";
import type { FazaWidoczna, StanSesji } from "./typy";

/**
 * Zdarzenia z bazy: na temacie `sesja:<KOD>` (patrz `wewn.rozglos`) oraz `gra`
 * na temacie `lokal:<adres_ekranu>` (patrz `wewn.po_zmianie_gry_lokalu`).
 */
export type Zdarzenie = "stan" | "gracz" | "odpowiedz" | "gra";

/**
 * Trzyma dane strony gry w zgodzie z bazą. Woła `pobierz`:
 * - od razu i po każdym (ponownym) podłączeniu do Realtime,
 * - po każdym z `zdarzenia` z kanału `sesja:<KOD>`,
 * - po powrocie karty na pierwszy plan,
 * - zapasowo co `coIleMs`, bo `realtime.send` potrafi po cichu zgubić zdarzenie
 *   (brak partycji `realtime.messages`, patrz PLAN.md).
 * Wywołania nie nakładają się: zdarzenie w trakcie pobierania kończy się jednym dodatkowym pobraniem.
 */
export function useNasluch(kod: string, pobierz: () => Promise<void>, zdarzenia: Zdarzenie[], coIleMs = 5000) {
  useNasluchTematu(`sesja:${kod}`, pobierz, zdarzenia, coIleMs);
}

/** Jak `useNasluch`, ale na dowolnym temacie Realtime (np. `lokal:<adres_ekranu>`). */
export function useNasluchTematu(
  temat: string,
  pobierz: () => Promise<void>,
  zdarzenia: Zdarzenie[],
  coIleMs = 5000,
) {
  const pobierzRef = useRef(pobierz);
  useEffect(() => {
    pobierzRef.current = pobierz;
  });

  const klucz = zdarzenia.join(",");

  useEffect(() => {
    let trwa = false;
    let jeszcze = false;
    let zamkniete = false;

    async function odswiez() {
      if (zamkniete) return;
      if (trwa) {
        jeszcze = true;
        return;
      }
      trwa = true;
      try {
        do {
          jeszcze = false;
          await pobierzRef.current();
        } while (jeszcze && !zamkniete);
      } finally {
        trwa = false;
      }
    }

    const kanal = supabase().channel(temat);
    for (const zdarzenie of klucz.split(",").filter(Boolean)) {
      kanal.on("broadcast", { event: zdarzenie }, () => void odswiez());
    }
    kanal.subscribe((status) => {
      if (status === "SUBSCRIBED") void odswiez();
    });

    void odswiez();
    const zegar = setInterval(() => void odswiez(), coIleMs);
    const naWidok = () => {
      if (document.visibilityState === "visible") void odswiez();
    };
    document.addEventListener("visibilitychange", naWidok);

    return () => {
      zamkniete = true;
      clearInterval(zegar);
      document.removeEventListener("visibilitychange", naWidok);
      void supabase().removeChannel(kanal);
    };
  }, [temat, klucz, coIleMs]);
}

/**
 * Różnica zegara serwera względem zegara urządzenia w ms (serwer − urządzenie).
 * Zakładamy, że serwer odczytał `teraz` w połowie drogi żądania.
 */
export function przesuniecieZegara(teraz: string, wyslano: number, odebrano: number): number {
  return Date.parse(teraz) - (wyslano + odebrano) / 2;
}

/** Komunikat z błędu RPC (wyjątki z funkcji w Postgresie są po polsku). */
export function komunikatBledu(blad: unknown): string {
  if (blad && typeof blad === "object" && "message" in blad && typeof blad.message === "string") {
    if (blad.message === "Failed to fetch" || blad.message.includes("NetworkError")) {
      return "Brak połączenia z serwerem";
    }
    return blad.message;
  }
  return "Coś poszło nie tak";
}

/** Pobiera `stan_sesji` i mierzy przesunięcie zegara. */
export async function pobierzStan(kod: string): Promise<{ stan: StanSesji; przesuniecie: number }> {
  const wyslano = Date.now();
  const { data, error } = await supabase().rpc("stan_sesji", { p_kod: kod });
  const odebrano = Date.now();
  if (error) throw error;
  const stan = data as StanSesji;
  return { stan, przesuniecie: przesuniecieZegara(stan.teraz, wyslano, odebrano) };
}

/** Bieżący czas serwera, odświeżany co `coIleMs`, gdy `aktywny`. */
export function useCzasSerwera(przesuniecie: number, aktywny: boolean, coIleMs = 250): number {
  const [teraz, ustawTeraz] = useState(() => Date.now() + przesuniecie);
  useEffect(() => {
    if (!aktywny) return;
    const zegar = setInterval(() => ustawTeraz(Date.now() + przesuniecie), coIleMs);
    return () => clearInterval(zegar);
  }, [przesuniecie, aktywny, coIleMs]);
  return teraz;
}

/**
 * Faza w tej chwili według zegara serwera. `przygotuj` przechodzi w `pytanie`, gdy minie `faza_od`,
 * bez czekania na bazę: wszystkie ekrany odsłaniają pytanie w tym samym momencie.
 * `czasMinal`: pytanie trwa w bazie, ale jego czas już się skończył (za chwilę wynik, patrz `useKoniecPytania`).
 * `bezLimitu`: pytanie bez limitu czasu, które jeszcze trwa (`faza_do` puste, `doKonca` = ∞).
 * Kończy się, gdy odpowiedzą wszyscy (baza od razu pokazuje wynik) albo prowadzący zakończy je ręcznie.
 */
export function fazaTeraz(
  stan: Pick<StanSesji, "faza" | "faza_od" | "faza_do">,
  teraz: number,
): { faza: FazaWidoczna; doStartu: number; doKonca: number; czasMinal: boolean; bezLimitu: boolean } {
  const od = stan.faza_od ? Date.parse(stan.faza_od) : 0;
  const faza = stan.faza === "przygotuj" && teraz >= od ? "pytanie" : stan.faza;
  const bezLimitu = (faza === "przygotuj" || faza === "pytanie") && !stan.faza_do;
  const doKonca = bezLimitu ? Infinity : stan.faza_do ? Date.parse(stan.faza_do) - teraz : 0;
  return { faza, doStartu: od - teraz, doKonca, czasMinal: faza === "pytanie" && doKonca <= 0, bezLimitu };
}

/**
 * Gdy zegar pokazuje koniec czasu pytania, prosi bazę o wynik (`dokoncz_pytanie`; baza sama
 * sprawdza czas, więc wcześniejsze wołanie nic nie zmienia). Woła TV, pilot i telefony, co 2 s do skutku.
 */
export function useKoniecPytania(kod: string, stan: Pick<StanSesji, "faza" | "faza_od" | "faza_do"> | null, teraz: number) {
  const ostatnio = useRef(0);
  const faza = stan ? fazaTeraz(stan, teraz).faza : null;
  // sekunda zapasu w bazie na opóźnione odpowiedzi
  const poKoncu = faza === "pytanie" && stan?.faza_do ? teraz - Date.parse(stan.faza_do) > 1100 : false;
  const [tik, ustawTik] = useState(0);
  useEffect(() => {
    if (!poKoncu) return;
    const zegar = setInterval(() => ustawTik((t) => t + 1), 2000);
    return () => clearInterval(zegar);
  }, [poKoncu]);
  useEffect(() => {
    if (!poKoncu || Date.now() - ostatnio.current < 1500) return;
    ostatnio.current = Date.now();
    // zapytanie Supabase rusza dopiero po `then`; błąd sieci: kolejna próba za 2 s
    void supabase()
      .rpc("dokoncz_pytanie", { p_kod: kod })
      .then(() => undefined);
  }, [kod, poKoncu, tik]);
}

/** Czas odpowiedzi do wyświetlenia, np. „3,4 s”. */
export function sekundy(ms: number): string {
  return `${(ms / 1000).toLocaleString("pl-PL", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} s`;
}

/** Bezpieczny dostęp do localStorage (tryb prywatny, zablokowane dane). */
export const pamiec = {
  czytaj(klucz: string): string | null {
    try {
      return localStorage.getItem(klucz);
    } catch {
      return null;
    }
  },
  zapisz(klucz: string, wartosc: string): boolean {
    try {
      localStorage.setItem(klucz, wartosc);
      return true;
    } catch {
      return false;
    }
  },
  usun(klucz: string) {
    try {
      localStorage.removeItem(klucz);
    } catch {}
  },
};
