import { BRACTWO_INSTAGRAM } from "../konta";
import { HASLA } from "../gra/okrzyki";
import type { Marka } from "../marka";

/** Bractwo Piwne: marka domyślna, z całym rdzeniem poza chmurkami pytań w finale (tam stoi szklanka). */
export const BRACTWO: Marka = {
  id: "bractwo",
  nazwa: "Bractwo Quiz",
  opis: "Quiz Bractwa Piwnego – Piwu Cześć!",
  logo: "/loga/bractwo.svg",
  ikony: { ico: "/ikony/bractwo.ico", png: "/ikony/bractwo.png", apple: "/ikony/bractwo-apple.png" },
  instagram: BRACTWO_INSTAGRAM,
  czcionka: "openSans",
  kolory: { pasek: "#000000", tlo: "ciemne", tekst: "#f4ecd8", akcent: "#e3ac3f", szary: "#9aa3ad" },
  ikonyEtapow: "piwne",
  awatar: "kapsel",
  teksty: {
    tytulQuizu: "Quiz Bractwa Piwnego",
    rodzaje: { wyscig: "Wyścig po piwo", klasyczny: "Pub quiz" },
    lokal: { lokal: "Lokal", lokale: "Lokale", moj: "Mój lokal", ustawienia: "Ustawienia lokalu" },
    doCelu: "do piwa",
    naglowekFinalu: "Finał: wyścig po piwo",
    wyscigOpis: "wyścig po piwo",
    pozegnanie: "Piwu Cześć!",
    przykladOkazji: "np. Dzień Porteru",
    przykladTytulu: "np. Portery i stouty",
    okrzyki: HASLA,
    opisEtapu: (opis) => opis,
  },
  wylaczone: ["chmurki-pytan-w-finale"],
  zasady: { botyDlaKazdego: false, lokalTylkoSwoje: false },
};
