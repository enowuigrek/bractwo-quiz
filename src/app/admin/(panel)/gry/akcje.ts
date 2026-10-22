"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";
import { LIMITY } from "../quizy/limity";

const MAX_OKAZJA = 80;

export async function uruchomGre(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajAdmina();
  const db = supabaseAdmin();

  const lokal_id = String(dane.get("lokal_id") ?? "");
  const quiz_id = String(dane.get("quiz_id") ?? "");
  const okazja = String(dane.get("okazja") ?? "").trim().replace(/\s+/g, " ");
  const tryb = dane.get("tryb") === "druzyny" ? "druzyny" : "solo";
  // czas na odpowiedź dla wszystkich pytań; bez limitu nie ma od czego liczyć bonusu
  const czasPole = String(dane.get("czas_s") ?? "");
  const czas_s = czasPole === "bez" ? null : Number(czasPole);
  const bonus_czas = czas_s !== null && dane.get("bonus_czas") === "on";
  const max_graczy = Number(dane.get("max_graczy") || 30);

  if (!lokal_id) return { blad: "Wybierz lokal." };
  if (!quiz_id) return { blad: "Wybierz quiz." };
  if (czas_s !== null && (!Number.isInteger(czas_s) || czas_s < LIMITY.minCzas || czas_s > LIMITY.maxCzas)) {
    return { blad: "Wybierz czas na odpowiedź." };
  }
  if (okazja.length > MAX_OKAZJA) return { blad: `Okazja może mieć najwyżej ${MAX_OKAZJA} znaków.` };
  if (!Number.isInteger(max_graczy) || max_graczy < 1 || max_graczy > 500) {
    return { blad: "Limit graczy musi być liczbą od 1 do 500." };
  }

  const [{ data: lokal }, { count: pytania }] = await Promise.all([
    db.from("lokale").select("id").eq("id", lokal_id).maybeSingle(),
    db.from("zadania").select("id", { count: "exact", head: true }).eq("quiz_id", quiz_id),
  ]);
  if (!lokal) return { blad: "Nie ma takiego lokalu." };
  if (!pytania) return { blad: "Ten quiz nie ma jeszcze pytań." };

  const grafika = plikZFormularza(dane, "grafika");
  if (grafika) {
    const blad = bladGrafiki(grafika);
    if (blad) return { blad };
  }
  let grafika_url: string | null = null;
  try {
    if (grafika) grafika_url = await wyslijGrafike(grafika, "sesje");
  } catch (e) {
    return { blad: (e as Error).message };
  }

  const { data, error } = await db
    .from("sesje")
    .insert({ lokal_id, quiz_id, okazja: okazja || null, tryb, czas_s, bonus_czas, max_graczy, grafika_url })
    .select("id")
    .single();
  if (error) {
    await usunGrafike(grafika_url);
    return { blad: `Nie udało się uruchomić gry: ${error.message}` };
  }
  redirect(`/admin/gry/${data.id}`);
}

export async function zakonczGre(id: string): Promise<void> {
  await wymagajAdmina();
  const { error } = await supabaseAdmin()
    .from("sesje")
    .update({ faza: "koniec", faza_od: new Date().toISOString(), faza_do: null })
    .eq("id", id)
    .neq("faza", "koniec");
  if (error) throw new Error(`Nie udało się zakończyć gry: ${error.message}`);
  refresh();
}

/**
 * Usuwa grę (trwającą albo zakończoną) razem z graczami i odpowiedziami.
 * `przekieruj`: ze strony gry wracamy do listy, z listy tylko ją odświeżamy.
 */
export async function usunGre(id: string, przekieruj: boolean): Promise<void> {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("sesje")
    .delete()
    .eq("id", id)
    .select("grafika_url")
    .maybeSingle();
  if (error) throw new Error(`Nie udało się usunąć gry: ${error.message}`);
  await usunGrafike(data?.grafika_url);
  if (przekieruj) redirect("/admin/gry");
  refresh();
}
