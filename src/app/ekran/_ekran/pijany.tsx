"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Awatar } from "@/components/awatar";
import { ogloszWybuch, useDzwiekOdblokowany } from "@/lib/gra/dzwiek";
import type { StanSesji } from "@/lib/gra/typy";
import { WIDEO_WYLEWANIA, WYBUCH_PRZED_S, WYBUCH_S, WYLEWANIE_S, zegarPijany } from "@/lib/pijany";
import { awatarNaDrogach, drogi, PLANSZA_DROG, PlanszaDrog, punktNaDrodze, SZKLANKA_FINALU } from "./drogi";
import { NaglowekSerii } from "./seria";
import { Szklanka } from "./wyscig";

/**
 * Gracz na TV w pijanym finale: `start` to położenie na drodze (0..1), na którym skończyła się seria,
 * `lider` jak w serii (złota obwódka), żeby przejście niczym się nie zdradziło.
 */
export type GraczPijany = { nick: string; zdjecie: string | null; start: number; lider: boolean };

/**
 * Sekundy od wejścia w fazę: chwila bezruchu, powolne cofanie od szklanki, spadające drogi, potem lot.
 * Rozłożone na pierwsze pytania dogrywki, żeby chaos narastał stopniowo, a nie od razu.
 */
const COFANIE_S = 6;
const SPADANIE_S = 18;
const LOT_S = 24;
/** Z drogi zostaje tyle, ile przejechał gracz, razy to (cofają się w stronę startu). */
const COFNIECIE = 0.3;
/** Prędkość odlotu awatarów od wybuchu szklanki w px/s. */
const ODLOT = 1700;
/** Prędkość lotu w px/s: na początku powoli, pod koniec fazy szybciej. */
const PREDKOSC = { od: 80, do: 240 };
/** Miejsce nad awatarem na podpis z nickiem, żeby przy górnej krawędzi nie wychodził poza planszę. */
const PODPIS_PX = 50;

type Lot = { x: number; y: number; vx: number; vy: number };

const ograniczone = (x: number) => Math.min(1, Math.max(0, x));
const lagodnie = (u: number) => 1 - (1 - u) ** 3;

/**
 * Pijany finał na TV (faza `pijany`): wynik już jest, a gracze odpowiadają na telefonach na pytania, które
 * nic nie liczą. Tryb jest ukryty przed graczami: nagłówek ten sam co w serii (finał trwa, zegar liczy czas
 * dogrywki), tylko plansza się psuje. Awatary najpierw cofają się od szklanki, drogi spadają w dół ekranu,
 * a potem awatary latają i odbijają się od krawędzi jak stary wygaszacz DVD: drżą, pulsują i widzą
 * podwójnie, coraz mocniej aż do końca fazy (`--poziom` 0..1; TV nie wie, na którym pytaniu jest który
 * telefon). Szklanka zostaje. Położenia liczy pętla klatek, nie React, więc odświeżanie stanu niczego nie zrywa.
 */
