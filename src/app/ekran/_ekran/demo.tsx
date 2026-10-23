"use client";

import { useEffect, useState } from "react";
import { NAZWY_TYPOW, PODPOWIEDZI_TYPOW, type TypZadania } from "@/lib/zadania";

// Animowany telefon na planszy etapu: palec sam pokazuje, jak odpowiada się w danym typie pytania.
// Każda pętla trwa OKRES_MS; przy kilku typach w etapie pokazujemy je po kolei.
// Ekran telefonu ma 380×700 px, a wszystkie położenia niżej są w tych pikselach.

const OKRES_MS = 5200;
const SZER = 380;

/** Faza pętli 0..1 i numer pętli; przy ograniczonym ruchu stoi w końcowym stanie. */
function useCykl(): { t: number; nr: number } {
  const [stan, ustaw] = useState({ t: 0.9, nr: 0 });
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    const zegar = setInterval(() => {
      const uplynelo = performance.now() - start;
      ustaw({ t: (uplynelo % OKRES_MS) / OKRES_MS, nr: Math.floor(uplynelo / OKRES_MS) });
    }, 50);
    return () => clearInterval(zegar);
  }, []);
  return stan;
}

/** Punkt ścieżki palca: w chwili `t` (0..1) jest w (x, y); `stuk` = w tej chwili stuka. */
type Punkt = { t: number; x: number; y: number; stuk?: boolean };

function palec(sciezka: Punkt[], t: number): { x: number; y: number; stuka: boolean } {
  const i = sciezka.findIndex((p) => p.t > t);
  const b = sciezka[i === -1 ? sciezka.length - 1 : i];
  const a = sciezka[i <= 0 ? 0 : i - 1];
  const u = b.t === a.t ? 1 : Math.min(1, Math.max(0, (t - a.t) / (b.t - a.t)));
  // łagodny start i koniec ruchu
  const e = u * u * (3 - 2 * u);
  const stuka = sciezka.some((p) => p.stuk && Math.abs(p.t - t) < 0.025);
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, stuka };
}

const SPOCZYNEK = { x: 300, y: 660 };

/** Kafelek odpowiedzi na ekranie telefonu. */
function Kafel({
  x,
  y,
  w,
  h,
  znak,
  tekst,
  stan,
  duzy = false,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  znak?: string;
  tekst: string;
  stan?: "wybrany" | "para0" | "para1" | "para2";
  /** Duży kafel prawda / fałsz: znak nad napisem. */
  duzy?: boolean;
}) {
  return (
    <div
      className={`demo-kafel${duzy ? " duzy" : ""}${stan ? ` ${stan}` : ""}`}
      style={{ left: x, top: y, width: w, height: h }}
    >
      {znak !== undefined && <span className="demo-znak">{znak}</span>}
      <span>{tekst}</span>
    </div>
  );
}

const KAFLE_Y = (i: number) => 150 + i * 106;
const KAFEL = { x: 20, w: SZER - 40, h: 90 };
const srodekKafla = (i: number) => ({ x: SZER / 2, y: KAFLE_Y(i) + KAFEL.h / 2 });

function Zatwierdz({ blysk }: { blysk: boolean }) {
  return (
    <div className={`demo-zatwierdz${blysk ? " blysk" : ""}`} style={{ top: 590 }}>
      Zatwierdź
    </div>
  );
}

type Scena = { tresc: string; elementy: React.ReactNode; sciezka: Punkt[] };

