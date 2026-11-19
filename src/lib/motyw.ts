/**
 * Motyw wyglądu (18.11): „bractwo” (domyślny) albo „neutralny” (quiz bez piwa i Bractwa, np. firmowy).
 * Motyw wynika z adresu strony, nie z bazy: neutralny włącza się na hostach z `HOSTY_NEUTRALNE` (lista po przecinku,
 * np. alias na Vercelu) i na każdym hoście zaczynającym się od `neutralny.` (lokalnie `neutralny.localhost:3100`).
 * Linki i kody QR budujemy z bieżącego adresu, więc telefony graczy same trafiają na ten sam motyw co TV.
 */
import { MARKI, markaZHosta } from "./marka";

export type Motyw = "bractwo" | "neutralny";

// Stałe poniżej czytają już marki (src/lib/marka.ts, 19.11) i znikną, gdy wszystkie miejsca przejdą na markę.

/** Logo motywu neutralnego (stoi tam, gdzie w motywie Bractwa logo Bractwa). `null` = bez logo. */
export const LOGO_NEUTRALNE: string | null = MARKI.jowes.logo;

/** Nazwa aplikacji w tytule strony. */
export const NAZWA_APLIKACJI: Record<Motyw, string> = { bractwo: MARKI.bractwo.nazwa, neutralny: MARKI.jowes.nazwa };

export function motywZHosta(host: string | null | undefined, hostyNeutralne = ""): Motyw {
  return markaZHosta(host, hostyNeutralne) === "bractwo" ? "bractwo" : "neutralny";
}

/** Pożegnanie na końcu tekstu: w Bractwie „Piwu Cześć!”, w neutralnym nic. */
export function zPozegnaniem(tekst: string, motyw: Motyw): string {
  return motyw === "bractwo" ? `${tekst} Piwu Cześć!` : tekst;
}

/** Etapy w motywie neutralnym są tylko ponumerowane (18.11, JOWES): „Etap 1”, „Etap 2”… zamiast nazw z szablonu Bractwa. */
const nazwaEtapu = (nr: number) => `Etap ${nr}`;

/** Opis etapu bez piwa (`opisEtapu` marki JOWES). */
const opisEtapu = (opis: string | null) => opis && MARKI.jowes.teksty.opisEtapu(opis);

type ZEtapami = {
  etap?: { nr: number; nazwa: string; opis: string | null } | null;
  nastepny_etap?: { nr: number; nazwa: string; opis: string | null } | null;
  plan_etapow?: { nr: number; nazwa: string }[] | null;
  etapy?: { nr: number; nazwa: string }[] | null;
};

/**
 * Stan gry z etapami nazwanymi bez piwa, gdy strona ma motyw neutralny (`data-motyw` na `<html>`). Nazwy siedzą
 * w etapach quizu w bazie, więc ten sam quiz gra się pod oboma adresami; tu zmieniamy tylko to, co widać.
 */
export function etapyWMotywie<S extends ZEtapami>(stan: S): S {
  if (typeof document === "undefined" || document.documentElement.dataset.motyw !== "neutralny") return stan;
  const etap = <E extends { nr: number; nazwa: string; opis: string | null }>(e: E | null | undefined) =>
    e ? { ...e, nazwa: nazwaEtapu(e.nr), opis: opisEtapu(e.opis) } : e;
  return {
    ...stan,
    etap: etap(stan.etap),
    nastepny_etap: etap(stan.nastepny_etap),
    plan_etapow: stan.plan_etapow?.map((e) => ({ ...e, nazwa: nazwaEtapu(e.nr) })),
    etapy: stan.etapy?.map((e) => ({ ...e, nazwa: nazwaEtapu(e.nr) })),
  } as S;
}
