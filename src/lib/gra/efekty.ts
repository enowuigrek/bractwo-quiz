"use client";

// Efekty dźwiękowe na TV (Web Audio, osobno od muzyki z `ekran/_ekran/muzyka.tsx`). Grają nagrania z
// `public/dzwieki/<nazwa>.mp3` (od 25.10 od Łukasza, przycięte z ciszy i wyrównane do szczytu −3 dB), a gdy pliku
// nie ma, prosta synteza; efekty `TYLKO_PLIK` bez pliku milczą. Efekt może mieć kilka plików, które idą na zmianę
// (`WARIANTY`, np. kroki).
// Przeglądarka TV pozwala grać dopiero po geście (OK na pilocie TV): `wznowEfekty()` woła ten sam gest co muzyka.

export type Efekt =
  /** Gracz dołączył w poczekalni. */
  | "pop"
  /** Odliczanie 3-2-1 przed pytaniem. */
  | "odliczanie"
  /** Start pytania (koniec odliczania). */
  | "start"
  /** Ostatnie sekundy pytania. */
  | "tik"
  /** Koniec czasu pytania. */
  | "gong"
  /** Odsłonięcie dobrej odpowiedzi. */
  | "ding"
  /** Plansza ciekawostki („a wiesz, że…”): osobny dźwięk niż dobra odpowiedź. */
  | "ciekawostka"
  /** Plansza z odpowiedziami graczy (kto dobrze, kto źle): „ding” niżej i wolniej, jak echo odsłony. */
  | "odpowiedzi"
  /** Ranking po pytaniu (wyścig): nalewanie piwa, tylko z pliku. */
  | "nalewanie"
  /** Wyścig: awatary jadą do szklanki (szum narastający), potem tory zamieniają się miejscami. */
  | "jazda"
  | "zamiana"
  /** Koniec etapu: dzwonek „ostatnia kolejka”. */
  | "dzwonek"
  /** Finał: krok naprzód (dobra odpowiedź) i cofnięcie (zła). */
  | "krok"
  | "pudlo"
  /** Werble przed podium (trwają, aż ktoś je zatrzyma) i fanfara z talerzem przy podium. */
  | "werble"
  | "fanfara";

const TYLKO_PLIK: ReadonlySet<Efekt> = new Set(["nalewanie"]);
/** Głośność efektów względem pełnej skali (muzyka gra na 0,55). */
const GLOSNOSC = 0.6;
/**
 * Pliki efektu grane po kolei, za każdym razem następny (bez wpisu: jeden plik o nazwie efektu). Brakujące pliki
 * są pomijane, więc nalewania można dokładać po jednym (`nalewanie-2.mp3`, `nalewanie-3.mp3`…).
 */
const WARIANTY: Partial<Record<Efekt, string[]>> = {
  krok: ["krok-1", "krok-2"],
  odpowiedzi: ["ding"],
  nalewanie: ["nalewanie", "nalewanie-2", "nalewanie-3", "nalewanie-4", "nalewanie-5", "nalewanie-6"],
};
/** Tempo odtwarzania pliku (poniżej 1: niżej i wolniej, jak zniekształcone echo). */
const TEMPO: Partial<Record<Efekt, number>> = { odpowiedzi: 0.78 };
/** Głośność pojedynczych efektów (bez wpisu 1): częste i tła ciszej, żeby nie zagłuszały muzyki. */
const GLOSNOSC_EFEKTU: Partial<Record<Efekt, number>> = {
  tik: 0.5,
  odliczanie: 0.7,
  jazda: 0.5,
  nalewanie: 0.7,
  krok: 0.8,
  pudlo: 0.8,
};
/**
 * Werble z pliku grają w pętli, aż prowadzący pokaże podium: po narastaniu w kółko równy kawałek werbla
 * (sekundy pliku, szew w cichych przerwach między uderzeniami, żeby rytm się nie potykał). Koniec pliku (uderzenie kończące i wybrzmienie, od ok. 6 s) nie gra nigdy.
 */
