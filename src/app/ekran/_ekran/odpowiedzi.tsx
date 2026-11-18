"use client";

import { motion, MotionConfig } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Awatar } from "@/components/awatar";
import { sekundy } from "@/lib/czas";
import type { StanSesji, WierszOdpowiedzi, WierszRankingu, ZadanieWidoczne } from "@/lib/gra/typy";
import { OdpowiedziSzacowania } from "./szacowanie";
import { META_FINALU } from "@/lib/gra/final";
import { LITERY, jedenWybor, liczbaCzesci, liczbaZJednostka, ulamek } from "@/lib/zadania";

/**
 * Ile kolumn w ramce, żeby 30 graczy zmieściło się na scenie 1920×1080.
 * Wiersze płyną w dół kolumny (1–5 po lewej, 6–10 obok), jak w tabeli wyników.
 */
/** Od tylu graczy ekran odpowiedzi pokazuje tylko najszybszych dobrych i liczby (18.11, do 70 graczy). */
const DUZA_GRUPA = 36;
const POKAZ_DOBRYCH = 24;

function kolumny(n: number): number {
  // 18.11: do 70 graczy (JOWES), od 37 cztery kolumny
  return n <= 5 ? 1 : n <= 12 ? 2 : n <= 36 ? 3 : 4;
}

/**
 * Siatka ramki z `n` graczami w `k` kolumnach. Kolumny liczy się od wszystkich odpowiedzi naraz, żeby małe ramki
 * („Częściowo” 2, „Źle” 2) nie zajmowały po kilka wierszy w jednej kolumnie (25.10: przy 13 graczach nie mieściło się).
 */
