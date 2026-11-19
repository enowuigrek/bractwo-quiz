"use server";

import { jestTworca, rolaAdmina } from "@/lib/admin";
import type { PilotStan } from "@/lib/gra/typy";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { markaZadania } from "@/lib/marka-serwer";

/**
 * Boty do testów (26.10): tylko dla głównego (lokale ich nie potrzebują), także zanim poczekalnia się otworzy.
 * `dodaj_boty` jest dostępne tylko dla klucza serwisowego, a i tak sprawdza klucz pilota gry.
 */
export async function dodajBoty(kod: string, token: string, ile: number): Promise<{ stan: PilotStan } | { blad: string }> {
  const rola = await rolaAdmina();
  // w marce z `botyDlaKazdego` (JOWES, 18.11) boty dodaje każde zalogowane konto, żeby Zbyszko mógł sam testować
  const moze = !!rola && (jestTworca(rola) || (await markaZadania()).zasady.botyDlaKazdego);
  if (!moze) return { blad: "Boty dodaje tylko twórca." };
  const { data, error } = await supabaseAdmin().rpc("dodaj_boty", { p_kod: kod, p_host_token: token, p_ile: ile });
  if (error) return { blad: error.message };
  return { stan: data as PilotStan };
}
