/**
 * Marka (19.11): wszystko, czym różnią się wersje aplikacji (Bractwo, JOWES, kolejne firmy), w jednym obiekcie
 * zamiast rozgałęzień `neutralny ? … : …`. Rdzeń gry ma wszystkie elementy, a marka wyłącza swoje (`wylaczone`).
 * Marka wynika z adresu strony, nie z bazy (`markaZHosta`), tak jak dawny motyw neutralny (`src/lib/motyw.ts`).
 * Plik jest wspólny dla serwera i przeglądarki: obiekt marki ma w środku funkcje, więc do komponentów klienckich
 * idzie samo `id`, a obiekt bierze się z `MARKI` (`useMarka()` w `src/components/motyw.tsx`).
 */
import { BRACTWO } from "./marki/bractwo";
import { JOWES } from "./marki/jowes";

export type IdMarki = "bractwo" | "jowes";

/** Elementy rdzenia, które marka może wyłączyć. */
export type Element =
  /** szklanka na mecie wyścigu i jej nalewanie (z „Gracie o: …”) */
  | "szklanka"
  /** tło baru z nastrojami w wyścigu (bez niego tło z logo lokalu, jak w pub quizie) */
  | "tlo-baru"
  | "pijany-final"
  /** gościnny browar w kreatorze */
  | "kranoprzejecie"
  /** wybór nagród w kreatorze i karta nagród w pilocie (bez niego nagrody z quizu) */
  | "nagrody-przy-grze"
  /** okrzyki kibiców z telefonu w finale */
  | "kibicowanie"
  | "dzwiek-nalewania"
  /** nazwy etapów z szablonu (bez nich same numery: „Etap 1”…) */
  | "nazwy-etapow"
  /** plansze o Bractwie na ekranie lokalu przed wyścigiem */
  | "plansze-zapowiedzi"
  | "zapowiedzi-na-glownej"
  /** lista lokali na `/ekran` */
  | "lista-lokali"
  /** logo lokalu w nagłówkach obok logo marki */
  | "logo-lokalu-w-naglowku"
  /** napis „Ciekawostka” nad planszą */
  | "etykieta-ciekawostki"
  /** chmurki z pytaniem przy drodze każdego finalisty na TV */
  | "chmurki-pytan-w-finale";

/** Teksty, które różnią się między markami. */
export type Slownik = {
  /** „Quiz Bractwa Piwnego”: plansze, grafiki, podgląd linku */
  tytulQuizu: string;
  /** nazwy rodzajów (degustacja ma jedną nazwę, `NAZWY_RODZAJOW` w `src/lib/tagi.ts`) */
  rodzaje: { wyscig: string; klasyczny: string };
  /** słowa na lokal w panelu */
  lokal: { lokal: string; lokale: string; moj: string; ustawienia: string };
  /** cel wyścigu: „kto pierwszy dobiegnie do piwa” */
  doCelu: string;
  /** „jak wygląda wyścig po piwo” */
  wyscigOpis: string;
  /** pożegnanie na samym końcu tekstu; `null` = bez pożegnania */
  pozegnanie: string | null;
  /** podpowiedź w polu okazji w kreatorze gry */
  przykladOkazji: string;
  /** podpowiedź w polu tytułu quizu (wyścig i pub quiz) */
  przykladTytulu: string;
  /** hasła kibiców (numery jak w `HASLA`, bo w bazie jest tylko numer) */
  okrzyki: readonly (readonly [string, string])[];
  /** opis etapu z bazy, jak go widać w tej marce */
  opisEtapu: (opis: string) => string;
};

export type Marka = {
  id: IdMarki;
  /** nazwa aplikacji w tytule strony */
  nazwa: string;
  /** opis strony (metadane) */
  opis: string;
  /** logo marki tam, gdzie w Bractwie stoi logo Bractwa */
  logo: string;
  ikony: { ico: string; png: string; apple: string };
  /** konto do oznaczania na grafikach (bez @) */
  instagram: string | null;
  czcionka: "openSans" | "nunito";
  /** kolory używane w JS (grafiki, podgląd linku, pasek przeglądarki); reszta w CSS pod `data-marka` */
  kolory: {
    pasek: string;
    tlo: "ciemne" | "jasne";
    tekst: string;
    akcent: string;
    szary: string;
  };
  ikonyEtapow: "piwne" | "neutralne";
  awatar: "kapsel" | "kolo";
  teksty: Slownik;
  wylaczone: readonly Element[];
  /** zasady panelu zależne od adresu (tymczasowo w marce, docelowo w roli albo organizacji) */
  zasady: {
    /** boty w pilocie może dodać każde zalogowane konto, nie tylko twórca */
    botyDlaKazdego: boolean;
    /** rola lokalu widzi tylko quizy swojego lokalu, bez udostępnionych quizów Bractwa */
    lokalTylkoSwoje: boolean;
  };
};

export const MARKI: Record<IdMarki, Marka> = { bractwo: BRACTWO, jowes: JOWES };

/** Czy marka ma ten element rdzenia. */
export const ma = (marka: Marka, element: Element) => !marka.wylaczone.includes(element);

/**
 * Marka z adresu strony: JOWES na hostach z `HOSTY_NEUTRALNE` (lista po przecinku, np. alias na Vercelu) i na każdym
 * hoście zaczynającym się od `neutralny.` (lokalnie `neutralny.localhost:3100`), poza tym Bractwo. Linki i kody QR
 * budujemy z bieżącego adresu, więc telefony graczy same trafiają na tę samą markę co TV.
 */
export function markaZHosta(host: string | null | undefined, hostyNeutralne = ""): IdMarki {
  const h = (host ?? "").toLowerCase().split(":")[0];
  if (!h) return "bractwo";
  if (h.startsWith("neutralny.")) return "jowes";
  const lista = hostyNeutralne
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  return lista.includes(h) ? "jowes" : "bractwo";
}
