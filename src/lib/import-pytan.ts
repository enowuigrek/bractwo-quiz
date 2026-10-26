// Wklejanie pytań do klasycznego quizu (panel, strona quizu): tekst w prostym formacie, np. przygotowany przez AI
// według promptu z `promptPytan`, zamieniony na pytania. Parser jest wspólny dla podglądu w przeglądarce i zapisu na serwerze;
// serwer i tak sprawdza każde pytanie tak samo jak formularz pytania (`odczytajTresc` w quizy/akcje.ts).
//
// Format: każde pytanie zaczyna się od rodzaju w nawiasach kwadratowych (puste linie między nimi dla wygody):
//   [jedna] Treść?          + dobra / - zła (2–6 odpowiedzi, jedna dobra)
//   [kilka] Treść?          jak wyżej, dobrych 1–4
//   [prawda/fałsz] Zdanie.  = prawda albo = fałsz
//   [liczba] Treść?         = 1,5 / zakres: 0,25 – 3 / jednostka: l
//   [kolejność] Treść       > element… we właściwej kolejności (3–6)
//   [pary] Treść            lewy = prawy (2–6)
// Ciekawostek w klasycznym quizie nie robimy (26.10): to szybki quiz z promptu, plansze z ciekawostkami są w wyścigu.
// Do każdego pytania można dopisać linie „podpowiedź: …” (najwyżej 4).

import type { TypZadania } from "./zadania";

/** Pytanie z wklejonego tekstu w kształcie, który przyjmuje formularz pytania (`tresc`, `typ`, `dane` jako JSON). */
export type WklejonePytanie = {
  tresc: string;
  typ: TypZadania;
  dane: Record<string, unknown>;
  /** Rozwiązanie jednym zdaniem do podglądu. */
  opis: string;
};

export type WynikWklejenia = { pytania: WklejonePytanie[]; bledy: string[] };

const RODZAJE: Record<string, TypZadania> = {
  jedna: "wybor",
  "jedna odpowiedź": "wybor",
  wybór: "wybor",
  wybor: "wybor",
  kilka: "wielokrotny",
  "kilka dobrych": "wielokrotny",
  wielokrotny: "wielokrotny",
  "prawda/fałsz": "prawda_falsz",
  "prawda/falsz": "prawda_falsz",
  "prawda / fałsz": "prawda_falsz",
  "prawda czy fałsz": "prawda_falsz",
  prawda: "prawda_falsz",
  liczba: "szacowanie",
  szacowanie: "szacowanie",
  kolejność: "kolejnosc",
  kolejnosc: "kolejnosc",
  pary: "pary",
};

/** Liczba z polskim albo angielskim zapisem: „1,5”, „1 516”, „1.5”. */
function liczba(t: string): number | null {
  const n = Number(t.replace(/\s/g, "").replace(",", "."));
  return t.trim() && Number.isFinite(n) ? n : null;
}

/** Ile miejsc po przecinku ma liczba w zapisie (do kroku suwaka). */
function miejsca(t: string): number {
  const m = t.trim().match(/[.,](\d+)$/);
  return m ? m[1].length : 0;
}

/** Zdejmuje to, co AI lubi dodawać: numerację, wypunktowanie Markdowna, pogrubienia. */
function oczysc(linia: string): string {
  return linia
    .replace(/\*\*/g, "")
    .replace(/^\s*(\d+[.)]\s+)(?=\[)/, "")
    .trim();
}

