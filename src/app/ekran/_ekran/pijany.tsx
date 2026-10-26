"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Awatar } from "@/components/awatar";
import { ogloszWybuch, useDzwiekOdblokowany } from "@/lib/gra/dzwiek";
import { zagraj } from "@/lib/gra/efekty";
import { OKRES_KOLYSANIA_S } from "@/lib/gra/muzyka-pijana";
import { czyTelewizor } from "@/lib/gra/telewizor";
import type { StanSesji } from "@/lib/gra/typy";
import { GASNIECIE_S, WYBUCH_PRZED_S, WYBUCH_S, WYLEWANIE_S, zegarPijany } from "@/lib/pijany";
import { useWideoWybuchu } from "./wideo-wybuchu";
import { awatarNaDrogach, drogi, PlanszaDrog, punktNaDrodze, SZKLANKA_FINALU } from "./drogi";
import { NaglowekSerii } from "./seria";
import { Szklanka } from "./wyscig";

/**
 * Gracz na TV w pijanym finale: `start` to położenie na drodze (0..1), na którym skończyła się seria,
 * `lider` jak w serii (złota obwódka), żeby przejście niczym się nie zdradziło.
 */
export type GraczPijany = { nick: string; zdjecie: string | null; start: number; lider: boolean };

/** Prędkość odlotu awatarów od wybuchu szklanki w px/s. */
const ODLOT = 1700;
/** Bujanie planszy (stopnie) i zjeżdżanie po drodze (część drogi) na początku i pod koniec fazy. */
const BUJANIE_DEG = { od: 0.6, do: 2.8 };
const ZJEZDZANIE = { od: 0.012, do: 0.06 };

type Lot = { x: number; y: number; vx: number; vy: number };

const ograniczone = (x: number) => Math.min(1, Math.max(0, x));

/** Odłamki szkła, krople piwa i piana przy wybuchu bez wideo: stałe, policzone raz (złoty kąt, bez losowania). */
const ODLAMKI = Array.from({ length: 34 }, (_, i) => {
  const kat = ((i * 137.5 + (i % 3) * 11) * Math.PI) / 180;
  const zasieg = 420 + ((i * 97) % 640);
  const rodzaj = i % 3 === 0 ? "kropla" : i % 5 === 1 ? "piana" : "szklo";
  return {
    rodzaj,
    dx: Math.cos(kat) * zasieg,
    // grawitacja: wszystko leci trochę w dół
    dy: Math.sin(kat) * zasieg * 0.8 + 220,
    obrot: ((i * 211) % 720) - 360,
    rozmiar: rodzaj === "piana" ? 34 + ((i * 7) % 30) : rodzaj === "kropla" ? 12 + ((i * 5) % 16) : 20 + ((i * 13) % 34),
    opoznienie: (i % 4) * 0.03,
  };
});

