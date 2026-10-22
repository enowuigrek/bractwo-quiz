"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { DaneWybor, StanFormularza } from "@/lib/typy";
import { LIMITY } from "./limity";

function tekst(dane: FormData, pole: string): string {
  return String(dane.get(pole) ?? "").trim();
}

// ---------------------------------------------------------------------------
// Quizy
// ---------------------------------------------------------------------------

export async function utworzQuiz(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajAdmina();
  const tytul = tekst(dane, "tytul");
  if (!tytul) return { blad: "Podaj tytuł quizu." };
  if (tytul.length > LIMITY.tytul) return { blad: `Tytuł może mieć najwyżej ${LIMITY.tytul} znaków.` };

  const { data, error } = await supabaseAdmin()
    .from("quizy")
    .insert({ tytul, opis: tekst(dane, "opis") || null })
    .select("id")
    .single();
  if (error) return { blad: `Nie udało się utworzyć quizu: ${error.message}` };
  redirect(`/admin/quizy/${data.id}`);
}

export async function zapiszQuiz(id: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajAdmina();
  const tytul = tekst(dane, "tytul");
  const opis = tekst(dane, "opis");
  if (!tytul) return { blad: "Podaj tytuł quizu." };
  if (tytul.length > LIMITY.tytul) return { blad: `Tytuł może mieć najwyżej ${LIMITY.tytul} znaków.` };
  if (opis.length > LIMITY.opis) return { blad: `Opis może mieć najwyżej ${LIMITY.opis} znaków.` };

  const { error } = await supabaseAdmin().from("quizy").update({ tytul, opis: opis || null }).eq("id", id);
  if (error) return { blad: `Nie udało się zapisać: ${error.message}` };
  // „Zapisz quiz” na dole edycji: zapis i powrót do listy
  if (dane.get("wroc")) redirect("/admin/quizy");
  refresh();
  return { ok: "Zapisano." };
}

export async function usunQuiz(id: string): Promise<void> {
  await wymagajAdmina();
  const db = supabaseAdmin();

  const { count } = await db.from("sesje").select("id", { count: "exact", head: true }).eq("quiz_id", id);
  if (count) redirect("/admin/quizy?blad=gry");

  const { data: zadania } = await db.from("zadania").select("grafika_url").eq("quiz_id", id);
  const { error } = await db.from("quizy").delete().eq("id", id);
  if (error) redirect("/admin/quizy?blad=usuwanie");
  await Promise.all((zadania ?? []).map((z) => usunGrafike(z.grafika_url)));
  redirect("/admin/quizy");
}

// ---------------------------------------------------------------------------
// Zadania (typ „wybór”)
// ---------------------------------------------------------------------------

function odczytajZadanie(dane: FormData): { blad: string } | { tresc: string; dane: DaneWybor } {
  const tresc = tekst(dane, "tresc");
  if (!tresc) return { blad: "Wpisz treść pytania." };
  if (tresc.length > LIMITY.tresc) return { blad: `Pytanie może mieć najwyżej ${LIMITY.tresc} znaków.` };

  const odpowiedzi = dane.getAll("odpowiedz").map((o) => String(o).trim());
  if (odpowiedzi.length < LIMITY.minOdpowiedzi || odpowiedzi.length > LIMITY.maxOdpowiedzi) {
    return { blad: `Pytanie musi mieć od ${LIMITY.minOdpowiedzi} do ${LIMITY.maxOdpowiedzi} odpowiedzi.` };
  }
  if (odpowiedzi.some((o) => !o)) return { blad: "Uzupełnij wszystkie odpowiedzi albo usuń puste." };
  if (odpowiedzi.some((o) => o.length > LIMITY.odpowiedz)) {
    return { blad: `Odpowiedź może mieć najwyżej ${LIMITY.odpowiedz} znaków.` };
  }
  if (new Set(odpowiedzi.map((o) => o.toLocaleLowerCase("pl"))).size !== odpowiedzi.length) {
    return { blad: "Odpowiedzi nie mogą się powtarzać." };
  }

  const poprawna = Number(dane.get("poprawna"));
  if (!Number.isInteger(poprawna) || poprawna < 0 || poprawna >= odpowiedzi.length) {
    return { blad: "Zaznacz poprawną odpowiedź." };
  }

  // czas na odpowiedź ustawia się przy uruchamianiu gry, nie w pytaniu
  return { tresc, dane: { odpowiedzi, poprawna } };
}

/** Dodaje zadanie na koniec quizu (zadanieId = null) albo zapisuje zmiany. */
export async function zapiszZadanie(
  quizId: string,
  zadanieId: string | null,
  _: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  await wymagajAdmina();
  const db = supabaseAdmin();

  const odczyt = odczytajZadanie(dane);
  if ("blad" in odczyt) return odczyt;

  const grafika = plikZFormularza(dane, "grafika");
  if (grafika) {
    const blad = bladGrafiki(grafika);
    if (blad) return { blad };
  }

  let staraGrafika: string | null = null;
  if (zadanieId) {
    const { data, error } = await db
      .from("zadania")
      .select("grafika_url")
      .eq("id", zadanieId)
      .eq("quiz_id", quizId)
      .single();
    if (error) return { blad: "Nie ma takiego zadania." };
    staraGrafika = data.grafika_url;
  }

  const zmiany: Record<string, unknown> = { ...odczyt, typ: "wybor" };
  try {
    if (grafika) zmiany.grafika_url = await wyslijGrafike(grafika, "zadania");
    else if (dane.get("grafika_usun")) zmiany.grafika_url = null;
  } catch (e) {
    return { blad: (e as Error).message };
  }

  let error;
  if (zadanieId) {
    ({ error } = await db.from("zadania").update(zmiany).eq("id", zadanieId));
  } else {
    const { data: ostatnie } = await db
      .from("zadania")
      .select("nr")
      .eq("quiz_id", quizId)
      .order("nr", { ascending: false })
      .limit(1)
      .maybeSingle();
    ({ error } = await db.from("zadania").insert({ ...zmiany, quiz_id: quizId, nr: (ostatnie?.nr ?? 0) + 1 }));
  }
  if (error) {
    if (typeof zmiany.grafika_url === "string") await usunGrafike(zmiany.grafika_url);
    return { blad: `Nie udało się zapisać: ${error.message}` };
  }
  if ("grafika_url" in zmiany && staraGrafika) await usunGrafike(staraGrafika);

  redirect(`/admin/quizy/${quizId}`);
}

export async function usunZadanie(quizId: string, zadanieId: string): Promise<void> {
  await wymagajAdmina();
  const { data } = await supabaseAdmin()
    .from("zadania")
    .delete()
    .eq("id", zadanieId)
    .eq("quiz_id", quizId)
    .select("grafika_url")
    .maybeSingle();
  await usunGrafike(data?.grafika_url);
  redirect(`/admin/quizy/${quizId}`);
}

/** Zamienia zadanie z sąsiadem wyżej albo niżej. */
export async function przesunZadanie(quizId: string, zadanieId: string, kierunek: "gora" | "dol"): Promise<void> {
  await wymagajAdmina();
  const db = supabaseAdmin();
  const { data: zadania } = await db.from("zadania").select("id").eq("quiz_id", quizId).order("nr");
  const lista = zadania ?? [];
  const i = lista.findIndex((z) => z.id === zadanieId);
  const j = kierunek === "gora" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= lista.length) return;

  const { error } = await db.rpc("admin_zamien_zadania", { p_a: lista[i].id, p_b: lista[j].id });
  if (error) throw new Error(`Nie udało się zmienić kolejności: ${error.message}`);
  refresh();
}