function czytajBlok(linie: string[], nr: number): WklejonePytanie | string {
  const naglowek = linie[0].match(/^\[([^\]]+)\]\s*(.*)$/);
  if (!naglowek) return `Pytanie ${nr}: zacznij od rodzaju w nawiasach, np. „[jedna] Treść pytania?”.`;
  const typ = RODZAJE[naglowek[1].trim().toLocaleLowerCase("pl").replace(/\s+/g, " ")];
  if (/^ciekawostk/i.test(naglowek[1].trim())) return `Pytanie ${nr}: ciekawostek w klasycznym quizie nie robimy, usuń ją.`;
  if (!typ) return `Pytanie ${nr}: nieznany rodzaj „[${naglowek[1]}]”.`;
  const tresc = naglowek[2].trim();
  if (!tresc) return `Pytanie ${nr}: brak treści po „[${naglowek[1]}]”.`;

  const podpowiedzi: string[] = [];
  const reszta: string[] = [];
  for (const l of linie.slice(1)) {
    const p = l.match(/^podpowied[źz]\s*:\s*(.+)$/i);
    if (p) podpowiedzi.push(p[1].trim());
    else reszta.push(l);
  }
  const dodatki = podpowiedzi.length ? { podpowiedzi } : {};
  const blad = (opis: string) => `Pytanie ${nr} („${tresc.slice(0, 40)}${tresc.length > 40 ? "…" : ""}”): ${opis}`;

  if (typ === "wybor" || typ === "wielokrotny") {
    const odpowiedzi: string[] = [];
    const poprawna: number[] = [];
    for (const l of reszta) {
      const m = l.match(/^([+\-–—])\s*(.+)$/);
      if (!m) return blad(`niezrozumiała linia „${l}” (odpowiedź zaczyna się od + albo -).`);
      if (m[1] === "+") poprawna.push(odpowiedzi.length);
      odpowiedzi.push(m[2].trim());
    }
    if (poprawna.length === 0) return blad("zaznacz dobrą odpowiedź znakiem +.");
    if (typ === "wybor" && poprawna.length > 1) return blad("w [jedna] tylko jedna odpowiedź z +, a przy kilku użyj [kilka].");
    const opis =
      "Dobre: " + poprawna.map((i) => odpowiedzi[i]).join(", ") + ` (z ${odpowiedzi.length} odpowiedzi)`;
    return {
      tresc,
      typ,
      dane: { odpowiedzi, poprawna: typ === "wybor" ? poprawna[0] : poprawna, ...dodatki },
      opis,
    };
  }

  if (typ === "prawda_falsz") {
    const m = reszta.join(" ").match(/^=\s*(prawda|fałsz|falsz)\b/i);
    if (!m) return blad("dopisz „= prawda” albo „= fałsz”.");
    const prawda = m[1].toLowerCase() === "prawda";
    return { tresc, typ, dane: { poprawna: prawda ? 0 : 1, ...dodatki }, opis: prawda ? "Prawda" : "Fałsz" };
  }

  if (typ === "szacowanie") {
    let poprawnaTekst = "";
    let zakres: [string, string] | null = null;
    let jednostka: string | null = null;
    for (const l of reszta) {
      const p = l.match(/^=\s*(.+)$/);
      const z = l.match(/^zakres\s*:\s*(-?[\d\s.,]+?)\s*(?:–|—|-|do)\s*(-?[\d\s.,]+)\s*$/i);
      const j = l.match(/^jednostka\s*:\s*(.*)$/i);
      if (p) poprawnaTekst = p[1].trim();
      else if (z) zakres = [z[1], z[2]];
      else if (j) jednostka = j[1].trim() || null;
      else return blad(`niezrozumiała linia „${l}”.`);
    }
    const poprawna = liczba(poprawnaTekst);
    if (poprawna === null) return blad("dopisz poprawną liczbę, np. „= 1,5”.");
    if (!zakres) return blad("dopisz zakres suwaka, np. „zakres: 0,25 – 3”.");
    const [min, max] = [liczba(zakres[0]), liczba(zakres[1])];
    if (min === null || max === null || min >= max) return blad("zakres musi iść od mniejszej do większej liczby.");
    if (poprawna < min || poprawna > max) return blad("poprawna liczba musi leżeć w zakresie.");
    const krok = 10 ** -Math.max(miejsca(poprawnaTekst), miejsca(zakres[0]), miejsca(zakres[1]));
    const zJ = (n: string) => `${n.trim()}${jednostka ? ` ${jednostka}` : ""}`;
    return {
      tresc,
      typ,
      dane: { min, max, krok, poprawna, jednostka, ...dodatki },
      opis: `${zJ(poprawnaTekst)} (zakres ${zakres[0].trim()}–${zJ(zakres[1])})`,
    };
  }

  if (typ === "kolejnosc") {
    const elementy: string[] = [];
    for (const l of reszta) {
      const m = l.match(/^(?:>|\d+[.)])\s*(.+)$/);
      if (!m) return blad(`niezrozumiała linia „${l}” (element zaczyna się od >).`);
      elementy.push(m[1].trim());
    }
    return { tresc, typ, dane: { elementy, ...dodatki }, opis: elementy.join(" → ") };
  }

  // pary: „lewy = prawy”
  const pary: [string, string][] = [];
  for (const l of reszta) {
    const m = l.match(/^(.+?)\s+(?:=|–|—|->|→)\s+(.+)$/);
    if (!m) return blad(`niezrozumiała linia „${l}” (para to „lewy = prawy”).`);
    pary.push([m[1].replace(/^[-*]\s*/, "").trim(), m[2].trim()]);
  }
  return { tresc, typ, dane: { pary, ...dodatki }, opis: pary.map(([l, p]) => `${l} – ${p}`).join(", ") };
}

