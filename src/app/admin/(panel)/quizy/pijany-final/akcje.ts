"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
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

/**
 * Test pijanego finału bez całej rozgrywki (26.10, Łukasz: obejrzeć go w różnych przeglądarkach): gra testowa bez
 * lokalu (nie przełącza ekranu lokalu) z pięcioma botami, z wybraną trójką finału i losową przewagą na starcie,
 * od razu na krótkiej serii finału, z automatycznym prowadzeniem. Przy otwartym ekranie gry boty odpowiadają,
 * a automat puszcza pijany finał, werble i podium. Grę widzi tylko główny; usuwa się ją jak każdą inną (Gry → gra → Usuń grę).
 */
/** Test pijanego finału: tyle sekund na otwarcie ekranu przed serią i tyle trwa sama seria. */
const NA_OTWARCIE_S = 15;
const SERIA_TESTU_S = 25;

export async function testPijanegoFinalu(): Promise<void> {
  await wymagajGlownego();
  const db = supabaseAdmin();

  // quiz z finałem serią: najpierw Piwny quiz Bractwa, inaczej pierwszy, jaki jest
  const { data: finaly } = await db
    .from("etapy")
    .select("id, quizy!inner(id, tytul, usunieto)")
    .eq("finalowy", true)
    .eq("seria", true)
    .is("quizy.usunieto", null)
    .returns<{ id: string; quizy: { id: string; tytul: string } }[]>();
  const final = (finaly ?? []).sort(
    (a, b) => Number(b.quizy.tytul.startsWith("Piwny")) - Number(a.quizy.tytul.startsWith("Piwny")),
  )[0];
  if (!final) throw new Error("Żaden quiz nie ma finału serią.");
  const { data: pierwsze } = await db
    .from("zadania")
    .select("nr")
    .eq("etap_id", final.id)
    .order("nr")
    .limit(1)
    .maybeSingle<{ nr: number }>();
  if (!pierwsze) throw new Error("Finał nie ma pytań.");

  const { data: gra, error } = await db
    .from("sesje")
    .insert({ quiz_id: final.quizy.id, okazja: "Test pijanego finału", pijany_final: true, tylko_glowny: true })
    .select("id, kod, host_token")
    .single<{ id: string; kod: string; host_token: string }>();
  if (error || !gra) throw new Error(`Nie udało się założyć gry: ${error?.message}`);
  const prowadzacy = { p_kod: gra.kod, p_host_token: gra.host_token };

  const { error: bladBotow } = await db.rpc("dodaj_boty", { ...prowadzacy, p_ile: 5 });
  if (bladBotow) throw new Error(`Nie udało się dodać botów: ${bladBotow.message}`);
  // koniec ostatniego etapu przed finałem, a „następne” otwiera planszę finału (wybór trójki jak w grze)
  await db
    .from("sesje")
    .update({ faza: "ranking", zadanie_nr: pierwsze.nr - 1, poczekalnia_otwarta: true })
    .eq("id", gra.id);
  const { error: bladFinalu } = await db.rpc("pilot_akcja", { ...prowadzacy, p_akcja: "nastepne" });
  if (bladFinalu) throw new Error(`Nie udało się otworzyć finału: ${bladFinalu.message}`);

  // boty nie mają punktów z etapów, więc przewagę na starcie losujemy, żeby wyścig nie ruszał z jednej linii
  const { data: gracze } = await db.from("gracze").select("id").eq("sesja_id", gra.id).returns<{ id: string }[]>();
  await Promise.all(
    (gracze ?? []).map((g) =>
      db
        .from("gracze")
        .update({ start_finalu: Math.floor(Math.random() * 5) })
        .eq("id", g.id),
    ),
  );
  // od razu seria, ale krótka (w quizie bywa 3 min): start za `NA_OTWARCIE_S`, żeby zdążyć otworzyć ekran
  const { error: bladSerii } = await db.rpc("pilot_akcja", { ...prowadzacy, p_akcja: "nastepne" });
  if (bladSerii) throw new Error(`Nie udało się zacząć serii: ${bladSerii.message}`);
  const start = Date.now() + NA_OTWARCIE_S * 1000;
  await db
    .from("sesje")
    .update({
      faza_od: new Date(start).toISOString(),
      faza_do: new Date(start + SERIA_TESTU_S * 1000).toISOString(),
    })
    .eq("id", gra.id)
    .eq("faza", "seria");
  await db.rpc("ustaw_auto", { ...prowadzacy, p_wlacz: true });
  redirect(`/admin/gry/${gra.id}`);
}
