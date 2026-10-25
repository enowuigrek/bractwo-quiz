"use client";
/* eslint-disable @next/next/no-img-element -- loga i grafiki z bucketu Supabase albo z /public */

import { useSyncExternalStore } from "react";
import { fazaTeraz, sekundaOdliczania } from "@/lib/gra/nasluch";
import { META_FINALU, krokiFinalu } from "@/lib/gra/final";
import { odciecieEtapu } from "@/lib/gra/odpadanie";
import type { GraczNaLiscie, StanSesji, WierszOdpowiedzi, WierszRankingu } from "@/lib/gra/typy";
import { kiedyStart, opisOdliczania, useDoStartu, type Zapowiedz } from "@/lib/gra/zapowiedz";
import { LITERY, PRAWDA_FALSZ, liczbaZJednostka } from "@/lib/zadania";
import { sekundy } from "@/lib/czas";
import "./prosty.css";

// Prosty ekran TV dla starszych przeglądarek telewizorów (src/lib/gra/prosty.ts: kiedy się włącza). Te same dane
// i ta sama gra co pełny ekran (pobiera je Tv w ekran/_ekran/tv.tsx, muzyka i efekty grają jak zwykle), tylko bez
// animacji, wyścigu, wideo i pijanego chaosu, a CSS (prosty.css) bez nowszych rzeczy, których Chrome 69 nie zna.

const SZER = 1920;
const WYS = 1080;

function subskrybuj(zmiana: () => void) {
  window.addEventListener("resize", zmiana);
  return () => window.removeEventListener("resize", zmiana);
}
const skalaOkna = () => Math.min(window.innerWidth / SZER, window.innerHeight / WYS);

