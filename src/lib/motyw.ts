/**
 * Motyw wyglądu (18.11): „bractwo” (domyślny) albo „neutralny” (quiz bez piwa i Bractwa, np. firmowy).
 * Motyw wynika z adresu strony, nie z bazy: neutralny włącza się na hostach z `HOSTY_NEUTRALNE` (lista po przecinku,
 * np. alias na Vercelu) i na każdym hoście zaczynającym się od `neutralny.` (lokalnie `neutralny.localhost:3100`).
 * Linki i kody QR budujemy z bieżącego adresu, więc telefony graczy same trafiają na ten sam motyw co TV.
 */
export type Motyw = "bractwo" | "neutralny";

/** Logo motywu neutralnego (stoi tam, gdzie w motywie Bractwa logo Bractwa). `null` = bez logo. */
export const LOGO_NEUTRALNE: string | null = "/loga/jowes/jowes.png";

/** Nazwy rodzajów quizu w motywie neutralnym (zamiast „Wyścig po piwo” i „Pub quiz”). */
export const NAZWY_NEUTRALNE = { wyscig: "Wyścig", klasyczny: "Quiz klasyczny" } as const;

/**
 * Słowa na lokal w panelu (18.11): w Bractwie lokal, w motywie neutralnym organizacja (firma, nie knajpa). Jedno
 * źródło dla zakładek, menu i tytułów stron.
 */
export const SLOWA_LOKALU = {
  bractwo: { lokal: "Lokal", lokale: "Lokale", moj: "Mój lokal", ustawienia: "Ustawienia lokalu" },
  neutralny: { lokal: "Organizacja", lokale: "Organizacje", moj: "Moja organizacja", ustawienia: "Ustawienia organizacji" },
} as const;
export const slowaLokalu = (neutralny: boolean) => SLOWA_LOKALU[neutralny ? "neutralny" : "bractwo"];

/** Nazwa aplikacji w tytule strony. */
export const NAZWA_APLIKACJI: Record<Motyw, string> = { bractwo: "Bractwo Quiz", neutralny: "Quiz" };

export function motywZHosta(host: string | null | undefined, hostyNeutralne = ""): Motyw {
  const h = (host ?? "").toLowerCase().split(":")[0];
  if (!h) return "bractwo";
  if (h.startsWith("neutralny.")) return "neutralny";
  const lista = hostyNeutralne
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(h) ? "neutralny" : "bractwo";
}

/** Pożegnanie na końcu tekstu: w Bractwie „Piwu Cześć!”, w neutralnym nic. */
export function zPozegnaniem(tekst: string, motyw: Motyw): string {
  return motyw === "bractwo" ? `${tekst} Piwu Cześć!` : tekst;
}

/** Etapy w motywie neutralnym są tylko ponumerowane (18.11, JOWES): „Etap 1”, „Etap 2”… zamiast nazw z szablonu Bractwa. */
const nazwaEtapu = (nr: number) => `Etap ${nr}`;

/** Opis etapu bez piwa: „jak to jedno piwo” znika, „wyścig do piwa” to wyścig do mety. */
const opisEtapu = (opis: string | null) =>
  opis &&
  opis
    .replace(/,? jak to jedno piwo/g, "")
    .replace(/wyścig do piwa/g, "wyścig do mety")
    .replace(/do piwa/g, "do mety");

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
