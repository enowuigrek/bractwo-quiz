"use server";

import { redirect } from "next/navigation";
import { lokalRoli, rolaAdmina, sprawdzHaslo, sprawdzHasloLokalu, wyloguj, zaloguj } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

export type StanLogowania = { blad?: string };

/** Spowalnia zgadywanie haseł. */
const zleHaslo = async (): Promise<StanLogowania> => {
  await new Promise((r) => setTimeout(r, 800));
  return { blad: "Złe hasło." };
};

export async function zalogujAdmina(_: StanLogowania, dane: FormData): Promise<StanLogowania> {
  if (!sprawdzHaslo(String(dane.get("haslo") ?? ""))) return zleHaslo();
  await zaloguj({ typ: "glowny" });
  redirect("/admin");
}

/** Logowanie lokalu pod `/admin/<adres_ekranu>` jego własnym hasłem. */
export async function zalogujLokal(lokalId: string, _: StanLogowania, dane: FormData): Promise<StanLogowania> {
  if (!(await sprawdzHasloLokalu(lokalId, String(dane.get("haslo") ?? "")))) return zleHaslo();
  await zaloguj({ typ: "lokal", lokalId });
  redirect("/admin");
}

/** Lokal wraca na swoją stronę logowania (z logo), główny na zwykłą. */
export async function wylogujAdmina(): Promise<void> {
  const rola = await rolaAdmina();
  const lokal = rola && lokalRoli(rola);
  const { data } = lokal
    ? await supabaseAdmin()
        .from("lokale")
        .select("adres_ekranu")
        .eq("id", lokal)
        .maybeSingle<{ adres_ekranu: string }>()
    : { data: null };
  await wyloguj();
  redirect(data ? `/admin/${data.adres_ekranu}` : "/admin/logowanie");
}