const WERBLE_PETLA_S = [5.15, 5.65] as const;
/** Werble z syntezy: najdłużej tyle sekund, gdyby nikt ich nie zatrzymał. */
const WERBLE_MAX_S = 20;

let ctx: AudioContext | null = null;
let wyjscie: GainNode | null = null;
let szum: AudioBuffer | null = null;
const pliki = new Map<string, Promise<AudioBuffer | null>>();
const ktoryWariant = new Map<Efekt, number>();

function kontekst(): AudioContext | null {
  if (ctx) return ctx;
  const Klasa =
    typeof window === "undefined"
      ? undefined
      : (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
  if (!Klasa) return null;
  ctx = new Klasa();
  wyjscie = ctx.createGain();
  wyjscie.gain.value = GLOSNOSC;
  wyjscie.connect(ctx.destination);
  return ctx;
}

/** W geście (OK na pilocie TV, kliknięcie): przeglądarka pozwala od tej chwili grać efekty. */
export function wznowEfekty(): void {
  const c = kontekst();
  if (c && c.state !== "running") void c.resume().catch(() => undefined);
}

/** Plik, wczytany raz; `null`, gdy go nie ma (wtedy synteza). */
function plik(nazwa: string): Promise<AudioBuffer | null> {
  let p = pliki.get(nazwa);
  if (!p) {
    p = fetch(`/dzwieki/${nazwa}.mp3`)
      .then((r) => (r.ok ? r.arrayBuffer() : null))
      .then((b) => (b && ctx ? ctx.decodeAudioData(b) : null))
      .catch(() => null);
    pliki.set(nazwa, p);
  }
  return p;
}

/** Bufor do zagrania: jedyny plik efektu albo następny z wczytanych wariantów (`null`: żadnego pliku nie ma). */
async function wybierzBufor(nazwa: Efekt): Promise<AudioBuffer | null> {
  const warianty = WARIANTY[nazwa];
  if (!warianty) return plik(nazwa);
  const wczytane = (await Promise.all(warianty.map(plik))).filter((b): b is AudioBuffer => b !== null);
  if (!wczytane.length) return null;
  const n = ktoryWariant.get(nazwa) ?? 0;
  ktoryWariant.set(nazwa, n + 1);
  return wczytane[n % wczytane.length];
}

/** Wczytuje pliki z góry, żeby pierwszy efekt nie czekał na sieć. */
export function wczytajEfekty(nazwy: readonly Efekt[]): void {
  if (!kontekst()) return;
  for (const n of nazwy) for (const p of WARIANTY[n] ?? [n]) void plik(p);
}

/**
 * Gra efekt. Zwraca funkcję, która go ucisza (werble grają, aż przyjdzie podium). Bez zgody przeglądarki
 * (kontekst wstrzymany) nic nie gra: efekt sprzed gestu i tak byłby już spóźniony.
 */
export function zagraj(nazwa: Efekt): () => void {
  const c = kontekst();
  if (!c || !wyjscie || c.state !== "running") return () => undefined;
  const glos = c.createGain();
  glos.gain.value = GLOSNOSC_EFEKTU[nazwa] ?? 1;
  glos.connect(wyjscie);
  let zatrzymany = false;
  let zatrzymajZrodlo: (() => void) | null = null;
  const zatrzymaj = () => {
    if (zatrzymany) return;
    zatrzymany = true;
    zatrzymajZrodlo?.();
    const t = c.currentTime;
    glos.gain.cancelScheduledValues(t);
    glos.gain.setValueAtTime(glos.gain.value, t);
    glos.gain.linearRampToValueAtTime(0, t + 0.15);
    window.setTimeout(() => glos.disconnect(), 400);
  };
  void wybierzBufor(nazwa).then((bufor) => {
    if (zatrzymany) return;
    if (bufor) {
      const zrodlo = c.createBufferSource();
      zrodlo.buffer = bufor;
      zrodlo.playbackRate.value = TEMPO[nazwa] ?? 1;
      if (nazwa === "werble" && bufor.duration > WERBLE_PETLA_S[1]) {
        zrodlo.loop = true;
        [zrodlo.loopStart, zrodlo.loopEnd] = WERBLE_PETLA_S;
      }
      zrodlo.connect(glos);
      zrodlo.start();
      // werble w pętli grałyby w nieskończoność: zatrzymanie wycisza głos i staje źródło
      zatrzymajZrodlo = () => zrodlo.stop(c.currentTime + 0.2);
    } else if (!TYLKO_PLIK.has(nazwa)) {
      SYNTEZA[nazwa as Exclude<Efekt, "nalewanie">]?.(c, glos, c.currentTime + 0.01);
    }
  });
  return zatrzymaj;
}

// --- synteza -------------------------------------------------------------------------------------------

type Synteza = (c: AudioContext, wyj: AudioNode, t: number) => void;

/** Jeden ton z obwiednią: szybki atak i wykładnicze wygaszenie (opcjonalnie przesuw wysokości). */
function ton(
  c: AudioContext,
  wyj: AudioNode,
  t: number,
  o: { f: number; f2?: number; typ?: OscillatorType; dl: number; g: number; filtr?: number },
) {
  const osc = c.createOscillator();
  osc.type = o.typ ?? "sine";
  osc.frequency.setValueAtTime(o.f, t);
  if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, t + o.dl * 0.8);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.g, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dl);
  let ogniwo: AudioNode = osc;
  if (o.filtr) {
    const f = c.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = o.filtr;
    osc.connect(f);
    ogniwo = f;
  }
  ogniwo.connect(g).connect(wyj);
  osc.start(t);
  osc.stop(t + o.dl + 0.05);
}

