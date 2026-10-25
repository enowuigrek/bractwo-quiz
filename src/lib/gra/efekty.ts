"use client";

// Efekty dźwiękowe na TV (Web Audio, osobno od muzyki z `ekran/_ekran/muzyka.tsx`). Każdy efekt ma prostą
// wersję syntezowaną, więc działa bez plików. Gdy w `public/dzwieki/<nazwa>.mp3` leży plik, gra plik zamiast
// syntezy (np. nagranie kapsla albo dzwonka barowego); efekty `TYLKO_PLIK` bez pliku po prostu milczą.
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
  /** Ranking po pytaniu (wyścig): nalewanie piwa, tylko z pliku. */
  | "nalewanie"
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
/** Werble z syntezy: najdłużej tyle sekund, gdyby nikt ich nie zatrzymał. */
const WERBLE_MAX_S = 20;

let ctx: AudioContext | null = null;
let wyjscie: GainNode | null = null;
let szum: AudioBuffer | null = null;
const pliki = new Map<Efekt, Promise<AudioBuffer | null>>();

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

/** Plik efektu, wczytany raz; `null`, gdy go nie ma (wtedy synteza). */
function plik(nazwa: Efekt): Promise<AudioBuffer | null> {
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

/** Wczytuje pliki z góry, żeby pierwszy efekt nie czekał na sieć. */
export function wczytajEfekty(nazwy: readonly Efekt[]): void {
  if (!kontekst()) return;
  for (const n of nazwy) void plik(n);
}

/**
 * Gra efekt. Zwraca funkcję, która go ucisza (werble grają, aż przyjdzie podium). Bez zgody przeglądarki
 * (kontekst wstrzymany) nic nie gra: efekt sprzed gestu i tak byłby już spóźniony.
 */
export function zagraj(nazwa: Efekt): () => void {
  const c = kontekst();
  if (!c || !wyjscie || c.state !== "running") return () => undefined;
  const glos = c.createGain();
  glos.connect(wyjscie);
  let zatrzymany = false;
  const zatrzymaj = () => {
    if (zatrzymany) return;
    zatrzymany = true;
    const t = c.currentTime;
    glos.gain.cancelScheduledValues(t);
    glos.gain.setValueAtTime(glos.gain.value, t);
    glos.gain.linearRampToValueAtTime(0, t + 0.15);
    window.setTimeout(() => glos.disconnect(), 400);
  };
  void plik(nazwa).then((bufor) => {
    if (zatrzymany) return;
    if (bufor) {
      const zrodlo = c.createBufferSource();
      zrodlo.buffer = bufor;
      zrodlo.connect(glos);
      zrodlo.start();
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

/** Krótki szum przez filtr (werbel, talerz, tyknięcie). */
function uderzenie(
  c: AudioContext,
  wyj: AudioNode,
  t: number,
  o: { dl: number; g: number; typ: BiquadFilterType; f: number; q?: number },
) {
  if (!szum) {
    szum = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const d = szum.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
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

/** Dzwonek: podstawa i niestrojone alikwoty jak w metalu. */
function dzwon(c: AudioContext, wyj: AudioNode, t: number, f: number, dl: number, g: number) {
  ton(c, wyj, t, { f, dl, g });
  ton(c, wyj, t, { f: f * 2.76, dl: dl * 0.5, g: g * 0.35 });
  ton(c, wyj, t, { f: f * 5.4, dl: dl * 0.25, g: g * 0.15 });
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
  gong: (c, w, t) => {
    ton(c, w, t, { f: 196, dl: 2.2, g: 0.55 });
    ton(c, w, t, { f: 196 * 2.02, dl: 1.4, g: 0.2 });
    ton(c, w, t, { f: 196 * 2.76, dl: 0.9, g: 0.15 });
    uderzenie(c, w, t, { dl: 0.08, g: 0.2, typ: "lowpass", f: 800 });
  },
  ding: (c, w, t) => dzwon(c, w, t, 1318, 1.4, 0.4),
  dzwonek: (c, w, t) => {
    // „ostatnia kolejka”: dzwonek barowy rozkołysany, kilka uderzeń, coraz ciszej
    for (let i = 0; i < 8; i++) dzwon(c, w, t + i * 0.11, 1760, 0.6, 0.32 * (1 - i * 0.08));
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
