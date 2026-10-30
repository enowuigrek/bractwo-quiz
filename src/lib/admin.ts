import "server-only";
import { createHmac, createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { supabaseAdmin } from "./supabase/serwer";

const CIASTECZKO = "bq_admin";
// 30 dni: prowadzący loguje się w domu i w lokalu nie musi wpisywać hasła na telefonie.
// Zmiana ADMIN_SEKRET na Vercelu wylogowuje wszystkich (np. po zgubieniu telefonu).
const WAZNOSC_S = 30 * 24 * 60 * 60;
// link do ustawienia hasła (nowe konto, reset) ważny 7 dni
const WAZNOSC_LINKU_MS = 7 * 24 * 60 * 60 * 1000;
export const MIN_HASLO = 8;
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
 * Kto jest w panelu (od 30.10 konta osobowe). Konto to osoba (e-mail i hasło), a role nadaje twórca:
 * - `tworca` (Łukasz): wszystko, narzędzia techniczne (boty, pijany finał, nowe lokale, konta), lokal testowy;
 *   może też działać jako Bractwo albo dowolny lokal, żeby zobaczyć ich widok;
 * - `bractwo` (np. Zbyszko): wszystkie lokale, gry i quizy poza „tylko dla mnie” twórcy i lokalem testowym;
 * - `lokal`: tylko swój lokal (swoje gry i quizy, quizy Bractwa do grania).
 * Konto z kilkoma rolami przełącza się w menu („działam jako”), a aktywna rola siedzi w ciasteczku.
 * Uprawnienia sprawdzamy funkcjami niżej i w `admin-dostep.ts`, a nie porównując role.
 */
export type Konto = { id: string; nazwa: string; email: string; zdjecie_url: string | null };
export type Rola =
  | { typ: "tworca"; konto: Konto }
  | { typ: "bractwo"; konto: Konto; testowe: string[] }
  | { typ: "lokal"; konto: Konto; lokalId: string };

/** Rola nadana kontu (`konta_role`) albo wybrana w „działam jako”. */
export type RolaKonta = { rola: "tworca" } | { rola: "bractwo" } | { rola: "lokal"; lokalId: string };

/** Widzi wszystkie lokale, gry i quizy (twórca i Bractwo). */
export const widziWszystko = (rola: Rola) => rola.typ !== "lokal";
/** Narzędzia techniczne i rzeczy „tylko dla mnie”: boty, pijany finał, nowe lokale, konta, lokal testowy. */
export const jestTworca = (rola: Rola) => rola.typ === "tworca";
/** Zmienia pytania pijanego finału (włączyć go w swojej grze może każdy). */
export const mozePijanyFinal = jestTworca;
/** Lokal, w którego imieniu działa zalogowany, albo null (twórca, Bractwo). */
export const lokalRoli = (rola: Rola): string | null => (rola.typ === "lokal" ? rola.lokalId : null);
/** Lokale, których rola nie widzi (lokal testowy u Bractwa). */
export const ukryteLokale = (rola: Rola): string[] => (rola.typ === "bractwo" ? rola.testowe : []);

// --- hasła i linki -----------------------------------------------------------------------------------------

/** Skrót hasła: `scrypt$sól$skrót`. */
async function skrotHasla(haslo: string): Promise<string> {
  const sol = randomBytes(16);
  const skrot = await scryptAsync(haslo, sol, 32);
  return `scrypt$${sol.toString("base64url")}$${skrot.toString("base64url")}`;
}

async function zgodneHaslo(zapisany: string | null, haslo: string): Promise<boolean> {
  const [, sol, skrot] = zapisany?.split("$") ?? [];
  if (!sol || !skrot) return false;
  const podany = await scryptAsync(haslo, Buffer.from(sol, "base64url"), 32);
  const oczekiwany = Buffer.from(skrot, "base64url");
  return podany.length === oczekiwany.length && timingSafeEqual(podany, oczekiwany);
}

/** Krótki znacznik hasła w ciasteczku: zmiana hasła wylogowuje konto na innych urządzeniach. */
const wersjaHasla = (skrot: string | null) =>
  skrot ? createHash("sha256").update(skrot).digest("base64url").slice(0, 12) : "bez";

/** Błąd hasła do pokazania przy formularzu albo null. */
export function bladHasla(haslo: string, powtorzone: string): string | null {
  if (haslo.length < MIN_HASLO) return `Hasło musi mieć co najmniej ${MIN_HASLO} znaków.`;
  if (haslo.length > 200) return "Hasło jest za długie.";
  if (haslo !== powtorzone) return "Hasła się różnią.";
  return null;
}

export async function ustawHaslo(kontoId: string, haslo: string): Promise<void> {
  const { error } = await supabaseAdmin()
    .from("konta")
    .update({ skrot: await skrotHasla(haslo), link_skrot: null, link_do: null })
    .eq("id", kontoId);
  if (error) throw new Error(`Nie udało się zapisać hasła: ${error.message}`);
}

const skrotLinku = (token: string) => createHash("sha256").update(token).digest("base64url");

/** Nowy jednorazowy link do ustawienia hasła (nowe konto albo reset); poprzedni przestaje działać. */
export async function nowyLinkHasla(kontoId: string): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  const { error } = await supabaseAdmin()
    .from("konta")
    .update({ link_skrot: skrotLinku(token), link_do: new Date(Date.now() + WAZNOSC_LINKU_MS).toISOString() })
    .eq("id", kontoId);
  if (error) throw new Error(`Nie udało się utworzyć linku: ${error.message}`);
  return token;
}

