"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import {
  lokalRoli,
  MIN_HASLO_LOKALU,
  ustawHasloLokalu,
  wymagajAdmina,
  wymagajGlownego,
  zaloguj,
} from "@/lib/admin";
import { wymagajLokalu } from "@/lib/admin-dostep";
import { SEGMENTY_PANELU } from "@/lib/adres-ekranu";
import { bladGrafiki, plikZFormularza, usunGrafike, wyslijGrafike } from "@/lib/grafiki";
import { adresZNazwy, FORMAT_ADRESU_EKRANU, MAX_ADRES_EKRANU } from "@/lib/adres-ekranu";
import { kontoInstagram } from "@/lib/instagram";
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
  const rola = await wymagajAdmina();
  // lokal zmienia tylko swoje logo i Instagram; nowe lokale, nazwę, miasto i adres ekranu ustawia główny
  const lokal = lokalRoli(rola);
  if (lokal) {
    if (id !== lokal) return { blad: "To nie jest Twój lokal." };
    return zapiszSwojLokal(id, dane);
  }
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

  const instagram = kontoInstagram(dane.get("instagram"));
  if (instagram === false) return { blad: "Instagram: sama nazwa konta, np. @piwiarnia." };

  const zmiany: Record<string, unknown> = { nazwa, miasto, instagram };

  if (id) {
    // adres ekranu poprawia się tylko ręcznie (zakładka na TV musi dalej działać)
    const adres = String(dane.get("adres_ekranu") ?? "").trim().toLowerCase();
    if (!FORMAT_ADRESU_EKRANU.test(adres) || adres.length > MAX_ADRES_EKRANU) {
      return { blad: "Adres ekranu: tylko małe litery bez polskich znaków, cyfry i pojedyncze myślniki." };
    }
    // ten sam adres ma logowanie lokalu pod /admin/<adres>
    if (SEGMENTY_PANELU.includes(adres)) return { blad: `Adres „${adres}” jest zajęty przez panel.` };
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

/** Lokal w swoim panelu: logo i Instagram. */
async function zapiszSwojLokal(id: string, dane: FormData): Promise<StanFormularza> {
  const db = supabaseAdmin();
  const logo = plikZFormularza(dane, "logo");
  const bladLogo = logo && bladGrafiki(logo);
  if (bladLogo) return { blad: bladLogo };
  const instagram = kontoInstagram(dane.get("instagram"));
  if (instagram === false) return { blad: "Instagram: sama nazwa konta, np. @piwiarnia." };
  const { data: stary } = await db.from("lokale").select("logo_url").eq("id", id).single();
  const zmiany: Record<string, unknown> = { instagram };
  try {
    if (logo) zmiany.logo_url = await wyslijGrafike(logo, "lokale");
    else if (dane.get("logo_usun")) zmiany.logo_url = null;
  } catch (e) {
    return { blad: (e as Error).message };
  }
  const { error } = await db.from("lokale").update(zmiany).eq("id", id);
  if (error) {
    if (typeof zmiany.logo_url === "string") await usunGrafike(zmiany.logo_url);
    return { blad: `Nie udało się zapisać: ${error.message}` };
  }
  if ("logo_url" in zmiany && stary?.logo_url) await usunGrafike(stary.logo_url);
  refresh();
  return { ok: "Zapisano." };
}

/**
 * Hasło panelu lokalu (logowanie pod /admin/<adres_ekranu>): główny ustawia je każdemu lokalowi (na start i po
 * zgubieniu), lokal zmienia swoje. Zmiana wylogowuje lokal na innych urządzeniach.
 */
export async function zmienHasloLokalu(id: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const rola = await wymagajAdmina();
  wymagajLokalu(rola, id);
  const haslo = String(dane.get("haslo") ?? "");
  if (haslo.length < MIN_HASLO_LOKALU) return { blad: `Hasło musi mieć co najmniej ${MIN_HASLO_LOKALU} znaków.` };
  if (haslo.length > 200) return { blad: "Hasło jest za długie." };
  if (haslo !== String(dane.get("haslo2") ?? "")) return { blad: "Hasła się różnią." };
  try {
    await ustawHasloLokalu(id, haslo);
    // lokal zmienił swoje hasło: nowe ciasteczko, żeby na tym urządzeniu został zalogowany
    if (lokalRoli(rola) === id) await zaloguj(rola);
  } catch (e) {
    return { blad: (e as Error).message };
  }
  refresh();
  return { ok: "Hasło zapisane." };
}

export async function usunLokal(id: string): Promise<void> {
  await wymagajGlownego();
  const db = supabaseAdmin();
  const { data } = await db.from("lokale").delete().eq("id", id).select("logo_url").maybeSingle();
  await usunGrafike(data?.logo_url);
  redirect("/admin/lokale");
}
