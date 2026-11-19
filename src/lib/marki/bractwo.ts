import { BRACTWO_INSTAGRAM } from "../konta";
import { HASLA } from "../gra/okrzyki";
import type { Marka } from "../marka";

/** Bractwo Piwne: marka domyślna, z całym rdzeniem poza chmurkami pytań w finale (tam stoi szklanka). */
export const BRACTWO: Marka = {
  id: "bractwo",
  nazwa: "Bractwo Quiz",
  opis: "Quiz Bractwa Piwnego – Piwu Cześć!",
  logo: {
    plik: "/loga/bractwo.svg",
    biale: "/loga/bractwo-biale.svg",
    alt: "Bractwo Piwne",
    klasa: "logo-bractwo",
    // przycięty viewBox w public/loga/bractwo.svg
    proporcja: 3284 / 1990,
    szerokie: false,
  },
  ikony: { ico: "/ikony/bractwo.ico", png: "/ikony/bractwo.png", apple: "/ikony/bractwo-apple.png" },
  strona: { adres: "https://bractwopiwne.pl", napis: "bractwopiwne.pl" },
  instagram: BRACTWO_INSTAGRAM,
  czcionka: "openSans",
  kolory: { pasek: "#000000", tlo: "ciemne", tekst: "#f4ecd8", akcent: "#e3ac3f", szary: "#9aa3ad" },
  podglad: {
    tytul: "Quiz Bractwa Piwnego",
    podpis: null,
    tlo: "radial-gradient(ellipse 70% 60% at 50% 38%, #3a2a10 0%, #140e07 55%, #000000 100%)",
    tekst: "#f4ecd8",
    logo: { wys: 230 },
  },
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
    opisEkranu: {
      lokal: "Quiz Bractwa Piwnego. Otwórz ten link na telewizorze w lokalu: plansze, zapowiedź i gra pokażą się same.",
      gra: "Quiz Bractwa Piwnego. Otwórz ten link na telewizorze: gra pokaże się sama.",
    },
    przykladOkazji: "np. Dzień Porteru",
    przykladTytulu: "np. Portery i stouty",
    okrzyki: HASLA,
  },
  przyklady: {
    wybor: { tresc: "Które z tych piw warzy się z pszenicy?", odp: ["Pils", "Weizen", "Koźlak", "IPA"] },
    prawdaFalsz: "Porter bałtycki to piwo ciemne.",
    wielokrotny: { tresc: "Które z nich to chmiele?", odp: ["Cascade", "Pils", "Citra", "Monachijski"] },
    kolejnosc: { odp: ["Kufel 0,5 l", "Kieliszek", "Beczka", "Puszka 0,33 l"], kolej: [1, 3, 0, 2] },
    szacowanie: "Ile kufli wypije dziś stolik nr 3?",
  },
  wylaczone: ["chmurki-pytan-w-finale"],
  zasady: { botyDlaKazdego: false, lokalTylkoSwoje: false },
};
