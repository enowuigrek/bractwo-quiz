import { HASLA_NEUTRALNE } from "../gra/okrzyki";
import type { Marka } from "../marka";

/**
 * JOWES (18.11, quiz firmowy Zbyszka na Forum): jasna, w kolorach i kroju jowes.pl, bez piwa i Bractwa. Lokal to
 * tu organizacja, a jej logo to to samo koło co logo marki, więc w nagłówkach stoi tylko logo marki.
 */
export const JOWES: Marka = {
  id: "jowes",
  nazwa: "Quiz",
  opis: "Quiz na żywo",
  logo: {
    plik: "/loga/jowes/jowes.png",
    biale: null,
    alt: "",
    klasa: "logo-motywu",
    proporcja: null,
    szerokie: true,
  },
  ikony: { ico: "/ikony/jowes.ico", png: "/ikony/jowes.png", apple: "/ikony/jowes-apple.png" },
  strona: null,
  instagram: null,
  czcionka: "nunito",
  kolory: { pasek: "#ffffff", tlo: "jasne", tekst: "#1f1f1f", akcent: "#e58e00", szary: "#6b7480" },
  podglad: {
    tytul: "Quiz na żywo",
    podpis: "Ekran do wyświetlania quizu",
    tlo: "radial-gradient(ellipse 70% 60% at 50% 38%, #ffffff 0%, #fff8ec 55%, #ffe3b8 100%)",
    tekst: "#333333",
    // logo JOWES 446×124
    logo: { szer: 612, wys: 170 },
  },
  ikonyEtapow: "neutralne",
  awatar: "kolo",
  teksty: {
    tytulQuizu: "Quiz",
    rodzaje: { wyscig: "Wyścig", klasyczny: "Quiz klasyczny" },
    lokal: {
      lokal: "Organizacja",
      lokale: "Organizacje",
      moj: "Moja organizacja",
      ustawienia: "Ustawienia organizacji",
    },
    doCelu: "do mety",
    naglowekFinalu: "Finał",
    wyscigOpis: "wyścig",
    pozegnanie: null,
    opisEkranu: {
      lokal: "Otwórz ten link na telewizorze: gra pokaże się sama.",
      gra: "Otwórz ten link na telewizorze: gra pokaże się sama.",
    },
    przykladOkazji: "np. Forum PS",
    przykladTytulu: "np. Forum PS",
    okrzyki: HASLA_NEUTRALNE,
    // opisy etapów w bazie są z szablonu Bractwa: bez piwa (docelowo osobny opis w quizie, JOWES-DECYZJE 2.1)
    opisEtapu: (opis) =>
      opis
        .replace(/,? jak to jedno piwo/g, "")
        .replace(/wyścig do piwa/g, "wyścig do mety")
        .replace(/do piwa/g, "do mety"),
  },
  przyklady: {
    wybor: { tresc: "Która z tych planet jest największa?", odp: ["Mars", "Jowisz", "Wenus", "Merkury"] },
    prawdaFalsz: "Wieloryb jest ssakiem.",
    wielokrotny: { tresc: "Które z nich to owoce?", odp: ["Jabłko", "Marchew", "Gruszka", "Ziemniak"] },
    kolejnosc: { odp: ["Kot", "Mysz", "Słoń", "Pies"], kolej: [1, 0, 3, 2] },
    szacowanie: "Ile minut potrwa dziś przerwa na kawę?",
  },
  wylaczone: [
    "szklanka",
    "tlo-baru",
    "pijany-final",
    "kranoprzejecie",
    "nagrody-przy-grze",
    "kibicowanie",
    "dzwiek-nalewania",
    "nazwy-etapow",
    "plansze-zapowiedzi",
    "zapowiedzi-na-glownej",
    "lista-lokali",
    "logo-lokalu-w-naglowku",
    "etykieta-ciekawostki",
  ],
  zasady: { botyDlaKazdego: true, lokalTylkoSwoje: true },
};
