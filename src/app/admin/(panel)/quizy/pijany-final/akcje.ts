"use server";

import { refresh } from "next/cache";
import { wymagajAdmina } from "@/lib/admin";
import { czyEfektPijany, LIMITY_PIJANE } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

/** Zapisuje całą listę pytań pijanego finału naraz (kolejność z formularza). */
export async function zapiszPijanePytania(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajAdmina();
  let surowe: unknown;
  try {
    surowe = JSON.parse(String(dane.get("pytania") ?? "[]"));
  } catch {
    return { blad: "Nieprawidłowe pytania." };
  }
  const lista = Array.isArray(surowe) ? surowe : [];
  if (lista.length === 0) return { blad: "Dodaj przynajmniej jedno pytanie." };
  if (lista.length > LIMITY_PIJANE.pytan) return { blad: `Najwyżej ${LIMITY_PIJANE.pytan} pytań.` };

  const wiersze = [];
  for (const [i, p] of lista.entries()) {
    const tresc = String((p as { tresc?: unknown })?.tresc ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const efekt = (p as { efekt?: unknown })?.efekt;
    if (!tresc) return { blad: `Pytanie ${i + 1} jest puste.` };
    if (tresc.length > LIMITY_PIJANE.tresc) {
      return { blad: `Pytanie ${i + 1} może mieć najwyżej ${LIMITY_PIJANE.tresc} znaków.` };
    }
    if (!czyEfektPijany(efekt)) return { blad: `Wybierz efekt w pytaniu ${i + 1}.` };
    wiersze.push({ nr: i + 1, tresc, efekt });
  }

  // cała lista od nowa: usunięcie starej i wpisanie nowej (pytania nie mają odpowiedzi ani historii)
  const db = supabaseAdmin();
  const usun = await db.from("pijane_pytania").delete().gte("nr", 0);
  if (usun.error) return { blad: `Nie udało się zapisać: ${usun.error.message}` };
  const { error } = await db.from("pijane_pytania").insert(wiersze);
  if (error) return { blad: `Nie udało się zapisać: ${error.message}` };
  refresh();
  return { ok: "Zapisane. Nowe pytania będą w najbliższym pijanym finale." };
}
