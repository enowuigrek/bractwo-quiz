"use server";

import { refresh } from "next/cache";
import { bladHasla, sprawdzLogowanie, ustawHaslo, wymagajAdmina, zaloguj } from "@/lib/admin";
import { kodRoliZRoli } from "./rola";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

/** Moje konto: imię. */
export async function zmienImie(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  const nazwa = String(dane.get("nazwa") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!nazwa || nazwa.length > 60) return { blad: "Podaj imię (do 60 znaków)." };
  const { error } = await supabaseAdmin().from("konta").update({ nazwa }).eq("id", rola.konto.id);
  if (error) return { blad: error.message };
  refresh();
  return { ok: "Zapisano." };
}

/** Moje konto: zmiana hasła po podaniu obecnego. Inne urządzenia trzeba zalogować od nowa, to zostaje. */
export async function zmienHaslo(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  if (!(await sprawdzLogowanie(rola.konto.email, String(dane.get("obecne") ?? "")))) {
    await new Promise((r) => setTimeout(r, 800));
    return { blad: "Obecne hasło się nie zgadza." };
  }
  const haslo = String(dane.get("haslo") ?? "");
  const blad = bladHasla(haslo, String(dane.get("haslo2") ?? ""));
  if (blad) return { blad };
  await ustawHaslo(rola.konto.id, haslo);
  await zaloguj(rola.konto.id, kodRoliZRoli(rola));
  return { ok: "Hasło zmienione." };
}
