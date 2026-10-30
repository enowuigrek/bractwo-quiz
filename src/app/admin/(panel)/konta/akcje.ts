"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { emailZPola, nowyLinkHasla, wymagajTworcy } from "@/lib/admin";
import { adresAplikacji } from "@/lib/adres";
import { supabaseAdmin } from "@/lib/supabase/serwer";

/** Wynik zapisu konta: przy nowym koncie link do ustawienia hasła, który Łukasz wysyła sam. */
export type StanKonta = { blad?: string; ok?: string; link?: string; id?: string };

type Rola = { rola: "tworca" | "bractwo" | "lokal"; lokal_id: string | null };

/** Role z formularza: pola `rola` (tworca, bractwo) i `lokal` (id lokali). */
function roleZFormularza(dane: FormData): Rola[] {
  const role = dane.getAll("rola").map(String);
  return [
    ...(role.includes("tworca") ? [{ rola: "tworca" as const, lokal_id: null }] : []),
    ...(role.includes("bractwo") ? [{ rola: "bractwo" as const, lokal_id: null }] : []),
    ...[...new Set(dane.getAll("lokal").map(String))]
      .filter((id) => /^[0-9a-f-]{36}$/.test(id))
      .map((id) => ({ rola: "lokal" as const, lokal_id: id })),
  ];
}

const klucz = (r: Rola) => `${r.rola}:${r.lokal_id ?? ""}`;

async function linkHasla(kontoId: string): Promise<string> {
  return `${await adresAplikacji()}/admin/haslo/${await nowyLinkHasla(kontoId)}`;
}

/** Nowe konto (id = null) albo zmiana imienia, e-maila i ról istniejącego. Tylko twórca. */
export async function zapiszKonto(id: string | null, _: StanKonta, dane: FormData): Promise<StanKonta> {
  const tworca = await wymagajTworcy();
  const nazwa = String(dane.get("nazwa") ?? "")
    .trim()
    .replace(/\s+/g, " ");
  const email = emailZPola(dane.get("email"));
  if (!nazwa || nazwa.length > 60) return { blad: "Podaj imię (do 60 znaków)." };
  if (!email) return { blad: "Podaj adres e-mail." };
  const role = roleZFormularza(dane);
  // twórca nie odbiera sobie roli twórcy (nie miałby jak wrócić do panelu kont)
  if (id === tworca.konto.id && !role.some((r) => r.rola === "tworca")) {
    return { blad: "Nie odbieraj sobie roli twórcy." };
  }
  const db = supabaseAdmin();

  let kontoId = id;
  if (kontoId) {
    const { error } = await db.from("konta").update({ nazwa, email }).eq("id", kontoId);
    if (error) return { blad: error.code === "23505" ? "Ten e-mail ma już inne konto." : error.message };
  } else {
    const { data, error } = await db.from("konta").insert({ nazwa, email }).select("id").single<{ id: string }>();
    if (error) return { blad: error.code === "23505" ? "Ten e-mail ma już konto." : error.message };
    kontoId = data.id;
  }

  // role: dopisz brakujące, usuń odznaczone
  const { data: obecne } = await db
    .from("konta_role")
    .select("id, rola, lokal_id")
    .eq("konto_id", kontoId)
    .returns<(Rola & { id: string })[]>();
  const chciane = new Set(role.map(klucz));
  const zbedne = (obecne ?? []).filter((r) => !chciane.has(klucz(r))).map((r) => r.id);
  const nowe = role.filter((r) => !(obecne ?? []).some((o) => klucz(o) === klucz(r)));
  if (zbedne.length) {
    const { error } = await db.from("konta_role").delete().in("id", zbedne);
    if (error) return { blad: `Nie udało się zmienić ról: ${error.message}` };
  }
  if (nowe.length) {
    const { error } = await db.from("konta_role").insert(nowe.map((r) => ({ ...r, konto_id: kontoId })));
    if (error) return { blad: `Nie udało się zmienić ról: ${error.message}` };
  }

  refresh();
  if (id) return { ok: "Zapisano." };
  return { ok: "Konto założone.", link: await linkHasla(kontoId), id: kontoId };
}

/** Nowy link do ustawienia hasła (pierwsze hasło albo reset); poprzedni przestaje działać. */
export async function wygenerujLink(id: string): Promise<StanKonta> {
  await wymagajTworcy();
  try {
    return { link: await linkHasla(id) };
  } catch (e) {
    return { blad: (e as Error).message };
  }
}

/** Blokada: konto od razu traci dostęp (także na zalogowanych urządzeniach), dane i autorstwo zostają. */
export async function ustawBlokade(id: string, zablokowane: boolean): Promise<void> {
  const tworca = await wymagajTworcy();
  if (id === tworca.konto.id) throw new Error("Nie blokuj własnego konta.");
  const { error } = await supabaseAdmin().from("konta").update({ zablokowane }).eq("id", id);
  if (error) throw new Error(`Nie udało się: ${error.message}`);
  refresh();
}

/** Usuwa konto (role też); gry i quizy zostają, tylko bez autora. */
export async function usunKonto(id: string): Promise<void> {
  const tworca = await wymagajTworcy();
  if (id === tworca.konto.id) throw new Error("Nie usuwaj własnego konta.");
  const { error } = await supabaseAdmin().from("konta").delete().eq("id", id);
  if (error) throw new Error(`Nie udało się usunąć konta: ${error.message}`);
  redirect("/admin/konta");
}
