"use server";

import { refresh } from "next/cache";
import { wymagajGlownego } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { LIMITY_PIJANE } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

/**
 * Zapisuje całą listę pytań pijanego finału naraz: wspólną pulę (`quizId` null; z grupą `piwne`, kolejność bez
 * znaczenia, bo baza losuje w grupach) albo wejście jednego quizu (`pijane_pytania_quizu`, po kolei, może być puste).
 * Przeszkadzacze nie są już przy pytaniach (idą według pozycji, src/lib/pijany.ts).
 */
export async function zapiszPijanePytania(
  quizId: string | null,
  _: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  const rola = await wymagajGlownego();
  if (quizId) await wymagajQuizu(rola, quizId);
  const limit = quizId ? LIMITY_PIJANE.wejscie : LIMITY_PIJANE.pytan;
  let surowe: unknown;
  try {
    surowe = JSON.parse(String(dane.get("pytania") ?? "[]"));
  } catch {
    return { blad: "Nieprawidłowe pytania." };
  }
  const lista = Array.isArray(surowe) ? surowe : [];
  if (lista.length === 0 && !quizId) return { blad: "Dodaj przynajmniej jedno pytanie." };
  if (lista.length > limit) return { blad: `Najwyżej ${limit} pytań.` };

  const wiersze = [];
  for (const [i, p] of lista.entries()) {
    const pole = (nazwa: string) =>
      String((p as Record<string, unknown>)?.[nazwa] ?? "")
        .trim()
        .replace(/\s+/g, " ");
    const tresc = pole("tresc");
    // komentarze po ✓ i ✗: puste = bez własnego (wtedy czasem ogólny)
    const komentarzPrawda = pole("komentarz_prawda") || null;
    const komentarzFalsz = pole("komentarz_falsz") || null;
    if (!tresc) return { blad: `Pytanie ${i + 1} jest puste.` };
    if (tresc.length > LIMITY_PIJANE.tresc) {
      return { blad: `Pytanie ${i + 1} może mieć najwyżej ${LIMITY_PIJANE.tresc} znaków.` };
    }
    if (
      (komentarzPrawda?.length ?? 0) > LIMITY_PIJANE.komentarz ||
      (komentarzFalsz?.length ?? 0) > LIMITY_PIJANE.komentarz
    ) {
      return { blad: `Komentarz w pytaniu „${tresc}” może mieć najwyżej ${LIMITY_PIJANE.komentarz} znaków.` };
    }
    wiersze.push({
      ...(quizId ? { quiz_id: quizId } : { piwne: (p as { piwne?: unknown })?.piwne === true }),
      nr: i + 1,
      tresc,
      komentarz_prawda: komentarzPrawda,
      komentarz_falsz: komentarzFalsz,
    });
  }

  // cała lista od nowa: usunięcie starej i wpisanie nowej (pytania nie mają odpowiedzi ani historii)
  const db = supabaseAdmin();
  const usun = quizId
    ? await db.from("pijane_pytania_quizu").delete().eq("quiz_id", quizId)
    : await db.from("pijane_pytania").delete().gte("nr", 0);
  if (usun.error) return { blad: `Nie udało się zapisać: ${usun.error.message}` };
  if (wiersze.length) {
    const { error } = await db.from(quizId ? "pijane_pytania_quizu" : "pijane_pytania").insert(wiersze);
    if (error) return { blad: `Nie udało się zapisać: ${error.message}` };
  }
  refresh();
  return { ok: "Zapisane. Nowe pytania będą w najbliższym pijanym finale." };
}
