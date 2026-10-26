"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { ogloszWybuch, useDzwiekOdblokowany } from "@/lib/gra/dzwiek";
import { zagraj } from "@/lib/gra/efekty";
import { OKRES_KOLYSANIA_S } from "@/lib/gra/muzyka-pijana";
import { czyTelewizor } from "@/lib/gra/telewizor";
import type { StanSesji } from "@/lib/gra/typy";
import { GASNIECIE_S, WYBUCH_PRZED_S, WYBUCH_S, WYLEWANIE_S, startZegaraPijanego, zegarPijany } from "@/lib/pijany";
import { DROGA_PRZED_META, KROK_FINALU } from "@/lib/gra/final";
import { useWideoWybuchu } from "./wideo-wybuchu";
import { FPS, OD_S, useKlatkiWybuchu } from "./klatki-wybuchu";
import { awatarNaDrogach, drogi, type Droga, PlanszaDrog, punktNaDrodze, SZKLANKA_FINALU } from "./drogi";
import { NaglowekSerii } from "./seria";
import { Szklanka } from "./wyscig";

/**
 * Gracz na TV w pijanym finale: `start` to położenie na drodze (0..1), na którym skończyła się seria,
 * `lider` jak w serii (złota obwódka), żeby przejście niczym się nie zdradziło.
 */
export type GraczPijany = { nick: string; zdjecie: string | null; start: number; lider: boolean };

/** Prędkość odlotu awatarów od wybuchu szklanki w px/s. */
const ODLOT = 1700;
/**
 * Gdzie na scenie 16:9 leży plansza dróg (px): klip wybuchu 1920×1080 jest ułożony pod tę scenę, więc przypięty
 * do planszy przesuwa się o tyle w lewo i w górę, a jego szklanka trafia w naszą na każdym kształcie ekranu.
 */
const WIDEO_NA_PLANSZY = { x: 80, y: 199 };
/** Zjeżdżanie po drodze (część drogi) na początku i pod koniec fazy. */
const ZJEZDZANIE = { od: 0, do: 0.06 };

/** Każda droga buja się osobno (stopnie, na początku i pod koniec fazy), we własnym, nieregularnym rytmie. */
const BUJANIE_DROGI_DEG = { od: 0, do: 2.8 };
/** Pozorowany wyścig: wszyscy zaczynają tam, gdzie skończyła się seria, potem co 3–5 s krok naprzód albo w tył. */
const PIERWSZY_KROK_S = 4;
/** Szansa na krok naprzód (reszta to krok w tył), w procentach. */
const NAPRZOD_PROC = 58;
/** Jak szybko awatar dojeżdża do nowego położenia (na sekundę): płynnie, bez skoków. */
const DOJAZD = 3;

type Lot = { x: number; y: number; vx: number; vy: number };

