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

/**
 * Kto jest w panelu. `glowny` (osobne hasło `ADMIN_HASLO_GLOWNE`) widzi wszystko, także quizy i gry
 * „tylko dla głównego” i tryb „Pijany finał”. `obsluga` (wspólne `ADMIN_HASLO`) widzi resztę.
 * Uprawnienia sprawdzamy funkcjami niżej, a nie porównując role, żeby później dało się przejść na konta.
 */
export type Rola = "glowny" | "obsluga";
const ROLE: readonly Rola[] = ["glowny", "obsluga"];

/** Widzi i zmienia quizy oraz gry „tylko dla głównego”, ustawia ten znacznik. */
export const widziWszystko = (rola: Rola) => rola === "glowny";
/** Może włączyć „Pijany finał” i zmieniać jego pytania. */
export const mozePijanyFinal = (rola: Rola) => rola === "glowny";

export function sprawdzHaslo(haslo: string): Rola | null {
  const obsluga = process.env.ADMIN_HASLO;
  if (!obsluga) {
    throw new Error("Brak ADMIN_HASLO w zmiennych środowiskowych");
  }
  const glowne = process.env.ADMIN_HASLO_GLOWNE;
  // oba porównania zawsze, żeby czas odpowiedzi nie zdradzał, które hasło pasuje
  const toGlowne = !!glowne && rowne(haslo, glowne);
  const toObsluga = rowne(haslo, obsluga);
  return toGlowne ? "glowny" : toObsluga ? "obsluga" : null;
}

/**
 * Rola z ciasteczka albo null. Wartość: `rola.wygasa.podpis`. Starsze ciasteczka `wygasa.podpis`
 * (sprzed ról) są ważne dalej jako obsługa, więc nikogo nie wylogowało.
 */
export function rolaZCiasteczka(wartosc: string | undefined): Rola | null {
  if (!wartosc) return null;
  const czesci = wartosc.split(".");
  const [rola, wygasa, sig] = czesci.length === 2 ? ["obsluga", czesci[0], czesci[1]] : czesci;
  if (!ROLE.includes(rola as Rola) || !wygasa || !sig) return null;
  const podpisane = czesci.length === 2 ? wygasa : `${rola}.${wygasa}`;
  if (!rowne(sig, podpis(podpisane)) || Number(wygasa) <= Date.now() / 1000) return null;
  return rola as Rola;
}

export function wazneCiasteczko(wartosc: string | undefined): boolean {
  return rolaZCiasteczka(wartosc) !== null;
}

export async function zaloguj(rola: Rola): Promise<void> {
  const wygasa = String(Math.floor(Date.now() / 1000) + WAZNOSC_S);
  (await cookies()).set(CIASTECZKO, `${rola}.${wygasa}.${podpis(`${rola}.${wygasa}`)}`, {
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

/** Wołać na początku każdej strony i Server Action panelu. Zwraca rolę zalogowanego. */
export async function wymagajAdmina(): Promise<Rola> {
  const rola = rolaZCiasteczka((await cookies()).get(CIASTECZKO)?.value);
  if (!rola) redirect("/admin/logowanie");
  return rola;
}

/** Strony i akcje tylko dla głównego (np. pytania pijanego finału). Obsługa trafia na stronę główną panelu. */
export async function wymagajGlownego(): Promise<Rola> {
  const rola = await wymagajAdmina();
  if (!widziWszystko(rola)) redirect("/admin");
  return rola;
}

export const CIASTECZKO_ADMINA = CIASTECZKO;
