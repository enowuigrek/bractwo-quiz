/**
 * Motyw wyglądu (18.11): „bractwo” (domyślny) albo „neutralny” (quiz bez piwa i Bractwa, np. firmowy).
 * Motyw wynika z adresu strony, nie z bazy: neutralny włącza się na hostach z `HOSTY_NEUTRALNE` (lista po przecinku,
 * np. alias na Vercelu) i na każdym hoście zaczynającym się od `neutralny.` (lokalnie `neutralny.localhost:3100`).
 * Linki i kody QR budujemy z bieżącego adresu, więc telefony graczy same trafiają na ten sam motyw co TV.
 */
export type Motyw = "bractwo" | "neutralny";

/** Logo motywu neutralnego (stoi tam, gdzie w motywie Bractwa logo Bractwa). `null` = bez logo. */
export const LOGO_NEUTRALNE: string | null = "/loga/jowes/jowes.png";

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
