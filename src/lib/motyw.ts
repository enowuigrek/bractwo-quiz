/**
 * Motyw wyglądu (18.11): „bractwo” (domyślny) albo „neutralny” (quiz bez piwa i Bractwa, np. firmowy).
 * Motyw wynika z adresu strony, nie z bazy: neutralny włącza się na hostach z `HOSTY_NEUTRALNE` (lista po przecinku,
 * np. alias na Vercelu) i na każdym hoście zaczynającym się od `neutralny.` (lokalnie `neutralny.localhost:3100`).
 * Linki i kody QR budujemy z bieżącego adresu, więc telefony graczy same trafiają na ten sam motyw co TV.
 */
import { markaZHosta } from "./marka";

export type Motyw = "bractwo" | "neutralny";

export function motywZHosta(host: string | null | undefined, hostyNeutralne = ""): Motyw {
  return markaZHosta(host, hostyNeutralne) === "bractwo" ? "bractwo" : "neutralny";
}

/** Pożegnanie na końcu tekstu: w Bractwie „Piwu Cześć!”, w neutralnym nic. */
export function zPozegnaniem(tekst: string, motyw: Motyw): string {
  return motyw === "bractwo" ? `${tekst} Piwu Cześć!` : tekst;
}