function siatka(n: number, k = kolumny(n)): CSSProperties {
  return {
    gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${Math.ceil(n / k)}, auto)`,
  };
}

/**
 * Czy gracz `j` z `n` stoi na dole swojej kolumny (siatka idzie kolumnami po `ceil(n / k)` wierszy): tam bez kreski
 * pod spodem, bo niczego już nie oddziela (27.10: w dwóch kolumnach kreska zostawała pod ostatnim z pierwszej).
 */
const naDoleKolumny = (j: number, n: number, k: number) => (j + 1) % Math.ceil(n / k) === 0 || j === n - 1;

/** Wiersz pojawia się z małym opóźnieniem po poprzednim. */
const wjazd = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.25 + i * 0.06, duration: 0.35 },
});

type PropsWiersza = {
  o: WierszOdpowiedzi;
  i: number;
  nr?: number;
  z: ZadanieWidoczne | null;
  /** Ostatni w swojej kolumnie: bez kreski pod spodem. */
  naDole: boolean;
};

/** Co gracz odpowiedział: litera i tekst (jedna odpowiedź), litery (kilka) albo ułamek „3/4”. */
function Odpowiedz({ o, z }: { o: WierszOdpowiedzi; z: ZadanieWidoczne | null }) {
  if (!o.dane) return <span className="tv-odpowiedzi-tekst tv-odpowiedzi-bez">brak odpowiedzi</span>;
  if (!z) return null;
  const idx = o.dane.odpowiedz;
  if (jedenWybor(z.typ) && idx !== undefined) {
    return (
      <>
        {z.typ === "wybor" && <span className="tv-odpowiedzi-litera">{LITERY[idx]}</span>}
        <span className="tv-odpowiedzi-tekst">{z.dane.odpowiedzi?.[idx]}</span>
      </>
    );
  }
  if (z.typ === "szacowanie" && o.dane.liczba !== undefined) {
    return (
      <>
        <span className="tv-odpowiedzi-tekst">{liczbaZJednostka(o.dane.liczba, z.dane.jednostka)}</span>
        {o.punkty ? <span className="tv-odpowiedzi-tekst">+{o.punkty}</span> : null}
      </>
    );
  }
  const wybrane = z.typ === "wielokrotny" ? (o.dane.odpowiedzi ?? []) : null;
  const dobre = Array.isArray(z.dane.poprawna) ? z.dane.poprawna : [];
  return (
    <>
      {/* kilka dobrych: trafione litery na zielono, błędne na czerwono (27.10: inaczej nie było widać, co było źle) */}
      {wybrane?.map((j) => (
        <span key={j} className={`tv-odpowiedzi-litera ${dobre.includes(j) ? "trafiona" : "bledna"}`}>
          {LITERY[j]}
        </span>
      ))}
      {z.typ !== "wielokrotny" && (
        <span className="tv-odpowiedzi-tekst">{ulamek(o.ocena ?? 0, liczbaCzesci(z.typ, z.dane))}</span>
      )}
      {o.punkty ? <span className="tv-odpowiedzi-tekst">+{o.punkty}</span> : null}
    </>
  );
}

/**
 * Dobra odpowiedź nad ramkami przy kilku dobrych, kolejności i parach (27.10, Łukasz: prowadzący szybko przeklikuje
 * wynik, a na liście graczy nie było widać, co było dobrze). Przy jednej dobrej niepotrzebna: jest w ramce „Dobrze”.
 */
function DobraOdpowiedz({ z }: { z: ZadanieWidoczne }) {
  const p = z.dane.poprawna;
  if (!Array.isArray(p) || jedenWybor(z.typ)) return null;
  const czesci =
    z.typ === "wielokrotny"
      ? p.map((i) => (
          <span key={i} className="tv-odpowiedzi-dobra-czesc">
            <span className="tv-odpowiedzi-litera trafiona">{LITERY[i]}</span>
            {z.dane.odpowiedzi?.[i]}
          </span>
        ))
      : z.typ === "kolejnosc"
        ? p.map((i, k) => (
            <span key={i} className="tv-odpowiedzi-dobra-czesc">
              <span className="tv-odpowiedzi-litera trafiona">{k + 1}</span>
              {z.dane.elementy?.[i]}
            </span>
          ))
        : z.typ === "pary"
          ? (z.dane.lewe ?? []).map((l, i) => (
              <span key={i} className="tv-odpowiedzi-dobra-czesc">
                {l} – {z.dane.prawe?.[p[i]]}
              </span>
            ))
          : null;
  if (!czesci) return null;
  return (
    <p className="tv-odpowiedzi-dobra">
      <span className="tv-odpowiedzi-dobra-etykieta">
        {z.typ === "wielokrotny" ? "Dobre" : z.typ === "kolejnosc" ? "Kolejność" : "Pary"}
      </span>
      {czesci}
    </p>
  );
}

function Wiersz({ o, i, nr, z, naDole }: PropsWiersza) {
  // dobre odpowiedzi są wszystkie takie same (dobra jest już na ekranie wyniku): bez kolumny odpowiedzi
  const bezOdpowiedzi = o.poprawna === true;
  return (
    <motion.li
      className={`tv-odpowiedzi-wiersz${bezOdpowiedzi ? " bez-odp" : ""}${naDole ? " na-dole" : ""}`}
      {...wjazd(i)}
    >
      <span className="tv-odpowiedzi-nr">{nr ? `${nr}.` : ""}</span>
      <span className="tv-odpowiedzi-nick">
        <Awatar nick={o.nick} zdjecie={o.zdjecie} rozmiar={38} />
        <span>{o.nick}</span>
      </span>
      {!bezOdpowiedzi && (
        <span className="tv-odpowiedzi-odp">
          <Odpowiedz o={o} z={z} />
        </span>
      )}
      <span className="tv-odpowiedzi-czas">{o.czas_ms !== null ? sekundy(o.czas_ms) : ""}</span>
    </motion.li>
  );
}

/**
 * Odpowiedzi na pytanie: w zielonej ramce dobre (od najszybszej, z numerem),
 * w żółtej częściowo dobre (nowe typy pytań), w czerwonej złe i na końcu bez odpowiedzi.
 * Przy każdym odpowiedź i czas.
 */
export function OdpowiedziTv({ stan, odpowiedzi }: { stan: StanSesji; odpowiedzi: WierszOdpowiedzi[] }) {
  const z = stan.zadanie;
  const dobre = odpowiedzi.filter((o) => o.poprawna === true);
  const czesciowo = odpowiedzi.filter((o) => o.poprawna === false && (o.ocena ?? 0) > 0);
  // brak odpowiedzi też w czerwonej ramce, na końcu (baza zwraca ich po odpowiedziach)
  const zle = odpowiedzi.filter((o) => o.poprawna === null || (o.poprawna === false && !((o.ocena ?? 0) > 0)));
  // duża grupa (18.11, do 70 graczy): nicków nie da się przeczytać, więc w „Dobrze” najszybsi z dopiskiem
  // „i jeszcze N”, a „Częściowo” i „Źle” same liczby
  const duzo = odpowiedzi.length > DUZA_GRUPA;
  const dobrePokaz = duzo ? dobre.slice(0, POKAZ_DOBRYCH) : dobre;
  // wspólna liczba kolumn dla wszystkich ramek i zagęszczenie: z liczby graczy, a gdy i tak się nie mieści, gęściej
  const k = duzo ? 3 : kolumny(odpowiedzi.length);
  const ekran = useRef<HTMLDivElement>(null);
  const [ciasno, ustawCiasno] = useState({ n: odpowiedzi.length, o: 0 });
  const o = ciasno.n === odpowiedzi.length ? ciasno.o : 0;
  const stopien = Math.min(2, (odpowiedzi.length > 16 ? 1 : 0) + o);
  useLayoutEffect(() => {
    const el = ekran.current;
    if (!el || stopien >= 2) return;
    if (el.scrollHeight > el.clientHeight + 1) ustawCiasno({ n: odpowiedzi.length, o: o + 1 });
  }, [odpowiedzi.length, stopien, o]);

  // szacowanie: oś z graczami wokół poprawnej liczby zamiast ramek dobrze / częściowo / źle
  if (z?.typ === "szacowanie") {
    return (
      <MotionConfig reducedMotion="user">
        <div className="tv-odpowiedzi">
          <header className="tv-ranking-gora tv-odpowiedzi-gora">
            <h1>{z.tresc}</h1>
            <p className="tv-okazja">Pytanie {z.lp}</p>
          </header>
          <OdpowiedziSzacowania z={z} odpowiedzi={odpowiedzi} />
          {z.dane.wyjasnienie && <p className="tv-wyjasnienie">{z.dane.wyjasnienie}</p>}
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ekran} className={`tv-odpowiedzi${stopien >= 1 ? " gesto" : ""}${stopien >= 2 ? " bardzo-gesto" : ""}`}>
        <header className="tv-ranking-gora tv-odpowiedzi-gora">
          <h1>{z?.tresc ?? "Odpowiedzi"}</h1>
          {z && <p className="tv-okazja">Pytanie {z.lp}</p>}
        </header>
        {z && <DobraOdpowiedz z={z} />}
        {/* wyjaśnienie poprawnej odpowiedzi (`dane.wyjasnienie`, 18.11): tu, a nie na ekranie wyniku, gdzie przy długim
            pytaniu z wieloma odpowiedziami brakowało miejsca */}
        {z?.dane.wyjasnienie && <p className="tv-wyjasnienie">{z.dane.wyjasnienie}</p>}

        <section className="tv-odpowiedzi-ramka dobrze">
          <p className="tv-odpowiedzi-etykieta">
            Dobrze <span>{dobre.length}</span>
          </p>
          {dobre.length === 0 ? (
            <p className="tv-odpowiedzi-pusto">Nikt nie odpowiedział dobrze.</p>
          ) : (
            <ol className="tv-odpowiedzi-lista" style={siatka(dobrePokaz.length, k)}>
              {dobrePokaz.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={i} nr={i + 1} z={z} naDole={naDoleKolumny(i, dobrePokaz.length, k)} />
              ))}
            </ol>
          )}
          {dobre.length > dobrePokaz.length && (
            <p className="tv-odpowiedzi-pusto">i jeszcze {dobre.length - dobrePokaz.length}</p>
          )}
        </section>

        {czesciowo.length > 0 && (
          <section className="tv-odpowiedzi-ramka czesciowo">
            <p className="tv-odpowiedzi-etykieta">
              Częściowo <span>{czesciowo.length}</span>
            </p>
            {!duzo && <ul className="tv-odpowiedzi-lista" style={siatka(czesciowo.length, k)}>
              {czesciowo.map((o, i) => (
                <Wiersz
                  key={o.nick}
                  o={o}
                  i={dobre.length + i}
                  z={z}
                  naDole={naDoleKolumny(i, czesciowo.length, k)}
                />
              ))}
            </ul>}
          </section>
        )}

        {zle.length > 0 && (
          <section className="tv-odpowiedzi-ramka zle">
            <p className="tv-odpowiedzi-etykieta">
              Źle <span>{zle.length}</span>
            </p>
            {!duzo && <ul className="tv-odpowiedzi-lista" style={siatka(zle.length, k)}>
              {zle.map((o, i) => (
                <Wiersz
                  key={o.nick}
                  o={o}
                  i={dobre.length + czesciowo.length + i}
                  z={z}
                  naDole={naDoleKolumny(i, zle.length, k)}
                />
              ))}
            </ul>}
          </section>
        )}
      </div>
    </MotionConfig>
  );
}

/** Pełna tabela wyników po grze: wszyscy gracze z miejscem i punktami. */
export function TabelaTv({
  stan,
  ranking,
  strona = 0,
  stron = 1,
}: {
  stan: StanSesji;
  ranking: WierszRankingu[];
  /** Duża grupa: która strona tabeli (po 30 graczy, KoniecNaZmiane w tv.tsx) i ile ich jest. */
  strona?: number;
  stron?: number;
}) {
  const wszystkie = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  const naStronie = Math.ceil(wszystkie.length / stron);
  const wiersze = wszystkie.slice(strona * naStronie, (strona + 1) * naStronie);
  const n = wiersze.length;
  const k = n <= 10 ? 1 : n <= 20 ? 2 : 3;
  const druzyny = stan.tryb === "druzyny";

  return (
    <MotionConfig reducedMotion="user">
      <div className={`tv-tabela${n > 20 ? " gesto" : ""}`}>
        <header className="tv-ranking-gora">
          <h1>Tabela wyników</h1>
          <p className="tv-okazja">
            {stron > 1 ? `${strona + 1}/${stron} · ` : ""}
            {stan.quiz?.tytul}
          </p>
        </header>
        {wiersze.length === 0 ? (
          <p className="tv-zacheta">Nikt nie grał.</p>
        ) : (
          <ol
            className="tv-tabela-lista"
            style={{
              gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${Math.ceil(wiersze.length / k)}, auto)`,
            }}
            aria-label={druzyny ? "Drużyny" : "Gracze"}
          >
            {wiersze.map((w, i) => (
              <motion.li
                key={w.nick}
                className={`tv-tabela-wiersz${w.miejsce === 1 ? " lider" : ""}${w.final ? " finalista" : ""}`}
                {...wjazd(i)}
              >
                <span className="tv-ranking-miejsce">{w.miejsce}.</span>
                <span className="tv-ranking-nick">
                  <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={44} />
                  <span>{w.nick}</span>
                </span>
                {/* finalista: przebieg finału przed punktami, bo o miejscu zdecydował wyścig (28.10) */}
                {w.final && (
                  <span className="tv-tabela-final" aria-label="Finał">
                    {w.final.start > 0 && <span className="start">start +{w.final.start}</span>}
                    <span className="dobre">✓ {w.final.dobre}</span>
                    <span className="zle">✗ {w.final.zle}</span>
                    <span className="kroki">
                      {Math.min(META_FINALU, Math.round(w.final.kroki))}/{META_FINALU}
                    </span>
                  </span>
                )}
                <span className="tv-ranking-punkty">{w.punkty.toLocaleString("pl-PL")}</span>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </MotionConfig>
  );
}