export function PijanyTv({
  stan,
  teraz,
  przesuniecie,
  gracze,
}: {
  stan: StanSesji;
  teraz: number;
  przesuniecie: number;
  gracze: GraczPijany[];
}) {
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : od + 90_000;
  const poziom = ograniczone((teraz - od) / Math.max(1, do_ - od));
  const lista = drogi(gracze.length);
  const awatar = awatarNaDrogach(lista);

  // wybuch w wideo pękającej szklanki: interfejs się rozpada (niżej przy wideo)
  const [wybuch, ustawWybuch] = useState(false);

  // pętla klatek czyta zawsze najnowsze dane, a nie startuje od nowa przy każdym odświeżeniu stanu
  const dane = useRef({ gracze, od, do_, przesuniecie, wybuch });
  useEffect(() => {
    dane.current = { gracze, od, do_, przesuniecie, wybuch };
  });
  const elementy = useRef(new Map<string, HTMLDivElement>());

  useLayoutEffect(() => {
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const loty = new Map<string, Lot>();
    // wybuch: każdy odlatuje od szklanki z miejsca, w którym był w tej chwili
    const ostatnie = new Map<string, { x: number; y: number }>();
    const odloty = new Map<string, Lot>();
    let poprzednia = performance.now();
    let klatka = 0;

    const ustaw = () => {
      const { gracze, od, do_, przesuniecie, wybuch } = dane.current;
      const chwila = performance.now();
      // po schowanej karcie bez skoku przez pół planszy
      const dt = Math.min(0.1, (chwila - poprzednia) / 1000);
      poprzednia = chwila;
      const teraz = Date.now() + przesuniecie;
      const t = (teraz - od) / 1000;
      const v = PREDKOSC.od + (PREDKOSC.do - PREDKOSC.od) * ograniczone((teraz - od) / Math.max(1, do_ - od));
      const lista = drogi(gracze.length);
      const brzeg = {
        x0: awatar / 2,
        x1: PLANSZA_DROG.szer - awatar / 2,
        y0: awatar / 2 + PODPIS_PX,
        y1: PLANSZA_DROG.wys - awatar / 2,
      };

      gracze.forEach((g, i) => {
        const el = elementy.current.get(g.nick);
        if (!el) return;
        const cel = g.start * COFNIECIE;
        let p: { x: number; y: number };
        if (!ruch) {
          // ograniczony ruch: od razu cofnięci, bez lotu
          p = punktNaDrodze(lista[i], cel);
        } else if (wybuch) {
          let o = odloty.get(g.nick);
          if (!o) {
            const s = ostatnie.get(g.nick) ?? punktNaDrodze(lista[i], cel);
            const dx = s.x - SZKLANKA_FINALU.x;
            const dy = s.y - SZKLANKA_FINALU.y;
            const d = Math.hypot(dx, dy) || 1;
            o = { x: s.x, y: s.y, vx: dx / d, vy: dy / d - 0.25 };
            odloty.set(g.nick, o);
          }
          // bez odbijania: lecą poza ekran
          o.x += o.vx * ODLOT * dt;
          o.y += o.vy * ODLOT * dt;
          p = o;
        } else if (t < LOT_S) {
          const u = lagodnie(ograniczone((t - COFANIE_S) / (LOT_S - COFANIE_S)));
          p = punktNaDrodze(lista[i], g.start + (cel - g.start) * u);
        } else {
          let l = loty.get(g.nick);
          if (!l) {
            // każdy w inną stronę (co złoty kąt), z miejsca, w którym skończył cofanie
            const s = punktNaDrodze(lista[i], cel);
            const kat = ((200 + i * 137.5) * Math.PI) / 180;
            l = {
              x: Math.min(brzeg.x1, Math.max(brzeg.x0, s.x)),
              y: Math.min(brzeg.y1, Math.max(brzeg.y0, s.y)),
              vx: Math.cos(kat),
              vy: Math.sin(kat),
            };
            loty.set(g.nick, l);
          }
          l.x += l.vx * v * dt;
          l.y += l.vy * v * dt;
          if (l.x < brzeg.x0 || l.x > brzeg.x1) {
            l.vx = l.x < brzeg.x0 ? Math.abs(l.vx) : -Math.abs(l.vx);
            l.x = Math.min(brzeg.x1, Math.max(brzeg.x0, l.x));
          }
          if (l.y < brzeg.y0 || l.y > brzeg.y1) {
            l.vy = l.y < brzeg.y0 ? Math.abs(l.vy) : -Math.abs(l.vy);
            l.y = Math.min(brzeg.y1, Math.max(brzeg.y0, l.y));
          }
          p = l;
        }
        ostatnie.set(g.nick, { x: p.x, y: p.y });
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      });
    };

    // przy ograniczonym ruchu pętla też chodzi (nic nie lata), żeby dopisani później gracze dostali miejsce
    ustaw();
    const krok = () => {
      ustaw();
      klatka = requestAnimationFrame(krok);
    };
    klatka = requestAnimationFrame(krok);
    return () => cancelAnimationFrame(klatka);
  }, [awatar]);

  const minelo = (teraz - od) / 1000;

  // Koniec dogrywki: ostatnie sekundy to wideo pękającej szklanki (pierwsza klatka = ta szklanka w tym samym
  // miejscu sceny). Wideo leży na całej scenie 1920×1080 (portal do `.scena`, bo tu wszystko się przesuwa),
  // czeka zatrzymane na pierwszej klatce i rusza tak, żeby skończyć się z werblami (src/lib/pijany.ts). Szklankę chowamy
  // dopiero, gdy wideo naprawdę gra: bez pliku albo bez zgody przeglądarki na odtwarzanie zostaje jak było.
  const [scena, ustawScene] = useState<Element | null>(null);
  const wideo = useRef<HTMLVideoElement>(null);
  const [gra, ustawGra] = useState(false);
  // wybuch (`WYBUCH_S` klipu) wypada `WYBUCH_PRZED_S` przed końcem fazy, po chwili ciszy od zgaszenia telefonów
  const przedKoncem = Math.min(WYLEWANIE_S, WYBUCH_PRZED_S + WYBUCH_S);
  const czasWylewania = teraz >= od && do_ - teraz <= przedKoncem * 1000;
  // dźwięk wybuchu tylko przy włączonej muzyce i gdy przeglądarka już pozwoliła grać (muzyka.tsx)
  const dzwiek = useDzwiekOdblokowany() && stan.muzyka;
  useEffect(() => {
    if (wideo.current) wideo.current.muted = !dzwiek;
  }, [dzwiek, scena]);
  useEffect(() => {
    if (czasWylewania) void wideo.current?.play().catch(() => undefined);
  }, [czasWylewania, scena]);

  return (
    <div
      className={`tv-wyscig tv-seria tv-pijany${gra ? " wylewa" : ""}${wybuch ? " wybuch" : ""}`}
      style={{ "--poziom": poziom } as React.CSSProperties}
      ref={(el) => {
        if (el && !scena) ustawScene(el.closest(".scena"));
      }}
    >
      {scena &&
        createPortal(
          <video
            ref={wideo}
            className={`pijany-wideo${gra ? " gra" : ""}`}
            src={WIDEO_WYLEWANIA}
            muted
            playsInline
            preload="auto"
            onPlaying={() => ustawGra(true)}
            onTimeUpdate={(e) => {
              if (!wybuch && e.currentTarget.currentTime >= WYBUCH_S) {
                ustawWybuch(true);
                ogloszWybuch();
              }
            }}
          />,
          scena,
        )}
      {/* nagłówek jak w serii, tylko zegar wariuje coraz bardziej */}
      <NaglowekSerii stan={stan} teraz={teraz} zegar={zegarPijany((teraz - od) / 1000, (do_ - od) / 1000)} />

      <div className="drogi-finalu">
        <PlanszaDrog
          lista={lista}
          spadaja={minelo >= SPADANIE_S}
          szklanka={<Szklanka przed={1} teraz={1} doKonca={0} />}
        />
        {gracze.map((g, i) => (
          <div
            key={g.nick}
            ref={(el) => {
              if (el) elementy.current.set(g.nick, el);
              else elementy.current.delete(g.nick);
            }}
            className={`drogi-finalu-gracz pijany-gracz${g.lider ? " lider" : ""}`}
            style={{ "--i": i } as React.CSSProperties}
          >
            <div className="pijany-drzenie">
              <div className="pijany-awatar">
                {/* podwójne widzenie: blady drugi awatar obok */}
                <span className="pijany-duch" aria-hidden>
                  <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={awatar} />
                </span>
                <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={awatar} />
              </div>
              <span className="drogi-finalu-podpis">
                <span>{g.nick}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