/** Liczba z napisu, zawsze ta sama (FNV-1a): kroki są „losowe”, ale po odświeżeniu TV wychodzą tak samo. */
function skrot(t: string): number {
  let h = 2166136261;
  for (let i = 0; i < t.length; i++) {
    h ^= t.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Położenie gracza w pijanym finale (0..1): pijany finał udaje dalszy wyścig (26.10, Łukasz). Odpowiedzi dogrywki nie
 * trafiają do bazy, więc kroki są pseudolosowe z nicku i czasu, każdy w swoim rytmie; nikt nie dobiega do szklanki.
 * `t`: sekundy od początku fazy, `koniecKrokow`: od tej sekundy (telefony gasną) nikt się już nie rusza.
 */
function polozeniePijane(nick: string, start: number, t: number, koniecKrokow: number): number {
  const min = 0.04;
  const max = DROGA_PRZED_META;
  let p = start;
  const h = skrot(nick);
  const okres = 3 + (h % 21) / 10;
  const ile = Math.floor((Math.min(t, koniecKrokow) - PIERWSZY_KROK_S - (h % 10) / 10) / okres) + 1;
  for (let k = 0; k < ile; k++) {
    p += (skrot(`${nick}:${k}`) % 100 < NAPRZOD_PROC ? 1 : -1) * KROK_FINALU;
    p = Math.max(min, Math.min(max, p));
  }
  return p;
}

const ograniczone = (x: number) => Math.min(1, Math.max(0, x));

/** Punkt na drodze obróconej o `kat` stopni wokół jej środka (tak samo jak `rotate` drogi w CSS). */
function naBujajacejDrodze(d: Droga, u: number, kat: number): { x: number; y: number } {
  const p = punktNaDrodze(d, u);
  if (!kat) return p;
  const cx = (d.od.x + d.do.x) / 2;
  const cy = (d.od.y + d.do.y) / 2;
  const r = (kat * Math.PI) / 180;
  const dx = p.x - cx;
  const dy = p.y - cy;
  return { x: cx + dx * Math.cos(r) - dy * Math.sin(r), y: cy + dx * Math.sin(r) + dy * Math.cos(r) };
}

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
 * przechyłu, coraz mocniej (`--poziom` 0..1). Wyścig udaje, że trwa: od położeń z chwili wejścia (zamrożonych,
 * ostatni krok serii, który dotrze później, nic nie zmienia) wszyscy zaczynają tam, gdzie
 * skończyli (płynne przejście), a potem idą pseudolosowo krok naprzód albo w tył (`polozeniePijane`); nikt nie dobiega do szklanki. Na koniec szklanka wybucha, a nagłówek, zawodnicy
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

  // Wybuch: na komputerze w wideo pękającej szklanki (`WYBUCH_S` klipu), na telewizorze z klatek tego klipu na
  // <canvas> (klatki-wybuchu.ts), dokładnie `WYBUCH_PRZED_S` przed końcem fazy. Bez klatek (nie wczytały się) i na
  // komputerze, gdy klip nie ruszył (sieć, odmowa), wybuch z samego CSS (odłamki)
  const [wybuchKlipu, ustawWybuchKlipu] = useState(false);
  const czasWybuchu = do_ - WYBUCH_PRZED_S * 1000;
  const klatki = useKlatkiWybuchu(telewizor);
  const zKlatek = telewizor && !!klatki;
  // klatki zaczynają się od `OD_S` klipu, tak żeby wybuch w klipie (`WYBUCH_S`) wypadł w `czasWybuchu`
  const startKlatek = czasWybuchu - (WYBUCH_S - OD_S) * 1000;
  const klatkiGraja = zKlatek && teraz >= startKlatek;
  const wybuchKlatek = zKlatek && teraz >= czasWybuchu;
  // bez górnej granicy: po końcu fazy wybuch trwa, aż przyjdą werble (inaczej nagłówek i drogi wracały na chwilę)
  const bezWideo = !wybuchKlipu && !zKlatek && teraz >= czasWybuchu + (telewizor ? 0 : 800);
  const wybuch = wybuchKlipu || bezWideo || wybuchKlatek;
  // huk z pliku (efekty.ts) tam, gdzie nie gra dźwięk wideo
  const hukZPliku = bezWideo || wybuchKlatek;


  // pętla klatek czyta zawsze najnowsze dane, a nie startuje od nowa przy każdym odświeżeniu stanu
  const dane = useRef({ gracze, od, do_, przesuniecie, wybuch });
  useEffect(() => {
    dane.current = { gracze, od, do_, przesuniecie, wybuch };
  });
  const elementy = useRef(new Map<string, HTMLDivElement>());
  const plansza = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const ruch = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // położenia z chwili wejścia, zamrożone (nowy gracz dostaje swoje przy pierwszym pojawieniu się), i to, co
    // widać teraz (dojeżdża płynnie do pozorowanego wyścigu)
    const poczatki = new Map<string, number>();
    const widac = new Map<string, number>();
    // wybuch: każdy odlatuje od szklanki z miejsca, w którym był w tej chwili
    const ostatnie = new Map<string, { x: number; y: number }>();
    const odloty = new Map<string, Lot>();
    let ostatnieKaty: number[] = [];
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
      // każda droga buja się osobno i nieregularnie wokół swojego środka (dwie fale o różnych okresach), a plansza
      // i szklanka stoją (26.10: kołysząca się szklanka dublowała się z pierwszą klatką wideo wybuchu). Przechył
      // w prawo: zawodnik zjeżdża w stronę szklanki (i na odwrót). W wybuchu droga zostaje, jak była, i odlatuje
      const pasy = plansza.current?.querySelectorAll<SVGGElement>(".drogi-finalu-pas");
      const fale = lista.map((_, i) => {
        if (!ruch) return 0;
        const t = (teraz - od) / 1000;
        const wolna = Math.sin((2 * Math.PI * t) / (OKRES_KOLYSANIA_S - 2 + ((i * 2.3) % 4)) + i * 2.1);
        const szybka = Math.sin((2 * Math.PI * t) / (2.9 + ((i * 1.3) % 2)) + i * 4.7);
        return 0.7 * wolna + 0.3 * szybka;
      });
      const katy = fale.map((f, i) => {
        const kat = (BUJANIE_DROGI_DEG.od + (BUJANIE_DROGI_DEG.do - BUJANIE_DROGI_DEG.od) * poziom) * f;
        if (!wybuch && pasy?.[i]) pasy[i].style.rotate = `${kat}deg`;
        return kat;
      });
      if (!wybuch) ostatnieKaty = katy;
      const zjazd = (i: number) => (ZJEZDZANIE.od + (ZJEZDZANIE.do - ZJEZDZANIE.od) * poziom) * (fale[i] ?? 0);

      gracze.forEach((g, i) => {
        const el = elementy.current.get(g.nick);
        if (!el) return;
        if (!poczatki.has(g.nick)) poczatki.set(g.nick, g.start);
        const start = poczatki.get(g.nick) ?? g.start;
        let p: { x: number; y: number };
        if (ruch && wybuch) {
          let o = odloty.get(g.nick);
          if (!o) {
            const s = ostatnie.get(g.nick) ?? naBujajacejDrodze(lista[i], start, ostatnieKaty[i] ?? 0);
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
          const t = (teraz - od) / 1000;
          const cel = polozeniePijane(g.nick, start, t, (do_ - od) / 1000 - GASNIECIE_S);
          const obecne = widac.get(g.nick) ?? start;
          const nowe = ruch ? obecne + (cel - obecne) * (1 - Math.exp(-DOJAZD * dt)) : cel;
          widac.set(g.nick, nowe);
          p = naBujajacejDrodze(
            lista[i],
            // zjeżdżanie też nie dowozi lidera do szklanki
            ograniczone(Math.min(DROGA_PRZED_META + 0.02, nowe + zjazd(i))),
            ostatnieKaty[i] ?? 0,
          );
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
    if (hukZPliku && stan.muzyka) zagraj("wybuch");
  }, [hukZPliku, stan.muzyka]);

  // Wideo pękającej szklanki (tylko komputer): klip 1920×1080 przypięty do planszy dróg (`WIDEO_NA_PLANSZY`), więc
  // jego szklanka leży zawsze na naszej, także na ekranie innym niż 16:9; plansza i szklanka się nie bujają (26.10).
  // Czeka zatrzymane na pierwszej klatce i rusza tak, żeby wybuch w klipie wypadł `WYBUCH_PRZED_S` przed końcem
  // fazy. Plik jest pobierany z wyprzedzeniem (wideo-wybuchu.ts).
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
  }, [dzwiek, wideoNaScenie]);
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
  }, [czasWylewania, wideoNaScenie, bezWideo]);
  const adresWideo = useWideoWybuchu();

  return (
    <div
      className={`tv-wyscig tv-seria tv-pijany${(gra && !bezWideo) || klatkiGraja ? " wylewa" : ""}${wybuch ? " wybuch" : ""}${
        bezWideo ? " bez-wideo" : ""
      }`}
      style={{ "--poziom": poziom } as React.CSSProperties}
    >
      {/* nagłówek jak w serii, tylko zegar wariuje coraz bardziej */}
      <NaglowekSerii stan={stan} teraz={teraz} zegar={zegarPijany((teraz - od) / 1000, (do_ - od) / 1000, startZegaraPijanego(stan))} />

      <div className="drogi-finalu pijany-plansza" ref={plansza}>
        {wideoNaScenie && !bezWideo && (
          <video
            style={{ left: -WIDEO_NA_PLANSZY.x, top: -WIDEO_NA_PLANSZY.y }}
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
          />
        )}
        {klatkiGraja && klatki && (
          <KlatkiWybuchu klatki={klatki} start={startKlatek} przesuniecie={przesuniecie} />
        )}
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

/**
 * Wybuch na telewizorze: klatki klipu po kolei na <canvas> w miejscu wideo (Samsung nie pokazuje <video> nad
 * treścią). Numer klatki z zegara serwera, więc po przeładowaniu TV klip jest w tym samym miejscu. Ostatnie 0,6 s
 * klipu gaśnie.
 */
function KlatkiWybuchu({
  klatki,
  start,
  przesuniecie,
}: {
  klatki: HTMLImageElement[];
  start: number;
  przesuniecie: number;
}) {
  const plotno = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = plotno.current?.getContext("2d");
    if (!c) return;
    const { width, height } = c.canvas;
    let ostatnia = -1;
    let klatka = 0;
    const rysuj = () => {
      const i = Math.floor(((Date.now() + przesuniecie - start) / 1000) * FPS);
      if (i !== ostatnia) {
        ostatnia = i;
        c.clearRect(0, 0, width, height);
        if (i >= 0 && i < klatki.length) {
          c.globalAlpha = Math.min(1, (klatki.length - i) / (FPS * 0.6));
          c.drawImage(klatki[i], 0, 0, width, height);
        }
      }
      if (i < klatki.length) klatka = requestAnimationFrame(rysuj);
    };
    klatka = requestAnimationFrame(rysuj);
    return () => cancelAnimationFrame(klatka);
  }, [klatki, start, przesuniecie]);
  // płótno w rozmiarze klatek, rozciągnięte CSS-em na całą scenę 16:9 (jak wideo, .pijany-wideo)
  return (
    <canvas
      ref={plotno}
      width={960}
      height={540}
      className="pijany-wideo gra"
      style={{ left: -WIDEO_NA_PLANSZY.x, top: -WIDEO_NA_PLANSZY.y }}
      aria-hidden
    />
  );
}