/** Konto z ważnego linku do hasła albo null. */
export async function kontoZLinku(token: string): Promise<(Konto & { maHaslo: boolean }) | null> {
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) return null;
  const { data } = await supabaseAdmin()
    .from("konta")
    .select("id, nazwa, email, zdjecie_url, skrot, link_do, zablokowane")
    .eq("link_skrot", skrotLinku(token))
    .maybeSingle<Konto & { skrot: string | null; link_do: string | null; zablokowane: boolean }>();
  if (!data || data.zablokowane || !data.link_do || Date.parse(data.link_do) < Date.now()) return null;
  return { id: data.id, nazwa: data.nazwa, email: data.email, zdjecie_url: data.zdjecie_url, maHaslo: !!data.skrot };
}

/** E-mail z formularza: małe litery, bez spacji; null, gdy nie wygląda na adres. */
export function emailZPola(pole: FormDataEntryValue | null): string | null {
  const email = String(pole ?? "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200 ? email : null;
}

// --- konta i role --------------------------------------------------------------------------------------------

type KontoZBazy = Konto & {
  skrot: string | null;
  zablokowane: boolean;
  konta_role: { rola: "tworca" | "bractwo" | "lokal"; lokal_id: string | null }[];
};

async function pobierzKonto(kontoId: string): Promise<KontoZBazy | null> {
  const { data } = await supabaseAdmin()
    .from("konta")
    .select("id, nazwa, email, zdjecie_url, skrot, zablokowane, konta_role(rola, lokal_id)")
    .eq("id", kontoId)
    .maybeSingle<KontoZBazy>();
  return data;
}

/** Konto raz na żądanie (layout i strona pytają o rolę); logowanie i zmiana hasła czytają świeże. */
const kontoZBazy = cache(pobierzKonto);

/** Role nadane kontu, w kolejności: twórca, Bractwo, lokale. */
function nadaneRole(konto: KontoZBazy): RolaKonta[] {
  const role = konto.konta_role;
  return [
    ...(role.some((r) => r.rola === "tworca") ? [{ rola: "tworca" as const }] : []),
    ...(role.some((r) => r.rola === "bractwo") ? [{ rola: "bractwo" as const }] : []),
    ...role.filter((r) => r.rola === "lokal" && r.lokal_id).map((r) => ({ rola: "lokal" as const, lokalId: r.lokal_id! })),
  ];
}

/** Czy konto może działać w tej roli: nadana, a twórca może każdą (podgląd widoku Bractwa i lokali). */
function mozeDzialacJako(konto: KontoZBazy, rola: RolaKonta): boolean {
  const role = nadaneRole(konto);
  if (role.some((r) => r.rola === "tworca")) return true;
  return role.some((r) => kodRoli(r) === kodRoli(rola));
}

/** `t`, `b` albo `l<id lokalu>`: rola w ciasteczku. */
const kodRoli = (r: RolaKonta) => (r.rola === "tworca" ? "t" : r.rola === "bractwo" ? "b" : `l${r.lokalId}`);

function rolaZKodu(kod: string): RolaKonta | null {
  if (kod === "t") return { rola: "tworca" };
  if (kod === "b") return { rola: "bractwo" };
  const lokal = /^l([0-9a-f-]{36})$/.exec(kod);
  return lokal ? { rola: "lokal", lokalId: lokal[1] } : null;
}

/**
 * Role do wyboru w „działam jako”: nadane, a u twórcy wszystkie (Bractwo i każdy lokal). Z nazwą i logo do menu.
 */
export async function roleDoWyboru(rola: Rola): Promise<{ kod: string; nazwa: string; logo_url: string | null }[]> {
  const konto = await kontoZBazy(rola.konto.id);
  if (!konto) return [];
  const tworca = nadaneRole(konto).some((r) => r.rola === "tworca");
  const { data: lokale } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, logo_url")
    .order("nazwa")
    .returns<{ id: string; nazwa: string; logo_url: string | null }[]>();
  const role: RolaKonta[] = tworca
    ? [{ rola: "tworca" }, { rola: "bractwo" }, ...(lokale ?? []).map((l) => ({ rola: "lokal" as const, lokalId: l.id }))]
    : nadaneRole(konto);
  return role.map((r) => {
    const lokal = r.rola === "lokal" ? lokale?.find((l) => l.id === r.lokalId) : null;
    return {
      kod: kodRoli(r),
      nazwa: r.rola === "tworca" ? "Twórca" : r.rola === "bractwo" ? "Bractwo Piwne" : (lokal?.nazwa ?? "Lokal"),
      logo_url: lokal?.logo_url ?? null,
    };
  });
}

// --- logowanie ---------------------------------------------------------------------------------------------

export type WynikLogowania = { konto: Konto; role: RolaKonta[] } | null;

/**
 * Konto po e-mailu i haśle. Twórca może też wejść hasłem głównym z `.env` (`ADMIN_HASLO_GLOWNE`): na start, zanim
 * ustawi własne hasło, i awaryjnie. Zablokowane konto się nie loguje.
 */
export async function sprawdzLogowanie(email: string, haslo: string): Promise<WynikLogowania> {
  const { data } = await supabaseAdmin()
    .from("konta")
    .select("id")
    .eq("email", email)
    .maybeSingle<{ id: string }>();
  const konto = data ? await pobierzKonto(data.id) : null;
  if (!konto || konto.zablokowane) return null;
  const role = nadaneRole(konto);
  const glowne = process.env.ADMIN_HASLO_GLOWNE;
  const awaryjne = !!glowne && role.some((r) => r.rola === "tworca") && rowne(haslo, glowne);
  if (!awaryjne && !(await zgodneHaslo(konto.skrot, haslo))) return null;
  return { konto: { id: konto.id, nazwa: konto.nazwa, email: konto.email, zdjecie_url: konto.zdjecie_url }, role };
}

/** Role konta (puste, gdy zablokowane albo czeka na nadanie ról). */
export async function roleKonta(kontoId: string): Promise<RolaKonta[]> {
  const konto = await pobierzKonto(kontoId);
  return konto && !konto.zablokowane ? nadaneRole(konto) : [];
}

/** Kod aktywnej roli (jak w `roleDoWyboru`), do zaznaczenia w „działam jako”. */
export const kodAktywnejRoli = (rola: Rola) =>
  rola.typ === "tworca" ? "t" : rola.typ === "bractwo" ? "b" : `l${rola.lokalId}`;

/** Rola na start po zalogowaniu: twórca, potem Bractwo, potem pierwszy lokal. */
export const domyslnaRola = (role: RolaKonta[]): RolaKonta | null => role[0] ?? null;

/** Wartość ciasteczka: `konto~rola~wersja hasła.wygasa.podpis`. */
function wartoscCiasteczka(kontoId: string, rola: RolaKonta, skrot: string | null) {
  const kto = `${kontoId}~${kodRoli(rola)}~${wersjaHasla(skrot)}`;
  const wygasa = String(Math.floor(Date.now() / 1000) + WAZNOSC_S);
  return `${kto}.${wygasa}.${podpis(`${kto}.${wygasa}`)}`;
}

function zPodpisu(wartosc: string | undefined): { kontoId: string; kod: string; wersja: string } | null {
  if (!wartosc) return null;
  const [kto, wygasa, sig] = wartosc.split(".");
  if (!kto || !wygasa || !sig) return null;
  if (!rowne(sig, podpis(`${kto}.${wygasa}`)) || Number(wygasa) <= Date.now() / 1000) return null;
  const [kontoId, kod, wersja] = kto.split("~");
  if (!kontoId || !kod || !wersja || !/^[0-9a-f-]{36}$/.test(kontoId)) return null;
  return { kontoId, kod, wersja };
}

/** Szybkie sprawdzenie w `proxy.ts` (bez bazy). Właściwa kontrola: `wymagajAdmina()`. */
export function wazneCiasteczko(wartosc: string | undefined): boolean {
  return zPodpisu(wartosc) !== null;
}

/** Loguje konto w podanej roli (albo przełącza rolę zalogowanego, „działam jako”). */
export async function zaloguj(kontoId: string, rola: RolaKonta): Promise<void> {
  // świeże konto: po zmianie hasła w tym samym żądaniu ciasteczko musi dostać nową wersję hasła
  const konto = await pobierzKonto(kontoId);
  if (!konto || !mozeDzialacJako(konto, rola)) throw new Error("Brak dostępu do tej roli.");
  (await cookies()).set(CIASTECZKO, wartoscCiasteczka(kontoId, rola, konto.skrot), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: WAZNOSC_S,
  });
  await supabaseAdmin().from("konta").update({ ostatnie_logowanie: new Date().toISOString() }).eq("id", kontoId);
}

