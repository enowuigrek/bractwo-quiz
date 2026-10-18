"use server";

import { redirect } from "next/navigation";
import { sprawdzHaslo, wyloguj, zaloguj } from "@/lib/admin";

export type StanLogowania = { blad?: string };

export async function zalogujAdmina(_: StanLogowania, dane: FormData): Promise<StanLogowania> {
  const haslo = String(dane.get("haslo") ?? "");
  if (!sprawdzHaslo(haslo)) {
    // spowalnia zgadywanie
    await new Promise((r) => setTimeout(r, 800));
    return { blad: "Złe hasło." };
  }
  await zaloguj();
  redirect("/admin");
}

export async function wylogujAdmina(): Promise<void> {
  await wyloguj();
  redirect("/admin/logowanie");
}