/** Sekunda białego szumu (wspólna dla werbla, talerza i przesuwania). */
function bufSzumu(c: AudioContext): AudioBuffer {
  const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

/** Krótki szum przez filtr (werbel, talerz, tyknięcie). */
function uderzenie(
  c: AudioContext,
  wyj: AudioNode,
  t: number,
  o: { dl: number; g: number; typ: BiquadFilterType; f: number; q?: number },
) {
  if (!szum) szum = bufSzumu(c);
  const z = c.createBufferSource();
  z.buffer = szum;
  const f = c.createBiquadFilter();
  f.type = o.typ;
  f.frequency.value = o.f;
  f.Q.value = o.q ?? 1;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(o.g, t + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t + o.dl);
  z.connect(f).connect(g).connect(wyj);
  z.start(t, Math.random() * 0.5);
  z.stop(t + o.dl + 0.05);
}

const SYNTEZA: Record<Exclude<Efekt, "nalewanie">, Synteza> = {
  pop: (c, w, t) => {
    ton(c, w, t, { f: 380, f2: 950, dl: 0.12, g: 0.5 });
    uderzenie(c, w, t, { dl: 0.03, g: 0.25, typ: "highpass", f: 4000 });
  },
  odliczanie: (c, w, t) => ton(c, w, t, { f: 660, typ: "triangle", dl: 0.18, g: 0.5 }),
  start: (c, w, t) => {
    ton(c, w, t, { f: 990, typ: "triangle", dl: 0.45, g: 0.5 });
    ton(c, w, t, { f: 1980, dl: 0.25, g: 0.15 });
  },
  tik: (c, w, t) => {
    ton(c, w, t, { f: 1700, dl: 0.04, g: 0.35 });
    uderzenie(c, w, t, { dl: 0.025, g: 0.2, typ: "highpass", f: 3000 });
  },
  // 25.10: łagodniej niż pierwsze wersje (dzwonki za bardzo dzwoniły): krótkie wygaszenie, bez metalicznych alikwotów
  gong: (c, w, t) => {
    // koniec czasu: miękkie, niskie „bum” w dół
    ton(c, w, t, { f: 165, f2: 120, dl: 0.9, g: 0.6 });
    ton(c, w, t, { f: 330, f2: 240, dl: 0.5, g: 0.15 });
  },
  ding: (c, w, t) => {
    // dobra odpowiedź: dwa ciepłe tony w górę jak marimba
    ton(c, w, t, { f: 784, typ: "triangle", dl: 0.35, g: 0.4 });
    ton(c, w, t + 0.12, { f: 1046, typ: "triangle", dl: 0.6, g: 0.4 });
  },
  dzwonek: (c, w, t) => {
    // koniec etapu: trzy miękkie tony w dół (jak gong w barze, ale bez dzwonienia)
    [880, 698, 523].forEach((f, i) => {
      ton(c, w, t + i * 0.28, { f, typ: "triangle", dl: 0.8, g: 0.38 });
      ton(c, w, t + i * 0.28, { f: f * 2, dl: 0.3, g: 0.08 });
    });
  },
  odpowiedzi: (c, w, t) => {
    // jak „ding”, tylko niżej i dłużej
    ton(c, w, t, { f: 612, typ: "triangle", dl: 0.45, g: 0.35 });
    ton(c, w, t + 0.15, { f: 816, typ: "triangle", dl: 0.75, g: 0.35 });
  },
  ciekawostka: (c, w, t) => {
    // „aha!”: miękki błysk w górę, jak zapalająca się żarówka (cztery krótkie tony i lekki szum)
    [659, 880, 1175, 1568].forEach((f, i) => ton(c, w, t + i * 0.07, { f, dl: 0.5 - i * 0.05, g: 0.22 }));
    uderzenie(c, w, t + 0.2, { dl: 0.4, g: 0.06, typ: "highpass", f: 6000 });
  },
  jazda: (c, w, t) => {
    // szum przesuwania: filtr jedzie w górę razem z awatarami (ok. 2 s), cicho pod muzyką
    if (!szum) szum = bufSzumu(c);
    const z = c.createBufferSource();
    z.buffer = szum;
    z.loop = true;
    const f = c.createBiquadFilter();
    f.type = "bandpass";
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(300, t);
    f.frequency.exponentialRampToValueAtTime(1600, t + 2);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 2.2);
    z.connect(f).connect(g).connect(w);
    z.start(t);
    z.stop(t + 2.3);
  },
  zamiana: (c, w, t) => {
    // tory zamieniają się miejscami: krótki „fiuu” i dwa tony w górę
    uderzenie(c, w, t, { dl: 0.35, g: 0.2, typ: "bandpass", f: 900, q: 0.8 });
    ton(c, w, t + 0.05, { f: 520, f2: 700, typ: "triangle", dl: 0.18, g: 0.3 });
    ton(c, w, t + 0.2, { f: 700, f2: 940, typ: "triangle", dl: 0.25, g: 0.3 });
  },
  krok: (c, w, t) => ton(c, w, t, { f: 520, f2: 820, typ: "triangle", dl: 0.14, g: 0.4 }),
  pudlo: (c, w, t) => ton(c, w, t, { f: 190, f2: 110, typ: "triangle", dl: 0.25, g: 0.5 }),
  werble: (c, w, t) => {
    // werbel: gęste uderzenia szumu, coraz głośniej przez pierwsze 6 s, potem równo
    const krok = 1 / 22;
    for (let i = 0; i * krok < WERBLE_MAX_S; i++) {
      const s = i * krok;
      const g = 0.08 + 0.3 * Math.min(1, s / 6) * (i % 2 ? 0.8 : 1);
      uderzenie(c, w, t + s, { dl: 0.07, g, typ: "bandpass", f: 1800, q: 0.7 });
    }
  },
  fanfara: (c, w, t) => {
    // talerz i trąbki: trzy krótkie, długi akord C-dur
    uderzenie(c, w, t, { dl: 1.8, g: 0.35, typ: "highpass", f: 5000 });
    const nuty: [number, number, number][] = [
      [392, 0, 0.16],
      [392, 0.18, 0.16],
      [392, 0.36, 0.16],
      [523, 0.56, 1.6],
    ];
    for (const [f, od, dl] of nuty) {
      ton(c, w, t + od, { f, typ: "sawtooth", dl, g: 0.22, filtr: 2400 });
    }
    for (const f of [659, 784]) ton(c, w, t + 0.56, { f, typ: "sawtooth", dl: 1.6, g: 0.16, filtr: 2400 });
  },
};
