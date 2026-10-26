import "server-only";
import { createHmac, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "./supabase/serwer";

const CIASTECZKO = "bq_admin";
// 30 dni: prowadzący loguje się w domu i w lokalu nie musi wpisywać hasła na telefonie.
// Zmiana ADMIN_SEKRET na Vercelu wylogowuje wszystkich (np. po zgubieniu telefonu).
const WAZNOSC_S = 30 * 24 * 60 * 60;
const scryptAsync = promisify(scrypt) as (haslo: string, sol: Buffer, dlugosc: number) => Promise<Buffer>;

function sekret(): string {
  const s = process.env.ADMIN_SEKRET;
  if (!s || s.length < 32) {
    throw new Error("Brak ADMIN_SEKRET (min. 32 znaki) w zmiennych środowiskowych");
  }
  return s;
}

function podpis(wartosc: string): string {
  return createHmac("sha256", sekret()).update(wartosc).digest("base64url");
}

function rowne(a: string, b: string): boolean {
  // porównujemy skróty, żeby długość nie zdradzała niczego i timingSafeEqual dostał równe bufory
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/**
 * Kto jest w panelu (od 26.10). `glowny` (hasło `ADMIN_HASLO_GLOWNE`, Łukasz) widzi wszystko. `lokal` loguje się
 * hasłem swojego lokalu pod `/admin/<adres_ekranu>` i widzi tylko swoje gry, swoje quizy i quizy Bractwa
 * bez `tylko_glowny` (te tylko do grania). Wspólne hasło obsługi (`ADMIN_HASLO`) już nie działa.
 * Uprawnienia sprawdzamy funkcjami niżej i w `admin-dostep.ts`, a nie porównując role.
 */
export type Rola = { typ: "glowny" } | { typ: "lokal"; lokalId: string };

/** Widzi wszystkie quizy, gry i lokale, ustawia „tylko dla mnie”. */
export const widziWszystko = (rola: Rola) => rola.typ === "glowny";
/** Zmienia pytania pijanego finału (włączyć go w swojej grze może też lokal). */
export const mozePijanyFinal = (rola: Rola) => rola.typ === "glowny";
/** Lokal zalogowanego albo null (główny). */
export const lokalRoli = (rola: Rola): string | null => (rola.typ === "lokal" ? rola.lokalId : null);

export function sprawdzHaslo(haslo: string): boolean {
  const glowne = process.env.ADMIN_HASLO_GLOWNE;
  if (!glowne) throw new Error("Brak ADMIN_HASLO_GLOWNE w zmiennych środowiskowych");
  return rowne(haslo, glowne);
}

// --- hasła lokali (tabela `lokale_hasla`, tylko klucz serwisowy) ---------------------------------------------

/** Skrót hasła lokalu: `scrypt$sól$skrót`. */
async function skrotHasla(haslo: string): Promise<string> {
  const sol = randomBytes(16);
  const skrot = await scryptAsync(haslo, sol, 32);
  return `scrypt$${sol.toString("base64url")}$${skrot.toString("base64url")}`;
}

async function zapisanySkrot(lokalId: string): Promise<string | null> {
  const { data } = await supabaseAdmin()
    .from("lokale_hasla")
    .select("skrot")
    .eq("lokal_id", lokalId)
    .maybeSingle<{ skrot: string }>();
  return data?.skrot ?? null;
}

/** Krótki znacznik hasła w ciasteczku: zmiana hasła wylogowuje lokal na innych urządzeniach. */
const wersjaHasla = (skrot: string) => createHash("sha256").update(skrot).digest("base64url").slice(0, 12);

export async function sprawdzHasloLokalu(lokalId: string, haslo: string): Promise<boolean> {
  const zapisany = await zapisanySkrot(lokalId);
  const [, sol, skrot] = zapisany?.split("$") ?? [];
  if (!sol || !skrot) return false;
  const podany = await scryptAsync(haslo, Buffer.from(sol, "base64url"), 32);
  const oczekiwany = Buffer.from(skrot, "base64url");
  return podany.length === oczekiwany.length && timingSafeEqual(podany, oczekiwany);
}

export const MIN_HASLO_LOKALU = 8;

export async function ustawHasloLokalu(lokalId: string, haslo: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("lokale_hasla")
    .upsert({ lokal_id: lokalId, skrot: await skrotHasla(haslo), zmieniono: new Date().toISOString() });
  if (error) throw new Error(`Nie udało się zapisać hasła: ${error.message}`);
}

export async function maHasloLokalu(lokalId: string): Promise<boolean> {
  return (await zapisanySkrot(lokalId)) !== null;
}

// --- ciasteczko --------------------------------------------------------------------------------------------

/** Rola w ciasteczku: `glowny` albo `lokal_<id>_<wersja hasła>`. */
type RolaWCiasteczku = { typ: "glowny" } | { typ: "lokal"; lokalId: string; wersja: string };

/**
 * Rola z ciasteczka (sam podpis i ważność, bez bazy) albo null. Wartość: `rola.wygasa.podpis`. Ciasteczka
 * sprzed 26.10 (obsługa) są już nieważne.
 */
function rolaZPodpisu(wartosc: string | undefined): RolaWCiasteczku | null {
  if (!wartosc) return null;
  const [kto, wygasa, sig] = wartosc.split(".");
  if (!kto || !wygasa || !sig) return null;
  if (!rowne(sig, podpis(`${kto}.${wygasa}`)) || Number(wygasa) <= Date.now() / 1000) return null;
  if (kto === "glowny") return { typ: "glowny" };
  // wersja hasła to base64url, więc może mieć w sobie „_”
  const lokal = /^lokal_([0-9a-f-]{36})_(.+)$/.exec(kto);
  return lokal ? { typ: "lokal", lokalId: lokal[1], wersja: lokal[2] } : null;
}

/** Szybkie sprawdzenie w `proxy.ts` (bez bazy). Właściwa kontrola: `wymagajAdmina()`. */
export function wazneCiasteczko(wartosc: string | undefined): boolean {
  return rolaZPodpisu(wartosc) !== null;
}

export async function zaloguj(rola: Rola): Promise<void> {
  let kto = "glowny";
  if (rola.typ === "lokal") {
    const skrot = await zapisanySkrot(rola.lokalId);
    if (!skrot) throw new Error("Lokal nie ma hasła");
    kto = `lokal_${rola.lokalId}_${wersjaHasla(skrot)}`;
  }
  const wygasa = String(Math.floor(Date.now() / 1000) + WAZNOSC_S);
  (await cookies()).set(CIASTECZKO, `${kto}.${wygasa}.${podpis(`${kto}.${wygasa}`)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WAZNOSC_S,
  });
}

export async function wyloguj(): Promise<void> {
  (await cookies()).delete(CIASTECZKO);
}

/** Zalogowana rola albo null. Lokal: hasło nie zmieniło się od logowania. */
export async function rolaAdmina(): Promise<Rola | null> {
  const r = rolaZPodpisu((await cookies()).get(CIASTECZKO)?.value);
  if (!r) return null;
  if (r.typ === "glowny") return r;
  const skrot = await zapisanySkrot(r.lokalId);
  return skrot && wersjaHasla(skrot) === r.wersja ? { typ: "lokal", lokalId: r.lokalId } : null;
}

export async function czyAdmin(): Promise<boolean> {
  return (await rolaAdmina()) !== null;
}

/** Wołać na początku każdej strony i Server Action panelu. Zwraca rolę zalogowanego. */
export async function wymagajAdmina(): Promise<Rola> {
  const rola = await rolaAdmina();
  if (!rola) redirect("/admin/logowanie");
  return rola;
}

/** Strony i akcje tylko dla głównego (np. pytania pijanego finału, nowe lokale). Lokal trafia na stronę główną. */
export async function wymagajGlownego(): Promise<Rola> {
  const rola = await wymagajAdmina();
  if (!widziWszystko(rola)) redirect("/admin");
  return rola;
}

export const CIASTECZKO_ADMINA = CIASTECZKO;
