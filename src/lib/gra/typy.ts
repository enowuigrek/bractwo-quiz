// Odpowiedzi funkcji gry (RPC) tak, jak widzą je przeglądarki.

import type { Nagroda } from "../typy";
import type { DaneOdpowiedzi, DaneWidoczne, TypZadania } from "../zadania";

export type { Nagroda };

/** Faza widziana przez klientów: `przygotuj` to `pytanie` przed `faza_od`. */
export type FazaWidoczna =
  | "poczekalnia"
  /** Quiz z etapami: plansza wstępu przed 1. etapem (cała droga, odpadanie, szklanka); prowadzący opowiada. */
  | "wstep"
  | "etap"
  | "seria"
  /** Tryb „Pijany finał”: po finale dogrywka bez punktów z chaosem na ekranach (src/lib/pijany.ts). */
  | "pijany"
  /** Po finale serią: ekrany gasną i czekają, aż prowadzący pokaże podium. */
  | "werble"
  | "przygotuj"
  | "pytanie"
  | "wynik"
  | "odpowiedzi"
  | "ranking"
  | "podium"
  | "tabela"
  | "koniec";

export type ZadanieWidoczne = {
  id: string;
  nr: number;
  /** Numer kolejny w quizie (numeracja `nr` może mieć dziury). */
  lp: number;
  typ: TypZadania;
  tresc: string;
  grafika_url: string | null;
  /** `null`: bez limitu czasu. */
  czas_s: number | null;
  /** `poprawna` pojawia się dopiero od fazy `wynik`. Kształt zależy od typu (src/lib/zadania.ts). */
  dane: DaneWidoczne;
  /** Podpowiedzi, które już się odsłoniły (kolejna co `podpowiedzi_co_s` od startu pytania). */
  podpowiedzi: string[];
  liczba_podpowiedzi: number;
  podpowiedzi_co_s: number | null;
  /**
   * Statystyki, od fazy `wynik`: ile osób wybrało każdą odpowiedź,
   * a w szacowaniu wszystkie podane liczby (rosnąco, bez nicków).
   */
  rozklad?: number[] | null;
  liczba_poprawnych?: number;
  najszybszy?: { nick: string; czas_ms: number } | null;
  /** Szacowanie: do trzech graczy najbliżej poprawnej liczby. */
  najblizej?: { nick: string; liczba: number }[] | null;
};

/** Etap quizu (tabela `etapy`): plansza przed pierwszym pytaniem, mnożnik punktów, czas, finał trójki. */
export type EtapWidoczny = {
  id: string;
  /** Numer etapu 1..liczba. */
  nr: number;
  liczba: number;
  nazwa: string;
  /** Grafika przedmiotu przy nazwie etapu (/grafiki/etapy/…), null: bez ikony. */
  ikona: string | null;
  opis: string | null;
  mnoznik: number;
  /** Czas na odpowiedź w etapie (z etapu albo gry), null: bez limitu. */
  czas_s: number | null;
  /** Finał: odpowiadają tylko trzej najlepsi (`StanSesji.finalisci`). */
  finalowy: boolean;
  /** Seria: wszystkie pytania naraz, każdy we własnym tempie; `czas_s` to czas na całą serię. */
  seria: boolean;
  /** Następny etap to finał trójki: po tym etapie 3 najlepszych wchodzi do finału. */
  final_po_etapie: boolean;
  /** Gdzieś dalej w quizie jest finał trójki. */
  final_dalej: boolean;
  /** Odpadanie: ilu najlepszych gra dalej po tym etapie (null: nikt nie odpada; próg z `sesje.progi`). */
  przechodzi: number | null;
  liczba_pytan: number;
  /** Rodzaje pytań w etapie, w kolejności pierwszego wystąpienia. */
  typy: TypZadania[];
};