/**
 * Pijany finał na TV (faza `pijany`): wynik już jest, a gracze odpowiadają na telefonach na pytania, które nic
 * nie liczą. Tryb jest ukryty przed graczami: nagłówek ten sam co w serii (finał trwa, zegar liczy czas
 * dogrywki). Od 26.10 subtelnie, żeby wybuch zaskoczył: nagłówek się kołysze, plansza z drogami buja się w rytm
 * muzyki (ten sam okres co kołysanie tempa, muzyka-pijana.ts), a zawodnicy zjeżdżają po drogach w stronę
 * przechyłu, coraz mocniej (`--poziom` 0..1). Położenia są zamrożone z chwili wejścia: nikt nie dojeżdża do
 * szklanki, nawet gdy ostatni krok serii dotrze później. Na koniec szklanka wybucha, a nagłówek, zawodnicy
 * i drogi odlatują. Położenia liczy pętla klatek, nie React, więc odświeżanie stanu niczego nie zrywa.
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
  const [telewizor] = useState(czyTelewizor);

  // Wybuch: na komputerze w wideo pękającej szklanki (`WYBUCH_S` klipu), na telewizorze bez wideo dokładnie
  // `WYBUCH_PRZED_S` przed końcem fazy; na komputerze też bez wideo, gdy klip nie ruszył (sieć, odmowa)
  const [wybuchKlipu, ustawWybuchKlipu] = useState(false);
  const czasWybuchu = do_ - WYBUCH_PRZED_S * 1000;
  // bez górnej granicy: po końcu fazy wybuch trwa, aż przyjdą werble (inaczej nagłówek i drogi wracały na chwilę)
  const bezWideo = !wybuchKlipu && teraz >= czasWybuchu + (telewizor ? 0 : 800);
  const wybuch = wybuchKlipu || bezWideo;


  // pętla klatek czyta zawsze najnowsze dane, a nie startuje od nowa przy każdym odświeżeniu stanu
  const dane = useRef({ gracze, od, do_, przesuniecie, wybuch });
  useEffect(() => {
    dane.current = { gracze, od, do_, przesuniecie, wybuch };
  });
  const elementy = useRef(new Map<string, HTMLDivElement>());
  const plansza = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // położenia z chwili wejścia, zamrożone (nowy gracz dostaje swoje przy pierwszym pojawieniu się)
    const poczatki = new Map<string, number>();
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
      const poziom = ograniczone((teraz - od) / Math.max(1, do_ - od));
      const lista = drogi(gracze.length);
      // bujanie w rytm kołysania muzyki: przechył w prawo, zawodnicy zjeżdżają w prawo (i na odwrót)
      const fala = ruch ? Math.sin((2 * Math.PI * (teraz - od)) / (OKRES_KOLYSANIA_S * 1000)) : 0;
      const przechyl = (BUJANIE_DEG.od + (BUJANIE_DEG.do - BUJANIE_DEG.od) * poziom) * fala;
      const zjazd = (ZJEZDZANIE.od + (ZJEZDZANIE.do - ZJEZDZANIE.od) * poziom) * fala;
      if (plansza.current && !wybuch) {
        plansza.current.style.transform = `rotate(${przechyl}deg) translateY(${Math.abs(fala) * 6 * poziom}px)`;
      }

      gracze.forEach((g, i) => {
        const el = elementy.current.get(g.nick);
        if (!el) return;
        if (!poczatki.has(g.nick)) poczatki.set(g.nick, g.start);
        const start = poczatki.get(g.nick) ?? g.start;
        let p: { x: number; y: number };
        if (ruch && wybuch) {
          let o = odloty.get(g.nick);
          if (!o) {
            const s = ostatnie.get(g.nick) ?? punktNaDrodze(lista[i], start);
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
        } else {
          p = punktNaDrodze(lista[i], ograniczone(start + zjazd));
        }
        ostatnie.set(g.nick, { x: p.x, y: p.y });
        el.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      });
    };
    ustaw();
    const krok = () => {
      ustaw();
      klatka = requestAnimationFrame(krok);
    };
    klatka = requestAnimationFrame(krok);
    return () => cancelAnimationFrame(klatka);
  }, [awatar]);

  // wybuch (z klipu albo bez wideo) urywa muzykę TV (muzyka.tsx); bez wideo huk z pliku (efekty.ts)
  const dzwiek = useDzwiekOdblokowany() && stan.muzyka;
  useEffect(() => {
    if (wybuch) ogloszWybuch();
  }, [wybuch]);
  useEffect(() => {
    if (bezWideo && stan.muzyka) zagraj("wybuch");
  }, [bezWideo, stan.muzyka]);

  // Wideo pękającej szklanki (tylko komputer): leży na całej scenie 1920×1080 (portal do `.scena`, bo plansza się
  // buja), czeka zatrzymane na pierwszej klatce i rusza tak, żeby wybuch w klipie wypadł `WYBUCH_PRZED_S` przed
  // końcem fazy. Plik jest pobierany z wyprzedzeniem (wideo-wybuchu.ts).
  const [scena, ustawScene] = useState<Element | null>(null);
  const wideo = useRef<HTMLVideoElement>(null);
  // `widac`: wideo już gra (pokazujemy je), `gra`: klip przewinął pierwsze klatki, więc chowamy drogi i tło pod nim
  const [widac, ustawWidac] = useState(false);
  const [gra, ustawGra] = useState(false);
  // koniec klipu: piana zostaje na ostatniej klatce, więc zsuwamy obraz w dół, jakby spłynęła z ekranu
  const [splywa, ustawSplywa] = useState(false);
  const przedKoncem = Math.min(WYLEWANIE_S, WYBUCH_PRZED_S + WYBUCH_S);
  const czasWylewania = teraz >= od && do_ - teraz <= przedKoncem * 1000;
  // wideo wchodzi na scenę dopiero, gdy muzyka i tak się urywa (`GASNIECIE_S`): wcześniej uciszało muzykę (25.10)
  const wideoNaScenie = !telewizor && teraz >= od && do_ - teraz <= Math.max(GASNIECIE_S, przedKoncem + 2) * 1000;
  useEffect(() => {
    if (wideo.current) wideo.current.muted = !dzwiek;
  }, [dzwiek, scena, wideoNaScenie]);
  // start klipu; gdy przeglądarka nie pozwoli grać z dźwiękiem, druga próba bez dźwięku (obraz jest ważniejszy)
  useEffect(() => {
    const v = wideo.current;
    if (!czasWylewania || !v || bezWideo) return;
    void v
      .play()
      .catch(() => {
        v.muted = true;
        return v.play();
      })
      .catch(() => undefined);
  }, [czasWylewania, scena, wideoNaScenie, bezWideo]);
  const adresWideo = useWideoWybuchu();

  return (
    <div
      className={`tv-wyscig tv-seria tv-pijany${gra && !bezWideo ? " wylewa" : ""}${wybuch ? " wybuch" : ""}${
        bezWideo ? " bez-wideo" : ""
      }`}
      style={{ "--poziom": poziom } as React.CSSProperties}
      ref={(el) => {
        if (el && !scena) ustawScene(el.closest(".scena"));
      }}
    >
      {scena &&
        wideoNaScenie &&
        !bezWideo &&
        createPortal(
          <video
            ref={wideo}
            className={`pijany-wideo${widac ? " gra" : ""}${splywa ? " splywa" : ""}`}
            src={adresWideo}
            muted
            playsInline
            preload="auto"
            onPlaying={() => ustawWidac(true)}
            onTimeUpdate={(e) => {
              if (!gra && e.currentTarget.currentTime >= 0.2) ustawGra(true);
              if (!wybuchKlipu && e.currentTarget.currentTime >= WYBUCH_S) ustawWybuchKlipu(true);
              const v = e.currentTarget;
              if (!splywa && v.duration && v.duration - v.currentTime <= 1.3) ustawSplywa(true);
            }}
          />,
          scena,
        )}
      {/* nagłówek jak w serii, tylko zegar wariuje coraz bardziej */}
      <NaglowekSerii stan={stan} teraz={teraz} zegar={zegarPijany((teraz - od) / 1000, (do_ - od) / 1000)} />

      <div className="drogi-finalu pijany-plansza" ref={plansza}>
        <PlanszaDrog lista={lista} szklanka={<Szklanka przed={1} teraz={1} doKonca={0} />} />
        {/* wybuch bez wideo: błysk i rozprysk szkła, piwa i piany z miejsca szklanki */}
        {bezWideo && (
          <div className="pijany-odlamki" style={{ left: SZKLANKA_FINALU.x, top: SZKLANKA_FINALU.y }} aria-hidden>
            <span className="pijany-blysk" />
            {ODLAMKI.map((o, i) => (
              <span
                key={i}
                className={`pijany-odlamek ${o.rodzaj}`}
                style={
                  {
                    "--dx": `${o.dx}px`,
                    "--dy": `${o.dy}px`,
                    "--obrot": `${o.obrot}deg`,
                    "--rozmiar": `${o.rozmiar}px`,
                    animationDelay: `${o.opoznienie}s`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}
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
