"use server";

import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { wymagajQuizu } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";

/** Ile botów gra w teście (z nich finał wybiera finalistów jak w prawdziwej grze). */
const BOTOW = 12;
/** Seria startuje za tyle sekund, żeby zdążyć otworzyć ekran. */
const NA_OTWARCIE_S = 10;

/**
 * Test samego finału (18.11, JOWES): gra z botami, od razu na planszy finału
 * tego quizu, z automatem. Boty nie mają punktów z etapów, więc przewagę na starcie losujemy. Otwiera pilota tej gry
 * (stamtąd ekran TV i „Zakończ grę”). Jak `testPijanegoFinalu`, ale zwykły finał dowolnego quizu z finałem serią.
 */
export async function testFinalu(quizId: string): Promise<void> {
  await wymagajQuizu(await wymagajAdmina(), quizId, true);
  const db = supabaseAdmin();

  const { data: final } = await db
    .from("etapy")
    .select("id, czas_s")
    .eq("quiz_id", quizId)
    .eq("finalowy", true)
    .eq("seria", true)
    .order("nr")
    .limit(1)
    .maybeSingle<{ id: string; czas_s: number | null }>();
  if (!final) throw new Error("Ten quiz nie ma finału serią.");
  const { data: pierwsze } = await db
    .from("zadania")
    .select("nr")
    .eq("etap_id", final.id)
    .order("nr")
    .limit(1)
    .maybeSingle<{ nr: number }>();
  if (!pierwsze) throw new Error("Finał nie ma pytań.");

  // ekran lokalu quizu (np. JOWES) pokazuje test, ale tylko gdy w tym lokalu nie trwa inna gra: test w trakcie
  // prawdziwej gry nie może przejąć ekranu (wtedy gra bez lokalu, ekran pod /tv/KOD)
  const { data: quiz } = await db.from("quizy").select("lokal_id").eq("id", quizId).maybeSingle<{ lokal_id: string | null }>();
  let lokal: string | null = quiz?.lokal_id ?? null;
  if (lokal) {
    const { count } = await db
      .from("sesje")
      .select("id", { count: "exact", head: true })
      .eq("lokal_id", lokal)
      .neq("faza", "koniec");
    if (count) lokal = null;
  }

  const { data: gra, error } = await db
    .from("sesje")
    .insert({ quiz_id: quizId, okazja: "Test finału", pijany_final: false, lokal_id: lokal })
    .select("id, kod, host_token")
    .single<{ id: string; kod: string; host_token: string }>();
  if (error || !gra) throw new Error(`Nie udało się założyć gry: ${error?.message}`);
  const prowadzacy = { p_kod: gra.kod, p_host_token: gra.host_token };

  const { error: bladBotow } = await db.rpc("dodaj_boty", { ...prowadzacy, p_ile: BOTOW });
  if (bladBotow) throw new Error(`Nie udało się dodać botów: ${bladBotow.message}`);
  // koniec ostatniego etapu przed finałem, a „następne” otwiera planszę finału (wybór finalistów jak w grze)
  await db
    .from("sesje")
    .update({ faza: "ranking", zadanie_nr: pierwsze.nr - 1, poczekalnia_otwarta: true })
    .eq("id", gra.id);
  const { error: bladFinalu } = await db.rpc("pilot_akcja", { ...prowadzacy, p_akcja: "nastepne" });
  if (bladFinalu) throw new Error(`Nie udało się otworzyć finału: ${bladFinalu.message}`);

  // przewaga na starcie losowa (0–3), żeby wyścig nie ruszał z jednej linii
  const { data: gracze } = await db.from("gracze").select("id").eq("sesja_id", gra.id).returns<{ id: string }[]>();
  await Promise.all(
    (gracze ?? []).map((g) =>
      db
        .from("gracze")
        .update({ start_finalu: Math.floor(Math.random() * 4) })
        .eq("id", g.id),
    ),
  );
  // od razu seria z czasem z quizu, start za `NA_OTWARCIE_S`
  const { error: bladSerii } = await db.rpc("pilot_akcja", { ...prowadzacy, p_akcja: "nastepne" });
  if (bladSerii) throw new Error(`Nie udało się zacząć finału: ${bladSerii.message}`);
  const start = Date.now() + NA_OTWARCIE_S * 1000;
  await db
    .from("sesje")
    .update({
      faza_od: new Date(start).toISOString(),
      faza_do: new Date(start + (final.czas_s ?? 60) * 1000).toISOString(),
    })
    .eq("id", gra.id)
    .eq("faza", "seria");
  await db.rpc("ustaw_auto", { ...prowadzacy, p_wlacz: true });
  redirect(`/pilot/${gra.kod}?t=${encodeURIComponent(gra.host_token)}`);
}