function scena(typ: TypZadania, t: number): Scena {
  const poStuku = (chwila: number) => t > chwila + 0.02;
  switch (typ) {
    case "wybor": {
      const odp = ["Pils", "Weizen", "Koźlak", "IPA"];
      return {
        tresc: "Które z tych piw warzy się z pszenicy?",
        elementy: odp.map((o, i) => (
          <Kafel
            key={o}
            {...KAFEL}
            y={KAFLE_Y(i)}
            znak={"ABCD"[i]}
            tekst={o}
            stan={i === 1 && poStuku(0.35) ? "wybrany" : undefined}
          />
        )),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          { t: 0.3, ...srodekKafla(1) },
          { t: 0.35, ...srodekKafla(1), stuk: true },
          { t: 0.5, ...srodekKafla(1) },
          { t: 0.8, ...SPOCZYNEK },
        ],
      };
    }
    case "prawda_falsz": {
      const srodek = (i: number) => ({ x: 20 + 80 + i * 180, y: 350 });
      return {
        tresc: "Porter bałtycki to piwo ciemne.",
        elementy: ["Prawda", "Fałsz"].map((o, i) => (
          <Kafel
            key={o}
            x={20 + i * 180}
            y={250}
            w={160}
            h={200}
            duzy
            znak={i === 0 ? "✓" : "✗"}
            tekst={o}
            stan={i === 0 && poStuku(0.35) ? "wybrany" : undefined}
          />
        )),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          { t: 0.3, ...srodek(0) },
          { t: 0.35, ...srodek(0), stuk: true },
          { t: 0.5, ...srodek(0) },
          { t: 0.8, ...SPOCZYNEK },
        ],
      };
    }
    case "wielokrotny": {
      const odp = ["Cascade", "Pilzner", "Citra", "Monachijski"];
      const zaznaczone = [poStuku(0.22), false, poStuku(0.42), false];
      return {
        tresc: "Które z nich to chmiele?",
        elementy: (
          <>
            {odp.map((o, i) => (
              <Kafel
                key={o}
                {...KAFEL}
                y={KAFLE_Y(i)}
                znak={zaznaczone[i] ? "✓" : "ABCD"[i]}
                tekst={o}
                stan={zaznaczone[i] ? "wybrany" : undefined}
              />
            ))}
            <Zatwierdz blysk={t > 0.64 && t < 0.8} />
          </>
        ),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          { t: 0.18, ...srodekKafla(0) },
          { t: 0.22, ...srodekKafla(0), stuk: true },
          { t: 0.38, ...srodekKafla(2) },
          { t: 0.42, ...srodekKafla(2), stuk: true },
          { t: 0.58, x: SZER / 2, y: 625 },
          { t: 0.62, x: SZER / 2, y: 625, stuk: true },
          { t: 0.9, ...SPOCZYNEK },
        ],
      };
    }
    case "kolejnosc": {
      const odp = ["Fermentacja", "Śrutowanie", "Leżakowanie", "Zacieranie"];
      // właściwa kolejność kafelków i chwile stuknięć
      const kolej = [1, 3, 0, 2];
      const chwile = [0.16, 0.3, 0.44, 0.58];
      const numer = (i: number) => {
        const k = kolej.indexOf(i);
        return poStuku(chwile[k]) ? String(k + 1) : "·";
      };
      return {
        tresc: "Ułóż etapy warzenia po kolei.",
        elementy: odp.map((o, i) => (
          <Kafel
            key={o}
            {...KAFEL}
            y={KAFLE_Y(i)}
            znak={numer(i)}
            tekst={o}
            stan={numer(i) !== "·" ? "wybrany" : undefined}
          />
        )),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          ...kolej.flatMap((i, k) => [
            { t: chwile[k] - 0.05, ...srodekKafla(i) },
            { t: chwile[k], ...srodekKafla(i), stuk: true },
          ]),
          { t: 0.85, ...SPOCZYNEK },
        ],
      };
    }
    case "pary": {
      const lewe = ["Stout", "Weizen", "IPA"];
      const prawe = ["Bawaria", "Anglia", "Irlandia"];
      // lewy i → prawy pary[i]; stuknięcia: lewy, potem prawy
      const pary = [2, 0, 1];
      const chwile = [0.12, 0.38, 0.64];
      const y = (i: number) => 170 + i * 130;
      const lewySrodek = (i: number) => ({ x: 95, y: y(i) + 50 });
      const prawySrodek = (i: number) => ({ x: 285, y: y(i) + 50 });
      const polaczona = (i: number) => poStuku(chwile[i] + 0.12);
      const kolor = (i: number) => (polaczona(i) ? (["para0", "para1", "para2"] as const)[i] : undefined);
      return {
        tresc: "Połącz styl z krajem.",
        elementy: (
          <>
            <svg className="demo-linie" width={SZER} height={700} aria-hidden>
              {pary.map(
                (k, i) =>
                  polaczona(i) && (
                    <line key={i} x1={170} y1={y(i) + 50} x2={210} y2={y(k) + 50} className={`demo-linia para${i}`} />
                  ),
              )}
            </svg>
            {lewe.map((o, i) => (
              <Kafel key={o} x={20} y={y(i)} w={150} h={100} znak={String(i + 1)} tekst={o} stan={kolor(i)} />
            ))}
            {prawe.map((o, k) => {
              const i = pary.indexOf(k);
              return <Kafel key={o} x={210} y={y(k)} w={150} h={100} znak={"ABC"[k]} tekst={o} stan={kolor(i)} />;
            })}
          </>
        ),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          ...pary.flatMap((k, i) => [
            { t: chwile[i] - 0.05, ...lewySrodek(i) },
            { t: chwile[i], ...lewySrodek(i), stuk: true },
            { t: chwile[i] + 0.1, ...prawySrodek(k) },
            { t: chwile[i] + 0.12, ...prawySrodek(k), stuk: true },
          ]),
          { t: 0.92, ...SPOCZYNEK },
        ],
      };
    }
    case "szacowanie": {
      // suwak 1400–1700 jedzie z połowy do ok. 1516, potem „Zatwierdź”
      const u = Math.min(1, Math.max(0, (t - 0.15) / 0.35));
      const e = u * u * (3 - 2 * u);
      const v = 0.5 - 0.113 * e;
      const liczba = Math.round(1400 + v * 300);
      const kciukX = 40 + v * 300;
      return {
        tresc: "W którym roku ogłoszono Reinheitsgebot?",
        elementy: (
          <>
            <p className="demo-liczba">{liczba}</p>
            <div className="demo-suwak" style={{ top: 420 }}>
              <span style={{ left: kciukX - 40 }} />
            </div>
            <Zatwierdz blysk={t > 0.64 && t < 0.8} />
          </>
        ),
        sciezka: [
          { t: 0, ...SPOCZYNEK },
          { t: 0.12, x: 40 + 0.5 * 300, y: 430 },
          { t: 0.15, x: 40 + 0.5 * 300, y: 430 },
          { t: 0.5, x: 40 + 0.387 * 300, y: 430 },
          { t: 0.58, x: SZER / 2, y: 625 },
          { t: 0.62, x: SZER / 2, y: 625, stuk: true },
          { t: 0.9, ...SPOCZYNEK },
        ],
      };
    }
  }
}

/** Telefon z animacją; przy kilku typach w etapie zmienia typ co pętlę. */
export function DemoTelefonu({ typy }: { typy: TypZadania[] }) {
  const { t, nr } = useCykl();
  const typ = typy[nr % typy.length] ?? "wybor";
  const { tresc, elementy, sciezka } = scena(typ, t);
  const p = palec(sciezka, t);
  return (
    <figure className="demo">
      <div className="demo-telefon">
        <div className="demo-ekran">
          <p className="demo-tresc">{tresc}</p>
          {elementy}
          <span className={`demo-palec${p.stuka ? " stuka" : ""}`} style={{ left: p.x, top: p.y }} aria-hidden />
        </div>
      </div>
      <figcaption>
        <strong>{NAZWY_TYPOW[typ]}</strong>
        <span>{PODPOWIEDZI_TYPOW[typ]}</span>
      </figcaption>
    </figure>
  );
}