/** Zamienia wklejony tekst na pytania; błędy opisuje po polsku z numerem pytania. */
export function czytajPytania(tekst: string): WynikWklejenia {
  const linie = tekst
    .replace(/\r/g, "")
    .split("\n")
    .filter((l) => !/^\s*```/.test(l))
    .map(oczysc);
  // bloki: od linii z [rodzajem] do następnej; puste linie nic nie znaczą (AI różnie je stawia)
  const bloki: string[][] = [];
  for (const l of linie) {
    if (!l) continue;
    if (/^\[[^\]]+\]/.test(l) || !bloki.length) bloki.push([l]);
    else bloki[bloki.length - 1].push(l);
  }
  const pytania: WklejonePytanie[] = [];
  const bledy: string[] = [];
  bloki
    .filter((b) => b.length)
    .forEach((b, i) => {
      const w = czytajBlok(b, i + 1);
      if (typeof w === "string") bledy.push(w);
      else pytania.push(w);
    });
  return { pytania, bledy };
}

/** Rodzaje pytań do wyboru w formularzu promptu, z zasadą i wzorem formatu dla AI. */
export const RODZAJE_PROMPTU = {
  jedna: {
    nazwa: "Jedna odpowiedź",
    zasada: "[jedna]: 4 odpowiedzi, dokładnie jedna dobra. Dobra odpowiedź stoi za każdym razem na innym miejscu.",
    wzor: "[jedna] Treść pytania?\n- zła odpowiedź\n+ dobra odpowiedź\n- zła odpowiedź\n- zła odpowiedź",
  },
  kilka: {
    nazwa: "Kilka dobrych",
    zasada: "[kilka]: 4–6 odpowiedzi, dobrych od 1 do 4, w kolejnych pytaniach różna liczba dobrych.",
    wzor: "[kilka] Treść pytania?\n+ dobra odpowiedź\n- zła odpowiedź\n+ dobra odpowiedź\n- zła odpowiedź",
  },
  prawda: {
    nazwa: "Prawda / fałsz",
    zasada: "[prawda/fałsz]: zdanie do oceny, mniej więcej po równo prawdziwych i fałszywych.",
    wzor: "[prawda/fałsz] Zdanie do oceny.\n= prawda",
  },
  liczba: {
    nazwa: "Liczba",
    zasada:
      "[liczba]: gracz ustawia liczbę suwakiem w podanym zakresie. Poprawna liczba nie leży na środku zakresu ani na jego krańcu. Jednostkę (np. l, km, %, zł) dopisz w linii „jednostka:”, a gdy jej nie ma, pomiń tę linię.",
    wzor: "[liczba] Treść pytania?\n= 1,5\nzakres: 0,25 – 3\njednostka: l",
  },
  kolejnosc: {
    nazwa: "Kolejność",
    zasada: "[kolejność]: 3–6 elementów, wypisane we właściwej kolejności (automat sam je pomiesza).",
    wzor: "[kolejność] Ułóż od najstarszego do najnowszego\n> pierwszy\n> drugi\n> trzeci",
  },
  pary: {
    nazwa: "Pary",
    zasada: "[pary]: 3–5 par, wypisane poprawnie (automat sam pomiesza prawą stronę).",
    wzor: "[pary] Połącz … z …\nlewa strona = prawa strona\nlewa strona = prawa strona\nlewa strona = prawa strona",
  },
} as const;
export type RodzajPromptu = keyof typeof RODZAJE_PROMPTU;

export const POZIOMY_PROMPTU = {
  latwy: { nazwa: "Łatwy", opis: "łatwe, dla każdego przy piwie, bez specjalistycznej wiedzy" },
  mieszany: { nazwa: "Mieszany", opis: "od łatwych na początku do trudnych na końcu" },
  trudny: { nazwa: "Trudny", opis: "dla znawców tematu, ale wciąż do zgadnięcia" },
} as const;
export type PoziomPromptu = keyof typeof POZIOMY_PROMPTU;

export type UstawieniaPromptu = {
  temat: string;
  liczba: number;
  rodzaje: RodzajPromptu[];
  poziom: PoziomPromptu;
  /** Dowolne dopiski prowadzącego, np. „bez pytań o Marvela”. */
  uwagi: string;
};

/** Najwięcej pytań w jednym prompcie: tyle przyjmuje wklejanie naraz (`MAX_WKLEJONYCH` w quizy/akcje.ts). */
export const MAX_PYTAN_PROMPTU = 80;

const listaPolska = (l: string[]) => (l.length < 2 ? l.join("") : `${l.slice(0, -1).join(", ")} i ${l[l.length - 1]}`);

/**
 * Prompt dla AI z formularza pod polem wklejania (temat, liczba, rodzaje, poziom): prowadzący kopiuje gotowy tekst
 * do dowolnego czatu, a odpowiedź wkleja z powrotem. W prompcie tylko wybrane rodzaje (zasady i wzory). Zasady
 * układania jak w CLAUDE.md (trudność rośnie, dobra odpowiedź pod różnymi literami, liczba nie na środku zakresu);
 * bez ciekawostek.
 */
export function promptPytan(u: UstawieniaPromptu): string {
  const rodzaje = u.rodzaje.length ? u.rodzaje : (["jedna"] as RodzajPromptu[]);
  const znaczniki = rodzaje.map((r) => RODZAJE_PROMPTU[r].wzor.slice(0, RODZAJE_PROMPTU[r].wzor.indexOf("]") + 1));
  const opisRodzajow =
    rodzaje.length === 1
      ? `tylko ${znaczniki[0]}`
      : rodzaje.includes("jedna")
        ? `głównie [jedna], do tego ${listaPolska(znaczniki.filter((z) => z !== "[jedna]"))}`
        : `${listaPolska(znaczniki)}, mniej więcej po równo`;
  const temat = u.temat.trim() || "dowolny, lekki temat do pubu";
  const uwagi = u.uwagi.trim();

  return `Przygotuj pytania do quizu w pubie (gracze odpowiadają na telefonach, pytania widać na telewizorze).

Temat: ${temat}
Liczba pytań: ${u.liczba}
Rodzaje pytań: ${opisRodzajow}
Poziom: ${POZIOMY_PROMPTU[u.poziom].opis}${uwagi ? `\nDodatkowo: ${uwagi}` : ""}

Zasady:
- Fakty muszą być prawdziwe i sprawdzalne. Gdy nie masz pewności, pomiń pytanie.
- Trudność rośnie od pierwszego do ostatniego pytania.
- Po polsku, krótko i jasno: pytanie do 300 znaków, odpowiedź do 120 znaków.
${rodzaje.map((r) => `- ${RODZAJE_PROMPTU[r].zasada}`).join("\n")}
- Bez ciekawostek i komentarzy między pytaniami: same pytania.
- W jednym pytaniu odpowiedzi się nie powtarzają. Bez odpowiedzi w rodzaju „wszystkie powyższe”.
- Jeśli temat dotyczy piwa: pytaj o style, historię i browary rzemieślnicze, nie o piwa koncernów. Styl to „pils”, nie „pilzner”.

Format: trzymaj się go dokładnie, bo tekst czyta automat. Każde pytanie zaczyna się od rodzaju w nawiasach kwadratowych. Zwróć same pytania w jednym bloku kodu, bez numeracji i bez komentarzy.

${rodzaje.map((r) => RODZAJE_PROMPTU[r].wzor).join("\n\n")}

Do dowolnego pytania możesz dopisać do 4 linii „podpowiedź: …”: pokazują się graczom po kolei w trakcie pytania, od najogólniejszej.`;
}
