"use client";
/* eslint-disable @next/next/no-img-element -- etykiety piw z bucketu Supabase */

import { motion, MotionConfig } from "motion/react";
import type { StanSesji } from "@/lib/gra/typy";
import {
  chmura,
  liczbaOcen,
  napisOceny,
  wynikiSali,
  type KartyPiwa,
  type Licznik,
  type WynikSuwaka,
} from "@/lib/degustacja";
import { opisPiwa, type DanePiwo } from "@/lib/zadania";

/** Piwo z `piwa_degustacji` (podsumowanie). */
export type PiwoDegustacji = { id: string; nr: number; tresc: string; grafika_url: string | null; dane: DanePiwo };

/** Najwięcej słów w chmurze na TV (reszta to pojedyncze głosy, które tylko by tłoczyły ekran). */
const SLOW_W_CHMURZE = 18;
/** Suwaki na TV po „Pokaż wyniki”: smak i odczucie (wszystkie dziewięć się nie mieszczą, reszta jest w raporcie). */
const SUWAKI_NA_TV = ["slodycz", "goryczka", "kwasnosc", "pelnia", "nagazowanie"];

/**
 * Degustacja na TV (02.11, docs/DEGUSTACJA.md). Ocenianie (`pytanie`): piwo, licznik ocen i chmura aromatów, która
 * rośnie na żywo (bez ocen, żeby sala się nie sugerowała). „Co poczuła sala” (`wynik`): średnia, gwiazdki, chmura,
 * suwaki i wady. Koniec: podium piw według średniej.
 */
