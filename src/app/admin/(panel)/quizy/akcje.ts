"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";
import { czyTypZadania, type ZadanieDane } from "@/lib/zadania";
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
// Zadania (typy: src/lib/zadania.ts)
// ---------------------------------------------------------------------------

/** Losowa permutacja 0..n-1, różna od ułożenia po kolei (żeby nie dało się odgadnąć „z góry”). */
function mieszanie(n: number): number[] {
  for (;;) {
    const p = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    if (n < 2 || p.some((x, i) => x !== i)) return p;
  }
}

/** Sprawdza listę tekstów: liczba, puste, długość, powtórzenia. Zwraca opis błędu albo null. */
function bladListy(teksty: unknown, min: number, nazwa: string): string | null {
  if (!Array.isArray(teksty) || teksty.some((t) => typeof t !== "string")) return "Nieprawidłowe dane pytania.";
  const lista = (teksty as string[]).map((t) => t.trim());
  if (lista.length < min || lista.length > LIMITY.maxOdpowiedzi) {
    return `Pytanie musi mieć od ${min} do ${LIMITY.maxOdpowiedzi} ${nazwa}.`;
  }
  if (lista.some((t) => !t)) return "Uzupełnij wszystkie pola albo usuń puste.";
  if (lista.some((t) => t.length > LIMITY.odpowiedz)) return `Pole może mieć najwyżej ${LIMITY.odpowiedz} znaków.`;
  if (new Set(lista.map((t) => t.toLocaleLowerCase("pl"))).size !== lista.length) return "Wiersze nie mogą się powtarzać.";
  return null;
}

const przytnij = (t: unknown) => String(t).trim();

function odczytajZadanie(dane: FormData): { blad: string } | ({ tresc: string } & ZadanieDane) {
  const tresc = tekst(dane, "tresc");
  if (!tresc) return { blad: "Wpisz treść pytania." };
  if (tresc.length > LIMITY.tresc) return { blad: `Pytanie może mieć najwyżej ${LIMITY.tresc} znaków.` };

  const typ = dane.get("typ");
  if (!czyTypZadania(typ)) return { blad: "Wybierz rodzaj pytania." };
  let surowe: Record<string, unknown>;
  try {
    surowe = JSON.parse(String(dane.get("dane") ?? "{}"));
  } catch {
    return { blad: "Nieprawidłowe dane pytania." };
  }

  // czas na odpowiedź ustawia się przy uruchamianiu gry, nie w pytaniu
  if (typ === "wybor" || typ === "wielokrotny") {
    const blad = bladListy(surowe.odpowiedzi, LIMITY.minOdpowiedzi, "odpowiedzi");
    if (blad) return { blad };
    const odpowiedzi = (surowe.odpowiedzi as string[]).map(przytnij);
    const wRamach = (i: unknown) => Number.isInteger(i) && (i as number) >= 0 && (i as number) < odpowiedzi.length;
    if (typ === "wybor") {
      if (!wRamach(surowe.poprawna)) return { blad: "Zaznacz poprawną odpowiedź." };
      return { tresc, typ, dane: { odpowiedzi, poprawna: surowe.poprawna as number } };
    }
    const poprawna = [...new Set(Array.isArray(surowe.poprawna) ? surowe.poprawna : [])];
    if (poprawna.length === 0 || !poprawna.every(wRamach)) return { blad: "Zaznacz co najmniej jedną poprawną odpowiedź." };
    return { tresc, typ, dane: { odpowiedzi, poprawna: (poprawna as number[]).sort((a, b) => a - b) } };
  }

  if (typ === "kolejnosc") {
    const blad = bladListy(surowe.elementy, 3, "elementów");
    if (blad) return { blad };
    // edytor podaje elementy we właściwej kolejności; graczom pokazujemy je pomieszane
    const wlasciwa = (surowe.elementy as string[]).map(przytnij);
    const pokaz = mieszanie(wlasciwa.length);
    const elementy = pokaz.map((i) => wlasciwa[i]);
    const poprawna = wlasciwa.map((_, k) => pokaz.indexOf(k));
    return { tresc, typ, dane: { elementy, poprawna } };
  }

  // pary: [[lewy, prawy], …]; prawą stronę mieszamy
  const pary = Array.isArray(surowe.pary) ? (surowe.pary as unknown[]) : [];
  if (!pary.every((p) => Array.isArray(p) && p.length === 2)) return { blad: "Nieprawidłowe dane pytania." };
  const lewe = pary.map((p) => przytnij((p as unknown[])[0]));
  const praweWlasciwe = pary.map((p) => przytnij((p as unknown[])[1]));
  const blad = bladListy(lewe, 2, "par") ?? bladListy(praweWlasciwe, 2, "par");
  if (blad) return { blad };
  const pokaz = mieszanie(praweWlasciwe.length);
  const prawe = pokaz.map((i) => praweWlasciwe[i]);
  const poprawna = praweWlasciwe.map((_, k) => pokaz.indexOf(k));
  return { tresc, typ, dane: { lewe, prawe, poprawna } };
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

  const zmiany: Record<string, unknown> = { ...odczyt };
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
