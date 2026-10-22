"use server";

import { redirect } from "next/navigation";
import { wymagajAdmina } from "@/lib/admin";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { adresZNazwy, FORMAT_ADRESU_EKRANU, MAX_ADRES_EKRANU } from "@/lib/adres-ekranu";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

function tekst(dane: FormData, pole: string): string {
  return String(dane.get(pole) ?? "").trim().replace(/\s+/g, " ");
}

/** Dodaje lokal (id = null) albo zapisuje zmiany istniejącego. */
export async function zapiszLokal(
  id: string | null,
  _: StanFormularza,
  dane: FormData,
): Promise<StanFormularza> {
  await wymagajAdmina();
  const db = supabaseAdmin();

  const nazwa = tekst(dane, "nazwa");
  const miasto = tekst(dane, "miasto");
  if (!nazwa) return { blad: "Podaj nazwę lokalu." };
  if (!miasto) return { blad: "Podaj miasto." };

  const logo = plikZFormularza(dane, "logo");
  if (logo) {
    const blad = bladGrafiki(logo);
    if (blad) return { blad };
  }

  let stareLogo: string | null = null;
  if (id) {
    const { data, error } = await db.from("lokale").select("logo_url").eq("id", id).single();
    if (error) return { blad: "Nie ma takiego lokalu." };
    stareLogo = data.logo_url;
  }

  const zmiany: Record<string, unknown> = { nazwa, miasto };

  if (id) {
    // adres ekranu poprawia się tylko ręcznie (zakładka na TV musi dalej działać)
    const adres = String(dane.get("adres_ekranu") ?? "").trim().toLowerCase();
    if (!FORMAT_ADRESU_EKRANU.test(adres) || adres.length > MAX_ADRES_EKRANU) {
      return { blad: "Adres ekranu: tylko małe litery bez polskich znaków, cyfry i pojedyncze myślniki." };
    }
    const { count } = await db.from("lokale").select("id", { count: "exact", head: true }).eq("adres_ekranu", adres).neq("id", id);
    if (count) return { blad: `Adres ekranu „${adres}” ma już inny lokal.` };
    zmiany.adres_ekranu = adres;
  } else {
    // nowy lokal: adres z nazwy, a przy powtórce z końcówką -2, -3…
    const baza = adresZNazwy(nazwa);
    const { data: zajete } = await db.from("lokale").select("adres_ekranu").like("adres_ekranu", `${baza}%`);
    const uzyte = new Set((zajete ?? []).map((l) => l.adres_ekranu as string));
    let adres = baza;
    for (let n = 2; uzyte.has(adres); n++) adres = `${baza}-${n}`;
    zmiany.adres_ekranu = adres;
  }
  try {
    if (logo) zmiany.logo_url = await wyslijGrafike(logo, "lokale");
    else if (dane.get("logo_usun")) zmiany.logo_url = null;
  } catch (e) {
    return { blad: (e as Error).message };
  }

  const { error } = id
    ? await db.from("lokale").update(zmiany).eq("id", id)
    : await db.from("lokale").insert(zmiany);
  if (error) {
    if (typeof zmiany.logo_url === "string") await usunGrafike(zmiany.logo_url);
    return { blad: `Nie udało się zapisać: ${error.message}` };
  }
  if ("logo_url" in zmiany && stareLogo) await usunGrafike(stareLogo);

  redirect("/admin/lokale");
}

export async function usunLokal(id: string): Promise<void> {
  await wymagajAdmina();
  const db = supabaseAdmin();
  const { data } = await db.from("lokale").delete().eq("id", id).select("logo_url").maybeSingle();
  await usunGrafike(data?.logo_url);
  redirect("/admin/lokale");
}