/** Scena 1920×1080 przeskalowana do ekranu (jak w pełnym, ale bez tła z animacjami). */
export function ScenaProsta({ children, ciemna = false }: { children: React.ReactNode; ciemna?: boolean }) {
  const skala = useSyncExternalStore(subskrybuj, skalaOkna, () => 1);
  return (
    <div className={`pr-tv${ciemna ? " pr-ciemna" : ""}`}>
      <div
        className="pr-scena"
        style={{
          transform: `scale(${skala})`,
          left: `calc(50% - ${(SZER * skala) / 2}px)`,
          top: `calc(50% - ${(WYS * skala) / 2}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

type Lokal = { nazwa: string; logo_url: string | null } | null;

function Loga({ lokal }: { lokal: Lokal }) {
  return (
    <div className="pr-loga">
      {lokal?.logo_url && <img src={lokal.logo_url} alt={lokal.nazwa} className="pr-logo-lokalu" />}
      <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="pr-logo-bractwa" />
    </div>
  );
}

/** Plansza ekranu lokalu bez gry albo z zapowiedzią (zamiast przewijanych plansz pełnego ekranu). */
export function PlanszaProsta({
  lokal,
  zapowiedz,
  przesuniecie,
}: {
  lokal: Lokal;
  zapowiedz: Zapowiedz | null;
  przesuniecie: number;
}) {
  const doStartu = useDoStartu(zapowiedz?.planowany_start ?? null, przesuniecie);
  return (
    <div className="pr-srodek">
      <Loga lokal={lokal} />
      {zapowiedz?.okazja && <p className="pr-nadtytul">{zapowiedz.okazja}</p>}
      <h1 className="pr-tytul">{zapowiedz?.tytul ?? "Quiz Bractwa Piwnego"}</h1>
      {zapowiedz?.planowany_start && doStartu !== null ? (
        <p className="pr-start">
          Start <strong>{kiedyStart(zapowiedz.planowany_start)}</strong> · {opisOdliczania(doStartu)}
        </p>
      ) : (
        <p className="pr-start">Wkrótce start{lokal ? ` · ${lokal.nazwa}` : ""}</p>
      )}
    </div>
  );
}

type Props = {
  stan: StanSesji | null;
  blad: string | null;
  gracze: GraczNaLiscie[];
  ranking: WierszRankingu[];
  odpowiedzi: WierszOdpowiedzi[];
  qr: string;
  host: string;
  teraz: number;
  przesuniecie: number;
};

/** Prosty ekran gry: każda faza jako zwykła, statyczna plansza. */
export function ProstyTv({ stan, blad, gracze, ranking, odpowiedzi, qr, host, teraz, przesuniecie }: Props) {
  if (!stan) {
    return (
      <div className="pr-srodek">
        <p className="pr-duzy">{blad && !blad.startsWith("Brak połączenia") ? blad : "Łączę z grą…"}</p>
      </div>
    );
  }
  const wGrze = ranking.filter((w) => w.odpadl === null);
  switch (stan.faza) {
    case "poczekalnia":
      return stan.poczekalnia_otwarta ? (
        <Poczekalnia stan={stan} gracze={gracze} qr={qr} host={host} />
      ) : (
        <PlanszaProsta
          lokal={stan.lokal}
          przesuniecie={przesuniecie}
          zapowiedz={{
            planowany_start: stan.planowany_start,
            tytul: stan.quiz?.tytul ?? null,
            okazja: stan.okazja,
            browar: stan.browar,
          }}
        />
      );
    case "wstep":
      return <Wstep stan={stan} />;
    case "etap":
      return <Etap stan={stan} />;
    case "przygotuj":
    case "pytanie":
    case "wynik":
      return <Pytanie stan={stan} teraz={teraz} />;
    case "odpowiedzi":
      return <Odpowiedzi stan={stan} odpowiedzi={odpowiedzi} />;
    case "ranking":
      return <Ranking stan={stan} ranking={wGrze} />;
    case "seria":
    case "pijany":
      return <Seria stan={stan} teraz={teraz} />;
    case "werble":
      return null;
    case "podium":
      return <Podium stan={stan} ranking={ranking} />;
    case "tabela":
      return <Tabela stan={stan} ranking={ranking} tytul="Wyniki" />;
    default:
      return <Podium stan={stan} ranking={ranking} koniec />;
  }
}

function Naglowek({ lewy, prawy }: { lewy: React.ReactNode; prawy?: React.ReactNode }) {
  return (
    <header className="pr-naglowek">
      <h1>{lewy}</h1>
      {prawy && <p className="pr-naglowek-prawy">{prawy}</p>}
    </header>
  );
}

function Poczekalnia({
  stan,
  gracze,
  qr,
  host,
}: {
  stan: StanSesji;
  gracze: GraczNaLiscie[];
  qr: string;
  host: string;
}) {
  const widoczni = gracze.slice(0, 40);
  return (
    <div className="pr-poczekalnia">
      <section className="pr-wejscie">
        <div className="pr-qr" dangerouslySetInnerHTML={{ __html: qr }} />
        <p className="pr-adres">
          Bez skanowania: {host}/<strong>{stan.kod}</strong>
        </p>
      </section>
      <section className="pr-prawa">
        <Loga lokal={stan.lokal} />
        {stan.okazja && <p className="pr-nadtytul">{stan.okazja}</p>}
        <h1 className="pr-tytul pr-tytul-maly">{stan.quiz?.tytul ?? "Quiz"}</h1>
        <p className="pr-nadtytul">
          Gracze {stan.liczba_graczy}/{stan.max_graczy}
        </p>
        <ul className="pr-nicki">
          {widoczni.map((g) => (
            <li key={g.nick}>{g.nick}</li>
          ))}
          {gracze.length > widoczni.length && <li>+{gracze.length - widoczni.length}</li>}
        </ul>
        {gracze.length === 0 && <p className="pr-opis">Zeskanuj kod telefonem i wpisz imię albo nick.</p>}
      </section>
    </div>
  );
}

function Wstep({ stan }: { stan: StanSesji }) {
  return (
    <div className="pr-srodek">
      <p className="pr-nadtytul">{stan.quiz?.tytul}</p>
      <h1 className="pr-tytul">Wyścig po piwo</h1>
      <ol className="pr-etapy">
        {stan.plan_etapow.map((e) => (
          <li key={e.nr}>
            <span className="pr-nr">{e.nr}</span>
            {e.nazwa}
            {e.finalowy && <em> · finał</em>}
          </li>
        ))}
      </ol>
      <Gotowi stan={stan} />
    </div>
  );
}

function Etap({ stan }: { stan: StanSesji }) {
  const e = stan.etap;
  if (!e) return null;
  return (
    <div className="pr-srodek pr-lewo">
      <p className="pr-nadtytul">
        Etap {e.nr} z {e.liczba}
        {e.finalowy ? " · finał" : ""}
      </p>
      <h1 className="pr-tytul">{e.nazwa}</h1>
      {e.opis && <p className="pr-opis pr-opis-duzy">{e.opis}</p>}
      <p className="pr-cechy">
        {e.mnoznik !== 1 && <span>Punkty ×{String(e.mnoznik).replace(".", ",")}</span>}
        {e.seria && <span>{e.czas_s ?? 60} s na całą serię</span>}
        {!e.seria && e.czas_s && <span>{e.czas_s} s na odpowiedź</span>}
        {!e.finalowy && <span>Pytań: {e.liczba_pytan}</span>}
      </p>
      {e.final_po_etapie && <p className="pr-uwaga">Po tym etapie 3 najlepszych wchodzi do finału.</p>}
      {!e.final_po_etapie && e.przechodzi !== null && (
        <p className="pr-uwaga">Po tym etapie gra dalej {e.przechodzi} najlepszych.</p>
      )}
      {stan.finalisci && <p className="pr-uwaga">W finale grają: {stan.finalisci.map((f) => f.nick).join(", ")}</p>}
      <Gotowi stan={stan} />
    </div>
  );
}

function Gotowi({ stan }: { stan: StanSesji }) {
  if (!stan.auto) return null;
  return (
    <p className="pr-gotowi">
      Gotowi {stan.gotowi}/{stan.w_grze}
    </p>
  );
}

function Pytanie({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const z = stan.zadanie;
  if (!z) return null;
  const { faza, doStartu, doKonca, bezLimitu } = fazaTeraz(stan, teraz);
  if (z.typ === "ciekawostka") {
    return (
      <div className="pr-ciekawostka">
        {z.grafika_url && <img src={z.grafika_url} alt="" className="pr-grafika-duza" />}
        <div>
          <p className="pr-nadtytul">Ciekawostka</p>
          <h1 className="pr-tytul pr-tytul-maly">{z.tresc}</h1>
          {z.dane.tekst && <p className="pr-opis pr-opis-duzy">{z.dane.tekst}</p>}
        </div>
        <Gotowi stan={stan} />
      </div>
    );
  }
  if (faza === "przygotuj") {
    return (
      <div className="pr-srodek">
        <p className="pr-nadtytul">Pytanie {z.lp}</p>
        <p className="pr-odliczanie">{sekundaOdliczania(doStartu)}</p>
      </div>
    );
  }
  const wynik = faza === "wynik";
  const zegar = faza === "pytanie" && !bezLimitu ? Math.max(0, Math.ceil(doKonca / 1000)) : null;
  return (
    <div className="pr-pytanie">
      <Naglowek
        lewy={z.tresc}
        prawy={
          <>
            Pytanie {z.lp}
            {zegar !== null && <strong className="pr-zegar"> {zegar} s</strong>}
          </>
        }
      />
      <div className="pr-pytanie-tresc">
        {z.grafika_url && <img src={z.grafika_url} alt="" className="pr-grafika" />}
        <OdpowiedziPytania stan={stan} wynik={wynik} />
      </div>
      {!wynik && (
        <p className="pr-stopka">
          Odpowiedziało {stan.liczba_odpowiedzi}/{stan.w_grze}
        </p>
      )}
    </div>
  );
}

function OdpowiedziPytania({ stan, wynik }: { stan: StanSesji; wynik: boolean }) {
  const z = stan.zadanie!;
  const d = z.dane;
  const poprawna = wynik ? d.poprawna : undefined;
  if (z.typ === "szacowanie") {
    return (
      <div className="pr-szacowanie">
        {wynik && typeof poprawna === "number" ? (
          <>
            <p className="pr-odliczanie">{liczbaZJednostka(poprawna, d.jednostka)}</p>
            {z.najblizej?.length ? (
              <p className="pr-opis pr-opis-duzy">
                Najbliżej: {z.najblizej.map((n) => `${n.nick} (${liczbaZJednostka(n.liczba, d.jednostka)})`).join(", ")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="pr-opis pr-opis-duzy">
            Podaj liczbę od {liczbaZJednostka(d.min ?? 0, d.jednostka)} do {liczbaZJednostka(d.max ?? 0, d.jednostka)}
          </p>
        )}
      </div>
    );
  }
  if (z.typ === "kolejnosc") {
    const elementy = d.elementy ?? [];
    const lista = Array.isArray(poprawna) ? poprawna.map((i) => elementy[i]) : elementy;
    return (
      <ol className={`pr-lista${wynik ? " pr-wynik" : ""}`}>
        {lista.map((e, i) => (
          <li key={i}>
            <span className="pr-nr">{wynik ? i + 1 : "•"}</span>
            {e}
          </li>
        ))}
      </ol>
    );
  }
  if (z.typ === "pary") {
    const lewe = d.lewe ?? [];
    const prawe = d.prawe ?? [];
    if (Array.isArray(poprawna)) {
      return (
        <ul className="pr-lista pr-pary pr-wynik">
          {lewe.map((l, i) => (
            <li key={i}>
              <span className="pr-nr">{i + 1}</span>
              {l}
              <span className="pr-para">→ {prawe[poprawna[i]]}</span>
            </li>
          ))}
        </ul>
      );
    }
    // w trakcie pytania dwie osobne kolumny: w jednym wierszu wyglądałyby na już połączone
    return (
      <div className="pr-dwie-kolumny">
        <ul className="pr-lista">
          {lewe.map((l, i) => (
            <li key={i}>
              <span className="pr-nr">{i + 1}</span>
              {l}
            </li>
          ))}
        </ul>
        <ul className="pr-lista">
          {prawe.map((p, i) => (
            <li key={i}>
              <span className="pr-nr">{LITERY[i]}</span>
              {p}
            </li>
          ))}
        </ul>
      </div>
    );
  }
  // wybór, prawda/fałsz, kilka dobrych
  const opcje = z.typ === "prawda_falsz" ? PRAWDA_FALSZ : (d.odpowiedzi ?? []);
  const dobre = Array.isArray(poprawna) ? poprawna : typeof poprawna === "number" ? [poprawna] : [];
  return (
    <ul className="pr-lista pr-opcje">
      {opcje.map((o, i) => (
        <li key={i} className={wynik ? (dobre.includes(i) ? "pr-dobra" : "pr-zla") : undefined}>
          <span className="pr-nr">{z.typ === "prawda_falsz" ? (i ? "✗" : "✓") : LITERY[i]}</span>
          {o}
          {wynik && z.rozklad && <span className="pr-glosy">{z.rozklad[i] ?? 0}</span>}
        </li>
      ))}
    </ul>
  );
}

function Odpowiedzi({ stan, odpowiedzi }: { stan: StanSesji; odpowiedzi: WierszOdpowiedzi[] }) {
  const dobre = odpowiedzi.filter((o) => o.poprawna === true);
  const reszta = odpowiedzi.filter((o) => o.poprawna !== true);
  return (
    <div className="pr-pytanie">
      <Naglowek lewy={stan.zadanie?.tresc ?? "Odpowiedzi"} prawy={stan.zadanie ? `Pytanie ${stan.zadanie.lp}` : null} />
      <div className="pr-kolumny">
        <section className="pr-ramka pr-ramka-dobrze">
          <h2>Dobrze {dobre.length}</h2>
          {dobre.length ? (
            <ol>
              {dobre.map((o) => (
                <li key={o.nick}>
                  {o.nick}
                  {o.czas_ms !== null && <span>{sekundy(o.czas_ms)}</span>}
                </li>
              ))}
            </ol>
          ) : (
            <p>Nikt nie odpowiedział dobrze.</p>
          )}
        </section>
        <section className="pr-ramka pr-ramka-zle">
          <h2>Źle {reszta.length}</h2>
          <ul>
            {reszta.map((o) => (
              <li key={o.nick}>
                {o.nick}
                {o.punkty ? <span>+{o.punkty}</span> : o.dane ? null : <span>brak</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function Ranking({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const odciecie = odciecieEtapu(stan);
  const koniecEtapu = !!stan.etap && stan.ostatnie_w_etapie && !stan.etap.finalowy;
  const widoczni = ranking.slice(0, 12);
  return (
    <div className="pr-pytanie">
      <Naglowek
        lewy={koniecEtapu ? `Koniec etapu ${stan.etap!.nr}` : "Ranking"}
        prawy={stan.zadanie ? `Po pytaniu ${stan.zadanie.lp}` : null}
      />
      <ol className="pr-tabela">
        {widoczni.map((w, i) => (
          <li key={w.nick} className={odciecie !== null && i === odciecie - 1 ? "pr-kreska" : undefined}>
            <span className="pr-nr">{w.miejsce}.</span>
            <span className="pr-nick">{w.nick}</span>
            <span className="pr-punkty">
              {w.punkty.toLocaleString("pl-PL")}
              {w.zdobyte > 0 && <em> +{w.zdobyte}</em>}
            </span>
          </li>
        ))}
      </ol>
      {ranking.length > widoczni.length && (
        <p className="pr-stopka">i jeszcze {ranking.length - widoczni.length} w grze</p>
      )}
    </div>
  );
}

function Seria({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const { doKonca } = fazaTeraz(stan, teraz);
  const gracze = stan.seria ?? [];
  const pijany = stan.faza === "pijany";
  return (
    <div className="pr-pytanie">
      <Naglowek
        lewy="Finał: kto pierwszy do piwa"
        prawy={!pijany && doKonca > 0 && doKonca < Infinity ? `${Math.ceil(doKonca / 1000)} s` : null}
      />
      <ul className="pr-final">
        {gracze.map((g) => {
          const kroki = Math.min(META_FINALU, krokiFinalu(g));
          return (
            <li key={g.nick}>
              <span className="pr-nick">{g.nick}</span>
              <span className="pr-pasek">
                <span style={{ width: `${(100 * kroki) / META_FINALU}%` }} />
              </span>
              <span className="pr-punkty">
                {kroki}/{META_FINALU}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Podium({ stan, ranking, koniec = false }: { stan: StanSesji; ranking: WierszRankingu[]; koniec?: boolean }) {
  const trojka = ranking.slice(0, 3);
  return (
    <div className="pr-srodek">
      <Loga lokal={stan.lokal} />
      <h1 className="pr-tytul">{koniec ? "Dziękujemy za grę!" : "Zwycięzcy"}</h1>
      <ol className="pr-podium">
        {trojka.map((w) => {
          const nagroda = stan.nagrody?.find((n) => n.miejsce === w.miejsce)?.nagroda;
          return (
            <li key={w.nick} className={`pr-miejsce-${w.miejsce}`}>
              <span className="pr-nr">{w.miejsce}.</span>
              <span className="pr-nick">{w.nick}</span>
              <span className="pr-punkty">{w.punkty.toLocaleString("pl-PL")} pkt</span>
              {nagroda && <span className="pr-nagroda">{nagroda}</span>}
            </li>
          );
        })}
      </ol>
      <p className="pr-opis">
        {[stan.okazja, stan.quiz?.tytul, stan.lokal?.nazwa].filter(Boolean).join(" · ")}
        {koniec ? " · Piwu Cześć!" : ""}
      </p>
    </div>
  );
}

function Tabela({ stan, ranking, tytul }: { stan: StanSesji; ranking: WierszRankingu[]; tytul: string }) {
  return (
    <div className="pr-pytanie">
      <Naglowek lewy={tytul} prawy={stan.quiz?.tytul} />
      <ol className="pr-tabela pr-tabela-dwie">
        {ranking.slice(0, 30).map((w) => (
          <li key={w.nick}>
            <span className="pr-nr">{w.miejsce}.</span>
            <span className="pr-nick">{w.nick}</span>
            <span className="pr-punkty">{w.punkty.toLocaleString("pl-PL")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