export function DegustacjaTv({
  stan,
  karty,
  piwa,
  loga,
}: {
  stan: StanSesji;
  karty: KartyPiwa[];
  piwa: PiwoDegustacji[];
  loga: React.ReactNode;
}) {
  const z = stan.zadanie;
  if (!z) return null;
  if (stan.faza === "podium" || stan.faza === "tabela" || stan.faza === "koniec") {
    return <PodiumPiw stan={stan} karty={karty} piwa={piwa} loga={loga} />;
  }
  const kartyPiwa = karty.find((k) => k.zadanie_id === z.id)?.karty ?? [];
  const dane = z.dane as DanePiwo;
  const wynik = stan.faza !== "pytanie";

  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-degustacja">
        <header className="tv-naglowek">
          {loga}
          <p className="tv-etykieta">
            Piwo {z.lp}
            {stan.quiz ? ` z ${stan.quiz.liczba_zadan}` : ""}
          </p>
        </header>
        <div className={`tv-piwo${wynik ? " wynik" : ""}`}>
          <div className="tv-piwo-lewa">
            {z.grafika_url ? (
              <img src={z.grafika_url} alt="" className="tv-piwo-etykieta" />
            ) : (
              <div className="tv-piwo-etykieta pusta" aria-hidden>
                🍺
              </div>
            )}
            <h1 className="tv-piwo-nazwa">{z.tresc}</h1>
            {opisPiwa(dane) && <p className="tv-piwo-opis">{opisPiwa(dane)}</p>}
            {!wynik && dane.historia && <p className="tv-piwo-historia">{dane.historia}</p>}
          </div>
          <div className="tv-piwo-prawa">
            {wynik ? (
              <CoPoczulaSala karty={kartyPiwa} />
            ) : (
              <>
                <p className="tv-piwo-licznik">
                  Oceniło <strong>{stan.liczba_odpowiedzi}</strong>
                  <span> z {stan.w_grze}</span>
                </p>
                <Chmura slowa={chmura(kartyPiwa)} />
              </>
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

/** Słowa wielkością według liczby osób; nowe wpływają, rosnące rosną. */
function Chmura({ slowa, duza = 92 }: { slowa: Licznik[]; duza?: number }) {
  const pokazane = slowa.slice(0, SLOW_W_CHMURZE);
  const max = Math.max(1, ...pokazane.map((s) => s.ile));
  if (!pokazane.length) return <p className="tv-chmura-pusta">Tu pojawi się, co czujecie</p>;
  // największe w środku: układ naprzemienny od najczęstszego
  const ulozone = pokazane.reduce<Licznik[]>((acc, s, i) => (i % 2 ? [s, ...acc] : [...acc, s]), []);
  return (
    <ul className="tv-chmura">
      {ulozone.map((s) => (
        <motion.li
          key={s.klucz}
          layout
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 0.45 + 0.55 * (s.ile / max), scale: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{ fontSize: 34 + (duza - 34) * (s.ile / max) }}
        >
          {s.napis}
        </motion.li>
      ))}
    </ul>
  );
}

function Gwiazdki({ ocena }: { ocena: number }) {
  return (
    <span className="tv-gwiazdki" aria-label={`${napisOceny(ocena)} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="tv-gwiazdka">
          <span className="tlo">★</span>
          <span className="pelna" style={{ width: `${Math.max(0, Math.min(1, ocena - (n - 1))) * 100}%` }}>
            ★
          </span>
        </span>
      ))}
    </span>
  );
}

function CoPoczulaSala({ karty }: { karty: KartyPiwa["karty"] }) {
  const w = wynikiSali(karty);
  const suwaki = w.suwaki.filter((s) => s.ile > 0 && SUWAKI_NA_TV.includes(s.pole));
  return (
    <div className="tv-sala">
      <div className="tv-sala-ocena">
        <p className="tv-sala-srednia">{w.srednia !== null ? napisOceny(w.srednia) : "–"}</p>
        <div>
          {w.srednia !== null && <Gwiazdki ocena={w.srednia} />}
          <p className="tv-sala-podpis">
            {liczbaOcen(w.ocen)}
            {w.jeszcze.z > 0 && ` · ${Math.round((100 * w.jeszcze.tak) / w.jeszcze.z)}% wypiłoby jeszcze jedno`}
          </p>
        </div>
      </div>
      <Chmura slowa={chmura(karty).slice(0, 8)} duza={64} />
      {suwaki.length > 0 && (
        <ul className="tv-sala-suwaki">
          {suwaki.map((s) => (
            <SuwakSali key={s.pole} s={s} />
          ))}
        </ul>
      )}
      {w.oWadach > 0 && (
        <p className="tv-sala-wady">
          {w.wady.length
            ? w.wady.map((x) => `${x.napis}: ${x.ile} z ${w.oWadach}`).join(" · ")
            : "Bez wad: nikt nic nie wyczuł"}
        </p>
      )}
    </div>
  );
}

/** Suwak sali: rozrzut odpowiedzi w pięciu częściach i znacznik średniej. */
function SuwakSali({ s }: { s: WynikSuwaka }) {
  const max = Math.max(1, ...s.rozklad);
  return (
    <li className="tv-suwak-sali">
      <span className="tv-suwak-nazwa">{s.nazwa}</span>
      <span className="tv-suwak-koniec">{s.od}</span>
      <span className="tv-suwak-os">
        {s.rozklad.map((n, i) => (
          <span key={i} className="tv-suwak-slupek" style={{ opacity: 0.15 + 0.85 * (n / max) }} />
        ))}
        <span className="tv-suwak-srednia" style={{ left: `${s.srednia}%` }} />
      </span>
      <span className="tv-suwak-koniec">{s.do}</span>
    </li>
  );
}

/** Koniec degustacji: podium piw według średniej, a przy jednym piwie jego wielka plansza. */
function PodiumPiw({
  stan,
  karty,
  piwa,
  loga,
}: {
  stan: StanSesji;
  karty: KartyPiwa[];
  piwa: PiwoDegustacji[];
  loga: React.ReactNode;
}) {
  const ranking = piwa
    .map((p) => ({ p, w: wynikiSali(karty.find((k) => k.zadanie_id === p.id)?.karty ?? []) }))
    .sort((a, b) => (b.w.srednia ?? 0) - (a.w.srednia ?? 0) || a.p.nr - b.p.nr);
  return (
    <MotionConfig reducedMotion="user">
      <div className="tv-degustacja">
        <header className="tv-naglowek">
          {loga}
          <p className="tv-etykieta">{stan.quiz?.tytul ?? "Degustacja"}</p>
        </header>
        <ol className={`tv-podium-piw${ranking.length === 1 ? " jedno" : ""}`}>
          {ranking.map(({ p, w }, i) => (
            <motion.li
              key={p.id}
              className={i < 3 ? `miejsce-${i + 1}` : undefined}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (ranking.length - 1 - i) * 0.35, duration: 0.6 }}
            >
              {i < 3 &&
                (p.grafika_url ? (
                  <img src={p.grafika_url} alt="" className="tv-podium-piw-etykieta" />
                ) : (
                  <span className="tv-podium-piw-etykieta pusta">🍺</span>
                ))}
              <span className="tv-podium-piw-miejsce">{i + 1}.</span>
              <span className="tv-podium-piw-nazwa">
                {p.tresc}
                {opisPiwa(p.dane) && <small>{opisPiwa(p.dane)}</small>}
              </span>
              <span className="tv-podium-piw-ocena">{w.srednia !== null ? napisOceny(w.srednia) : "–"}</span>
            </motion.li>
          ))}
        </ol>
        <p className="tv-podium-piw-pozegnanie">Dziękujemy za degustację. Piwu Cześć!</p>
      </div>
    </MotionConfig>
  );
}