export type StanSesji = {
  kod: string;
  tryb: "solo" | "druzyny";
  okazja: string | null;
  grafika_url: string | null;
  bonus_czas: boolean;
  /** Nagrody za miejsca (null: bez nagród). Nie są tajne. */
  nagrody: Nagroda[] | null;
  /** Gościnny browar (kranoprzejęcie): logo obok Bractwa i lokalu. */
  browar: { nazwa: string; logo_url: string | null; instagram?: string | null } | null;
  /** Zapowiedź: planowana godzina startu (null: bez zapowiedzi). */
  planowany_start: string | null;
  /** Fałsz: gra zapowiedziana, TV pokazuje godzinę i odliczanie zamiast QR, dołączać jeszcze nie można. */
  poczekalnia_otwarta: boolean;
  /** Ranking po pytaniu na TV: tabela albo wyścig (src/lib/gra/wyscig.ts). */
  widok_rankingu: "tabela" | "wyscig";
  /** Tryb „Pijany finał” włączony w kreatorze gry. */
  pijany_final: boolean;
  /** Kto dziś stoi za barem (wstawka {za_barem} w pytaniach pijanego finału). */
  za_barem: string | null;
  /** Muzyka na TV włączona w pilocie (src/app/ekran/_ekran/muzyka.tsx). */
  muzyka: boolean;
  /** Automatyczne prowadzenie (przełącznik w pilocie, src/app/pilot/[kod]/auto.tsx). */
  auto: boolean;
  /** Ilu grających kliknęło „Gotowy” na bieżącej planszy (boty zawsze gotowe). */
  gotowi: number;
  max_graczy: number;
  lokal: { nazwa: string; miasto: string | null; logo_url: string | null; instagram?: string | null } | null;
  quiz: {
    tytul: string;
    liczba_zadan: number;
    liczba_etapow: number;
    /** Maksimum punktów przed finałem (1000 × mnożnik za pytanie): skala wyścigu. */
    max_przed_finalem: number;
  } | null;
  /** Etap bieżącego pytania, a w fazie `etap` ten, który się zaczyna (null: quiz bez etapów). */
  etap: EtapWidoczny | null;
  /** Finał trójki: kto odpowiada (null: wszyscy); `kibice`: ilu graczy wysłało finaliście okrzyk. */
  finalisci: (GraczNaLiscie & { kibice?: number })[] | null;
  /** Faza `seria`: postęp grających na żywo (ile odpowiedzi, suma ocen dobrych odpowiedzi). */
  seria: SeriaGracz[] | null;
  /** Faza `seria`: okrzyki kibiców z ostatnich 8 s, od najstarszego (dymki na TV). */
  okrzyki?: Okrzyk[] | null;
  faza: FazaWidoczna;
  faza_od: string | null;
  faza_do: string | null;
  zadanie: ZadanieWidoczne | null;
  liczba_graczy: number;
  /** Ilu graczy jeszcze gra (bez odpadniętych w etapach przed finałem). */
  w_grze: number;
  /** Bieżące pytanie jest ostatnie w etapie: ranking po nim to koniec etapu (napis na TV, muzyka gaśnie). */
  ostatnie_w_etapie: boolean;
  /** Etapy quizu z odpadaniem (ilu przechodzi po etapie): plan gry na planszy etapu. */
  plan_etapow: { nr: number; nazwa: string; ikona: string | null; finalowy: boolean; przechodzi: number | null }[];
  /** Ile osób odpowiedziało na bieżące zadanie. */
  liczba_odpowiedzi: number;
  /** Zegar serwera w chwili odpowiedzi. */
  teraz: string;
};

export type PilotStan = StanSesji & {
  /** Rozwiązanie bieżącego zadania (kształt jak `dane.poprawna`). */
  poprawna: number | number[] | null;
  ostatnie_zadanie: boolean;
  /** Rodzaj następnego pytania (null po ostatnim): prowadzący uprzedza graczy przed startem. */
  nastepne_typ: TypZadania | null;
  /** Następne pytanie zaczyna nowy etap (null: ten sam etap albo quiz bez etapów). */
  nastepny_etap: EtapWidoczny | null;
  /** Wszystkie podpowiedzi bieżącego pytania (prowadzący widzi je od początku). */
  wszystkie_podpowiedzi: string[];
  /** Odpadanie: {"nr etapu": ilu przechodzi po nim}, zapisane albo domyślne z liczby graczy. */
  progi: Record<string, number>;
  /** Prowadzący zmienił progi (inaczej domyślne, liczone przy starcie). */
  progi_wlasne: boolean;
  /** Etapy quizu (do edycji progów). */
  etapy: { nr: number; nazwa: string; finalowy: boolean }[];
  /** Ile botów do testów jest w grze (`dodaj_boty`; pilot każe im odpowiadać, src/app/pilot/[kod]/boty.tsx). */
  boty: number;
};

