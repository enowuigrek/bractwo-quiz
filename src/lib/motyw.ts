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

/** Nazwy etapów z szablonu Bractwa (src/lib/etapy.ts) w motywie neutralnym: bez nawiązań do piwa. */
const NAZWY_ETAPOW_NEUTRALNE: Record<string, string> = {
  "Na jedno": "Jedno",
  "Jednak więcej": "Więcej",
  "Ile?": "Ile?",
  "Jakoś się ułoży": "Poukładaj",
  "Jeszcze zdążę": "Ostatnia prosta",
};

const nazwaEtapu = (nazwa: string) => NAZWY_ETAPOW_NEUTRALNE[nazwa] ?? nazwa;

/** Opis etapu bez piwa: „jak to jedno piwo” znika, „wyścig do piwa” to wyścig do mety. */
const opisEtapu = (opis: string | null) =>
  opis &&
  opis
    .replace(/,? jak to jedno piwo/g, "")
    .replace(/wyścig do piwa/g, "wyścig do mety")
    .replace(/do piwa/g, "do mety");

type ZEtapami = {
  etap?: { nazwa: string; opis: string | null } | null;
  nastepny_etap?: { nazwa: string; opis: string | null } | null;
  plan_etapow?: { nazwa: string }[] | null;
  etapy?: { nazwa: string }[] | null;
};

/**
 * Stan gry z etapami nazwanymi bez piwa, gdy strona ma motyw neutralny (`data-motyw` na `<html>`). Nazwy siedzą
 * w etapach quizu w bazie, więc ten sam quiz gra się pod oboma adresami; tu zmieniamy tylko to, co widać.
 */
export function etapyWMotywie<S extends ZEtapami>(stan: S): S {
  if (typeof document === "undefined" || document.documentElement.dataset.motyw !== "neutralny") return stan;
  const etap = <E extends { nazwa: string; opis: string | null }>(e: E | null | undefined) =>
    e ? { ...e, nazwa: nazwaEtapu(e.nazwa), opis: opisEtapu(e.opis) } : e;
  return {
    ...stan,
    etap: etap(stan.etap),
    nastepny_etap: etap(stan.nastepny_etap),
    plan_etapow: stan.plan_etapow?.map((e) => ({ ...e, nazwa: nazwaEtapu(e.nazwa) })),
    etapy: stan.etapy?.map((e) => ({ ...e, nazwa: nazwaEtapu(e.nazwa) })),
  } as S;
}
