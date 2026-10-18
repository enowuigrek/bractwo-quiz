"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

const MAX_OKAZJA = 80;

export async function uruchomGre(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  await wymagajAdmina();
  const db = supabaseAdmin();

  const piwiarnia_id = String(dane.get("piwiarnia_id") ?? "");
  const quiz_id = String(dane.get("quiz_id") ?? "");
  const okazja = String(dane.get("okazja") ?? "").trim().replace(/\s+/g, " ");
  const tryb = dane.get("tryb") === "druzyny" ? "druzyny" : "solo";
  const bonus_czas = dane.get("bonus_czas") === "on";
  const max_graczy = Number(dane.get("max_graczy") || 30);

  if (!piwiarnia_id) return { blad: "Wybierz lokal." };
  if (!quiz_id) return { blad: "Wybierz quiz." };
  if (okazja.length > MAX_OKAZJA) return { blad: `Okazja może mieć najwyżej ${MAX_OKAZJA} znaków.` };
  if (!Number.isInteger(max_graczy) || max_graczy < 1 || max_graczy > 500) {
    return { blad: "Limit graczy musi być liczbą od 1 do 500." };
  }

  const [{ data: piwiarnia }, { count: pytania }] = await Promise.all([
    db.from("piwiarnie").select("id").eq("id", piwiarnia_id).maybeSingle(),
    db.from("zadania").select("id", { count: "exact", head: true }).eq("quiz_id", quiz_id),
  ]);
  if (!piwiarnia) return { blad: "Nie ma takiego lokalu." };
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
    .insert({ piwiarnia_id, quiz_id, okazja: okazja || null, tryb, bonus_czas, max_graczy, grafika_url })
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

/** Usuwa zakończoną grę razem z graczami i odpowiedziami. */
export async function usunGre(id: string): Promise<void> {
  await wymagajAdmina();
  const { data, error } = await supabaseAdmin()
    .from("sesje")
    .delete()
    .eq("id", id)
    .eq("faza", "koniec")
    .select("grafika_url")
    .maybeSingle();
  if (error) throw new Error(`Nie udało się usunąć gry: ${error.message}`);
  await usunGrafike(data?.grafika_url);
  redirect("/admin/gry");
}