/** Przełącza zalogowanego na inną rolę (kod z `roleDoWyboru`). */
export async function dzialajJako(kod: string): Promise<void> {
  const rola = await wymagajAdmina();
  const nowa = rolaZKodu(kod);
  if (!nowa) throw new Error("Nie ma takiej roli.");
  await zaloguj(rola.konto.id, nowa);
}

export async function wyloguj(): Promise<void> {
  (await cookies()).delete(CIASTECZKO);
}

/**
 * Zalogowana rola albo null. Konto istnieje, nie jest zablokowane, hasło nie zmieniło się od logowania, a rola
 * z ciasteczka dalej mu przysługuje (odebranie roli działa od razu). Raz na żądanie (`cache`).
 */
export const rolaAdmina = cache(async (): Promise<Rola | null> => {
  const c = zPodpisu((await cookies()).get(CIASTECZKO)?.value);
  if (!c) return null;
  const konto = await kontoZBazy(c.kontoId);
  const rola = rolaZKodu(c.kod);
  if (!konto || konto.zablokowane || !rola || wersjaHasla(konto.skrot) !== c.wersja) return null;
  if (!mozeDzialacJako(konto, rola)) return null;
  const k: Konto = { id: konto.id, nazwa: konto.nazwa, email: konto.email, zdjecie_url: konto.zdjecie_url };
  if (rola.rola === "tworca") return { typ: "tworca", konto: k };
  if (rola.rola === "lokal") return { typ: "lokal", konto: k, lokalId: rola.lokalId };
  const { data } = await supabaseAdmin().from("lokale").select("id").eq("testowy", true).returns<{ id: string }[]>();
  return { typ: "bractwo", konto: k, testowe: (data ?? []).map((l) => l.id) };
});

export async function czyAdmin(): Promise<boolean> {
  return (await rolaAdmina()) !== null;
}

/** Wołać na początku każdej strony i Server Action panelu. Zwraca rolę zalogowanego. */
export async function wymagajAdmina(): Promise<Rola> {
  const rola = await rolaAdmina();
  if (!rola) redirect("/admin/logowanie");
  return rola;
}

/** Strony i akcje tylko dla twórcy (pytania pijanego finału, nowe lokale, konta). Inni trafiają na start panelu. */
export async function wymagajTworcy(): Promise<Rola> {
  const rola = await wymagajAdmina();
  if (!jestTworca(rola)) redirect("/admin");
  return rola;
}

export const CIASTECZKO_ADMINA = CIASTECZKO;
