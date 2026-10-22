"use client";

import { motion, MotionConfig } from "motion/react";
import type { CSSProperties } from "react";
import { Awatar } from "@/components/awatar";
import { sekundy } from "@/lib/gra/nasluch";
import type { StanSesji, WierszOdpowiedzi, WierszRankingu } from "@/lib/gra/typy";

const LITERY = "ABCDEF";

/**
 * Ile kolumn w ramce, żeby 30 graczy zmieściło się na scenie 1920×1080.
 * Wiersze płyną w dół kolumny (1–5 po lewej, 6–10 obok), jak w tabeli wyników.
 */
function kolumny(n: number): number {
  return n <= 5 ? 1 : n <= 12 ? 2 : 3;
}

function siatka(n: number): CSSProperties {
  const k = kolumny(n);
  return { gridTemplateColumns: `repeat(${k}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${Math.ceil(n / k)}, auto)` };
}

/** Wiersz pojawia się z małym opóźnieniem po poprzednim. */
const wjazd = (i: number) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.25 + i * 0.06, duration: 0.35 },
});

type PropsWiersza = { o: WierszOdpowiedzi; i: number; nr?: number; odpowiedzi?: string[] };

function Wiersz({ o, i, nr, odpowiedzi }: PropsWiersza) {
  const idx = o.dane?.odpowiedz;
  return (
    <motion.li className="tv-odpowiedzi-wiersz" {...wjazd(i)}>
      <span className="tv-odpowiedzi-nr">{nr ? `${nr}.` : ""}</span>
      <span className="tv-odpowiedzi-nick">
        <Awatar nick={o.nick} zdjecie={o.zdjecie} rozmiar={38} />
        <span>{o.nick}</span>
      </span>
      <span className="tv-odpowiedzi-odp">
        {idx !== undefined && (
          <>
            <span className="tv-odpowiedzi-litera">{LITERY[idx]}</span>
            <span className="tv-odpowiedzi-tekst">{odpowiedzi?.[idx]}</span>
          </>
        )}
      </span>
      <span className="tv-odpowiedzi-czas">{o.czas_ms !== null ? sekundy(o.czas_ms) : ""}</span>
    </motion.li>
  );
}

/**
 * Odpowiedzi na pytanie: w zielonej ramce dobre (od najszybszej, z numerem),
 * w czerwonej złe, a pod spodem gracze bez odpowiedzi. Przy każdym odpowiedź i czas.
 */
export function OdpowiedziTv({ stan, odpowiedzi }: { stan: StanSesji; odpowiedzi: WierszOdpowiedzi[] }) {
  const z = stan.zadanie;
  const dobre = odpowiedzi.filter((o) => o.poprawna === true);
  const zle = odpowiedzi.filter((o) => o.poprawna === false);
  const brak = odpowiedzi.filter((o) => o.poprawna === null);
  const gesto = odpowiedzi.length > 16;
  const liczba = stan.quiz?.liczba_zadan ?? "?";

  return (
    <MotionConfig reducedMotion="user">
      <div className={`tv-odpowiedzi${gesto ? " gesto" : ""}`}>
        <header className="tv-ranking-gora tv-odpowiedzi-gora">
          <h1>{z?.tresc ?? "Odpowiedzi"}</h1>
          {z && (
            <p className="tv-okazja">
              Pytanie {z.lp}/{liczba}
            </p>
          )}
        </header>

        <section className="tv-odpowiedzi-ramka dobrze">
          <p className="tv-odpowiedzi-etykieta">
            Dobrze <span>{dobre.length}</span>
          </p>
          {dobre.length === 0 ? (
            <p className="tv-odpowiedzi-pusto">Nikt nie trafił.</p>
          ) : (
            <ol className="tv-odpowiedzi-lista" style={siatka(dobre.length)}>
              {dobre.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={i} nr={i + 1} odpowiedzi={z?.dane.odpowiedzi} />
              ))}
            </ol>
          )}
        </section>

        {zle.length > 0 && (
          <section className="tv-odpowiedzi-ramka zle">
            <p className="tv-odpowiedzi-etykieta">
              Źle <span>{zle.length}</span>
            </p>
            <ul className="tv-odpowiedzi-lista" style={siatka(zle.length)}>
              {zle.map((o, i) => (
                <Wiersz key={o.nick} o={o} i={dobre.length + i} odpowiedzi={z?.dane.odpowiedzi} />
              ))}
            </ul>
          </section>
        )}

        {brak.length > 0 && (
          <p className="tv-odpowiedzi-brak">
            Bez odpowiedzi: {brak.map((o) => o.nick).join(", ")}
          </p>
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
                className={`tv-tabela-wiersz${w.miejsce === 1 ? " lider" : ""}`}
                {...wjazd(i)}
              >
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
