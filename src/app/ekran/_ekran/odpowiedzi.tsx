"use client";

import { motion, MotionConfig } from "motion/react";
import { useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { Awatar } from "@/components/awatar";
import { sekundy } from "@/lib/czas";
import type { StanSesji, WierszOdpowiedzi, WierszRankingu, ZadanieWidoczne } from "@/lib/gra/typy";
import { OdpowiedziSzacowania } from "./szacowanie";
import { LITERY, jedenWybor, liczbaCzesci, liczbaZJednostka, ulamek } from "@/lib/zadania";
import { LogoNaglowka } from "./logo";

/**
 * Ile kolumn w ramce, żeby 30 graczy zmieściło się na scenie 1920×1080.
 * Wiersze płyną w dół kolumny (1–5 po lewej, 6–10 obok), jak w tabeli wyników.
 */
function kolumny(n: number): number {
  return n <= 5 ? 1 : n <= 12 ? 2 : 3;
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
  return (
    <>
      {wybrane?.map((j) => (
        <span key={j} className="tv-odpowiedzi-litera">
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

function Wiersz({ o, i, nr, z }: PropsWiersza) {
  return (
    <motion.li className="tv-odpowiedzi-wiersz" {...wjazd(i)}>
      <span className="tv-odpowiedzi-nr">{nr ? `${nr}.` : ""}</span>
      <span className="tv-odpowiedzi-nick">
        <Awatar nick={o.nick} zdjecie={o.zdjecie} rozmiar={38} />
        <span>{o.nick}</span>
      </span>
      <span className="tv-odpowiedzi-odp">
        <Odpowiedz o={o} z={z} />
      </span>
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
  // wspólna liczba kolumn dla wszystkich ramek i zagęszczenie: z liczby graczy, a gdy i tak się nie mieści, gęściej
  const k = kolumny(odpowiedzi.length);
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
            <p className="tv-okazja">
              Pytanie {z.lp}
            </p>
            <LogoNaglowka />
          </header>
          <OdpowiedziSzacowania z={z} odpowiedzi={odpowiedzi} />
        </div>
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div ref={ekran} className={`tv-odpowiedzi${stopien >= 1 ? " gesto" : ""}${stopien >= 2 ? " bardzo-gesto" : ""}`}>
        <header className="tv-ranking-gora tv-odpowiedzi-gora">
          <h1>{z?.tresc ?? "Odpowiedzi"}</h1>
          {z && (
            <p className="tv-okazja">
              Pytanie {z.lp}
            </p>
          )}
          <LogoNaglowka />
        </header>

        <section className="tv-odpowiedzi-ramka dobrze">
          <p className="tv-odpowiedzi-etykieta">
            Dobrze <span>{dobre.length}</span>
          </p>
          {dobre.length === 0 ? (
            <p className="tv-odpowiedzi-pusto">Nikt nie trafił.</p>
          ) : (
            <ol className="tv-odpowiedzi-lista" style={siatka(dobre.length, k)}>
              {dobre.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={i} nr={i + 1} z={z} />
              ))}
            </ol>
          )}
        </section>

        {czesciowo.length > 0 && (
          <section className="tv-odpowiedzi-ramka czesciowo">
            <p className="tv-odpowiedzi-etykieta">
              Częściowo <span>{czesciowo.length}</span>
            </p>
            <ul className="tv-odpowiedzi-lista" style={siatka(czesciowo.length, k)}>
              {czesciowo.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={dobre.length + i} z={z} />
              ))}
            </ul>
          </section>
        )}

        {zle.length > 0 && (
          <section className="tv-odpowiedzi-ramka zle">
            <p className="tv-odpowiedzi-etykieta">
              Źle <span>{zle.length}</span>
            </p>
            <ul className="tv-odpowiedzi-lista" style={siatka(zle.length, k)}>
              {zle.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={dobre.length + czesciowo.length + i} z={z} />
              ))}
            </ul>
          </section>
        )}
      </div>
    </MotionConfig>
  );
}

/** Pełna tabela wyników po grze: wszyscy gracze z miejscem i punktami. */
export function TabelaTv({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const wiersze = [...ranking].sort((a, b) => a.miejsce - b.miejsce || a.nick.localeCompare(b.nick, "pl"));
  const k = wiersze.length <= 10 ? 1 : wiersze.length <= 20 ? 2 : 3;
  const druzyny = stan.tryb === "druzyny";

  return (
    <MotionConfig reducedMotion="user">
      <div className={`tv-tabela${wiersze.length > 20 ? " gesto" : ""}`}>
        <header className="tv-ranking-gora">
          <h1>Tabela wyników</h1>
          <p className="tv-okazja">{stan.quiz?.tytul}</p>
          <LogoNaglowka />
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
              <motion.li key={w.nick} className={`tv-tabela-wiersz${w.miejsce === 1 ? " lider" : ""}`} {...wjazd(i)}>
                <span className="tv-ranking-miejsce">{w.miejsce}.</span>
                <span className="tv-ranking-nick">
                  <Awatar nick={w.nick} zdjecie={w.zdjecie} rozmiar={44} />
                  <span>{w.nick}</span>
                </span>
                <span className="tv-ranking-punkty">{w.punkty.toLocaleString("pl-PL")}</span>
              </motion.li>
            ))}
          </ol>
        )}
      </div>
    </MotionConfig>
  );
}
