"use server";

import { refresh } from "next/cache";
import { bladHasla, sprawdzLogowanie, ustawHaslo, wymagajAdmina, zaloguj } from "@/lib/admin";
import { kodRoliZRoli } from "./rola";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

/** Moje konto: imię i zdjęcie (zdjęcie w znaczku osoby na listach; bez niego inicjały, 30.10). */
export async function zapiszProfil(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  const nazwa = String(dane.get("nazwa") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (!nazwa || nazwa.length > 60) return { blad: "Podaj imię (do 60 znaków)." };
  const zmiany: { nazwa: string; zdjecie_url?: string | null } = { nazwa };
  const plik = plikZFormularza(dane, "zdjecie");
  if (plik) {
    const blad = bladGrafiki(plik);
    if (blad) return { blad };
    try {
      zmiany.zdjecie_url = await wyslijGrafike(plik, "konta");
    } catch (e) {
      return { blad: (e as Error).message };
    }
  } else if (dane.get("zdjecie_usun") === "on") {
    zmiany.zdjecie_url = null;
  }
  const { error } = await supabaseAdmin().from("konta").update(zmiany).eq("id", rola.konto.id);
  if (error) {
    if (zmiany.zdjecie_url) await usunGrafike(zmiany.zdjecie_url);
    return { blad: error.message };
  }
  // stare zdjęcie sprzątamy dopiero po zapisie
  if ("zdjecie_url" in zmiany) await usunGrafike(rola.konto.zdjecie_url);
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
