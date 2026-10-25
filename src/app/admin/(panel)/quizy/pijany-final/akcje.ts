"use server";

import { refresh } from "next/cache";
import { wymagajGlownego } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { czyEfektPijany, LIMITY_PIJANE } from "@/lib/pijany";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

/**
 * Zapisuje całą listę pytań pijanego finału naraz (kolejność z formularza): wspólną pulę (`quizId` null) albo
 * wejście jednego quizu (`pijane_pytania_quizu`, może być puste).
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
    const tresc = String((p as { tresc?: unknown })?.tresc ?? "")
      .trim()
      .replace(/\s+/g, " ");
    const efekt = (p as { efekt?: unknown })?.efekt;
    // komentarze po ✓ i ✗: puste = bez własnego (wtedy czasem ogólny)
    const komentarz = (pole: "komentarz_prawda" | "komentarz_falsz") =>
      String((p as Record<string, unknown>)?.[pole] ?? "")
        .trim()
        .replace(/\s+/g, " ") || null;
    const komentarzPrawda = komentarz("komentarz_prawda");
    const komentarzFalsz = komentarz("komentarz_falsz");
    if (!tresc) return { blad: `Pytanie ${i + 1} jest puste.` };
    if (tresc.length > LIMITY_PIJANE.tresc) {
      return { blad: `Pytanie ${i + 1} może mieć najwyżej ${LIMITY_PIJANE.tresc} znaków.` };
    }
    if (!czyEfektPijany(efekt)) return { blad: `Wybierz efekt w pytaniu ${i + 1}.` };
    if ((komentarzPrawda?.length ?? 0) > LIMITY_PIJANE.komentarz || (komentarzFalsz?.length ?? 0) > LIMITY_PIJANE.komentarz) {
      return { blad: `Komentarz w pytaniu ${i + 1} może mieć najwyżej ${LIMITY_PIJANE.komentarz} znaków.` };
    }
    wiersze.push({ ...(quizId ? { quiz_id: quizId } : {}), nr: i + 1, tresc, efekt, komentarz_prawda: komentarzPrawda, komentarz_falsz: komentarzFalsz });
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
