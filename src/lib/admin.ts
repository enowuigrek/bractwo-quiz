import "server-only";
import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const CIASTECZKO = "bq_admin";
// 30 dni: prowadzący loguje się w domu i w lokalu nie musi wpisywać hasła na telefonie.
// Zmiana ADMIN_SEKRET na Vercelu wylogowuje wszystkich (np. po zgubieniu telefonu).
const WAZNOSC_S = 30 * 24 * 60 * 60;

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

export function sprawdzHaslo(haslo: string): boolean {
  const wzor = process.env.ADMIN_HASLO;
  if (!wzor) {
    throw new Error("Brak ADMIN_HASLO w zmiennych środowiskowych");
  }
  return rowne(haslo, wzor);
}

/** Wartość ciasteczka: `wygasa.podpis`. */
export function wazneCiasteczko(wartosc: string | undefined): boolean {
  if (!wartosc) return false;
  const [wygasa, sig] = wartosc.split(".");
  if (!wygasa || !sig || !rowne(sig, podpis(wygasa))) return false;
  return Number(wygasa) > Date.now() / 1000;
}

export async function zaloguj(): Promise<void> {
  const wygasa = String(Math.floor(Date.now() / 1000) + WAZNOSC_S);
  (await cookies()).set(CIASTECZKO, `${wygasa}.${podpis(wygasa)}`, {
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

export async function czyAdmin(): Promise<boolean> {
  return wazneCiasteczko((await cookies()).get(CIASTECZKO)?.value);
}

/** Wołać na początku każdej strony i Server Action panelu. */
export async function wymagajAdmina(): Promise<void> {
  if (!(await czyAdmin())) {
    redirect("/admin/logowanie");
  }
}

export const CIASTECZKO_ADMINA = CIASTECZKO;
