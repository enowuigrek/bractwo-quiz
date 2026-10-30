"use server";

import { redirect } from "next/navigation";
import {
  bladHasla,
  domyslnaRola,
  dzialajJako,
  emailZPola,
  kontoZLinku,
  roleKonta,
  sprawdzLogowanie,
  ustawHaslo,
  wyloguj,
  zaloguj,
} from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { StanFormularza } from "@/lib/typy";

export type StanLogowania = { blad?: string; ok?: string };

/** Spowalnia zgadywanie haseł. */
const zwolnij = () => new Promise((r) => setTimeout(r, 800));

const CZEKA = "Konto czeka, aż Łukasz nada mu dostęp.";

/** Logowanie e-mailem i hasłem (konta osobowe, 30.10). Konto bez ról jeszcze nie wchodzi. */
export async function zalogujAdmina(_: StanLogowania, dane: FormData): Promise<StanLogowania> {
  const email = emailZPola(dane.get("email"));
  const wynik = email ? await sprawdzLogowanie(email, String(dane.get("haslo") ?? "")) : null;
  if (!wynik) {
    await zwolnij();
    return { blad: "Zły e-mail albo hasło." };
  }
  const rola = domyslnaRola(wynik.role);
  if (!rola) return { blad: CZEKA };
  await zaloguj(wynik.konto.id, rola);
  redirect("/admin");
}

/** Konto zakłada się samo, ale bez ról: dostęp nadaje Łukasz na stronie „Konta”. */
export async function zalozKonto(_: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const nazwa = String(dane.get("nazwa") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const email = emailZPola(dane.get("email"));
  if (!nazwa || nazwa.length > 60) return { blad: "Podaj imię (do 60 znaków)." };
  if (!email) return { blad: "Podaj adres e-mail." };
  const blad = bladHasla(String(dane.get("haslo") ?? ""), String(dane.get("haslo2") ?? ""));
  if (blad) return { blad };
  await zwolnij();
  const db = supabaseAdmin();
  const { data, error } = await db.from("konta").insert({ email, nazwa }).select("id").single<{ id: string }>();
  if (error) {
    return { blad: error.code === "23505" ? "Konto z tym e-mailem już jest. Zaloguj się." : `Nie udało się: ${error.message}` };
  }
  await ustawHaslo(data.id, String(dane.get("haslo")));
  return { ok: `Konto założone. ${CZEKA}` };
}

/** Hasło z jednorazowego linku (nowe konto od Łukasza albo reset). Konto z rolami od razu wchodzi do panelu. */
export async function ustawHasloZLinku(token: string, _: StanFormularza, dane: FormData): Promise<StanFormularza> {
  const konto = await kontoZLinku(token);
  if (!konto) return { blad: "Link wygasł albo był już użyty. Poproś o nowy." };
  const haslo = String(dane.get("haslo") ?? "");
  const blad = bladHasla(haslo, String(dane.get("haslo2") ?? ""));
  if (blad) return { blad };
  await ustawHaslo(konto.id, haslo);
  const rola = domyslnaRola(await roleKonta(konto.id));
  if (!rola) return { ok: `Hasło zapisane. ${CZEKA}` };
  await zaloguj(konto.id, rola);
  redirect("/admin");
}

/** „Działam jako”: przełącza zalogowanego na inną swoją rolę i wraca na start panelu. */
export async function przelaczRole(kod: string): Promise<void> {
  await dzialajJako(kod);
  redirect("/admin");
}

export async function wylogujAdmina(): Promise<void> {
  await wyloguj();
  redirect("/admin/logowanie");
}