/** Wiersz `pilot_gracze`: token służy do QR, którym gracz wraca do gry na innym telefonie. */
export type GraczPilota = {
  nick: string;
  zdjecie: string | null;
  token: string;
  punkty: number;
  odpowiedzial: boolean;
};

export type AkcjaPilota =
  | "otworz"
  | "nastepne"
  | "wynik"
  | "odpowiedzi"
  | "ranking"
  | "werble"
  | "podium"
  | "tabela"
  | "koniec"
  | "plansze"
  | "muzyka";

/** Gracz w trwającej serii (`StanSesji.seria`). */
export type SeriaGracz = {
  nick: string;
  zdjecie: string | null;
  odpowiedzi: number;
  dobre: number;
  /** Finał jako wyścig: przewaga na starcie w krokach (0–3, src/lib/gra/final.ts). */
  start?: number;
  /** Finał jako wyścig: kroki do szklanki z bazy (przewaga, +1 za dobrą, −1 za złą, nie mniej niż 0). */
  kroki?: number;
  /** Ile okrzyków dostał od kibiców. */
  doping?: number;
};

/** Okrzyk kibica w serii finału (`kibicuj`); `haslo` to numer z `HASLA` w src/lib/gra/okrzyki.ts. */
export type Okrzyk = { id: string; kibic: string; finalista: string; haslo: number; utworzono: string };

/** Pytanie serii z `seria_pytania` (bez rozwiązania). */
export type PytanieSerii = Pick<ZadanieWidoczne, "id" | "nr" | "typ" | "tresc" | "grafika_url" | "dane">;

/** Wiersz `lista_graczy`: nick i adres selfie (null: bez zdjęcia). */
export type GraczNaLiscie = { nick: string; zdjecie: string | null };

export type Dolaczenie = { token: string; nick: string; powrot: boolean };

/** Odpowiedź `zapisz_odpowiedz`. Nie mówi, czy odpowiedź jest poprawna. */
export type ZapisOdpowiedzi =
  /** `poprawna` tylko z serii (`zapisz_odpowiedz_serii`): animacja oceny po odpowiedzi w finale. */
  | { przyjeta: true; czas_ms: number; poprawna?: boolean }
  | {
      przyjeta: false;
      powod: "nie_teraz" | "inne_zadanie" | "za_wczesnie" | "po_czasie" | "juz_odpowiedziano" | "kibic" | "odpadl";
    };

/** `moj_wynik`: odpowiedź gracza na bieżące zadanie, suma punktów i miejsce. */
export type MojWynik = {
  kod: string;
  nick: string;
  zdjecie: string | null;
  faza: FazaWidoczna;
  zadanie_nr: number;
  /** `poprawna` i `punkty` dopiero od fazy `wynik`. */
  odpowiedz: { dane: DaneOdpowiedzi; czas_ms: number; poprawna?: boolean; punkty?: number; ocena?: number } | null;
  /** Kiedy obsługa potwierdziła odbiór nagrody (null: jeszcze nie). */
  nagroda_odebrana: string | null;
  punkty: number;
  miejsce: number;
  liczba_graczy: number;
  /** Po którym etapie gracz odpadł (null: gra dalej). */
  odpadl: number | null;
};

/**
 * Wiersz funkcji `odpowiedzi_zadania` (od fazy `wynik`): kto i jak odpowiedział na bieżące zadanie.
 * Kolejność z bazy: dobre od najszybszej, złe od najszybszej, bez odpowiedzi (`poprawna` = null).
 */
export type WierszOdpowiedzi = {
  nick: string;
  zdjecie: string | null;
  dane: DaneOdpowiedzi | null;
  poprawna: boolean | null;
  /** Ocena 0..1 (częściowa w nowych typach). */
  ocena: number | null;
  czas_ms: number | null;
  punkty: number | null;
};

/** Wiersz funkcji `ranking`. `poprzednie_miejsce` i `zdobyte` dotyczą ostatniego jawnego pytania. */
export type WierszRankingu = {
  nick: string;
  zdjecie: string | null;
  punkty: number;
  miejsce: number;
  poprzednie_miejsce: number;
  zdobyte: number;
  /** Po którym etapie odpadł (null: gra dalej). */
  odpadl: number | null;
};
