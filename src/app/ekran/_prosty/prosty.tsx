"use client";
/* eslint-disable @next/next/no-img-element -- loga i grafiki z bucketu Supabase albo z /public */

import { useSyncExternalStore } from "react";
import { fazaTeraz, sekundaOdliczania } from "@/lib/gra/nasluch";
import { META_FINALU, krokiFinalu, miejsceZWyscigu } from "@/lib/gra/final";
import { odciecieEtapu } from "@/lib/gra/odpadanie";
import type { GraczNaLiscie, StanSesji, WierszOdpowiedzi, WierszRankingu } from "@/lib/gra/typy";
import { kiedyStart, opisOdliczania, useDoStartu, type Zapowiedz } from "@/lib/gra/zapowiedz";
import { naStronieRankingu, quizKlasyczny, stronyRankingu } from "@/lib/gra/wyscig";
import { bezPunktow } from "@/lib/etapy";
import { liczbyEtapow, zLiczba } from "@/lib/gra/odpadanie";
import { useStronaRankingu } from "@/lib/gra/strona-rankingu";
import { LITERY, PRAWDA_FALSZ, celSzacowania, liczbaZJednostka, poprawnaSzacowania } from "@/lib/zadania";
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

/**
 * Scena 1920×1080 przeskalowana do ekranu (jak w pełnym, ale bez tła z animacjami). `lokalTla`: klasyczny pub quiz
 * i ekran lokalu mają w tle przygaszone logo lokalu (jak tlo.tsx pełnego ekranu, tu z jednym powolnym ruchem).
 */
export function ScenaProsta({
  children,
  ciemna = false,
  lokalTla,
}: {
  children: React.ReactNode;
  ciemna?: boolean;
  lokalTla?: Lokal;
}) {
  const skala = useSyncExternalStore(subskrybuj, skalaOkna, () => 1);
  return (
    <div className={`pr-tv${ciemna ? " pr-ciemna" : ""}`}>
      {lokalTla?.logo_url && !ciemna && <img src={lokalTla.logo_url} alt="" className="pr-tlo-logo" aria-hidden />}
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
      <img src="/loga/bractwo-biale.svg" alt="Bractwo Piwne" className="pr-logo-bractwa" />
    </div>
  );
}

/**
 * Ekran lokalu bez gry albo z zapowiedzią klasycznego pub quizu (jak ekran-logo.tsx): duże logo lokalu, a przy
 * zapowiedzi tytuł, godzina i odliczanie.
 */
export function LogoProste({
  lokal,
  zapowiedz,
  przesuniecie,
}: {
  lokal: Lokal;
  zapowiedz: Pick<Zapowiedz, "planowany_start" | "tytul" | "okazja"> | null;
  przesuniecie: number;
}) {
  const doStartu = useDoStartu(zapowiedz?.planowany_start ?? null, przesuniecie);
  return (
    <div className="pr-srodek">
      {lokal?.logo_url ? (
        <img
          src={lokal.logo_url}
          alt={lokal.nazwa}
          className={`pr-logo-ekranu${zapowiedz ? " pr-logo-ekranu-male" : ""}`}
        />
      ) : (
        <h1 className="pr-tytul">{lokal?.nazwa ?? "Quiz"}</h1>
      )}
      {zapowiedz?.okazja && <p className="pr-nadtytul">{zapowiedz.okazja}</p>}
      {zapowiedz && <h1 className="pr-tytul pr-tytul-maly">{zapowiedz.tytul ?? "Pub quiz"}</h1>}
      {zapowiedz?.planowany_start && doStartu !== null && (
        <p className="pr-start">
          Start <strong>{kiedyStart(zapowiedz.planowany_start)}</strong> · {opisOdliczania(doStartu)}
        </p>
      )}
    </div>
  );
}

/** Plansza ekranu lokalu z zapowiedzią wyścigu po piwo (zamiast przewijanych plansz pełnego ekranu). */
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
        <Poczekalnia stan={stan} gracze={gracze} qr={qr} host={host} przesuniecie={przesuniecie} />
      ) : quizKlasyczny(stan) ? (
        <LogoProste
          lokal={stan.lokal}
          przesuniecie={przesuniecie}
          zapowiedz={{ planowany_start: stan.planowany_start, tytul: stan.quiz?.tytul ?? null, okazja: stan.okazja }}
        />
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
      return quizKlasyczny(stan) ? <StartKlasycznego stan={stan} teraz={teraz} /> : <Wstep stan={stan} />;
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
      // na głównym ekranie animacja werbli; tu sam napis, żeby ekran nie był czarny
      return (
        <div className="pr-srodek">
          <p className="pr-tytul">Werble…</p>
          <p className="pr-opis pr-opis-duzy">Wynik za chwilę.</p>
        </div>
      );
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
  przesuniecie,
}: {
  stan: StanSesji;
  gracze: GraczNaLiscie[];
  qr: string;
  host: string;
  przesuniecie: number;
}) {
  const widoczni = gracze.slice(0, 40);
  const start = stan.planowany_start;
  const doStartu = useDoStartu(start, przesuniecie);
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
        {start && doStartu !== null && (
          <p className="pr-start">
            Start <strong>{kiedyStart(start)}</strong> · {opisOdliczania(doStartu)}
          </p>
        )}
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

/** Plansza startowa klasycznego pub quizu (10 s): napis i sekundy, bez animacji. */
function StartKlasycznego({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const ile = stan.faza_do ? Math.max(0, Math.ceil((Date.parse(stan.faza_do) - teraz) / 1000)) : 0;
  return (
    <div className="pr-srodek">
      <p className="pr-nadtytul">{stan.quiz?.tytul}</p>
      <h1 className="pr-tytul">Zaczynamy!</h1>
      <p className="pr-start">
        {ile > 0 ? (
          <>
            Pierwsze pytanie za <strong>{ile}</strong> s
          </>
        ) : (
          "Telefony w dłoń!"
        )}
      </p>
    </div>
  );
}

function Wstep({ stan }: { stan: StanSesji }) {
  const liczby = liczbyEtapow(stan);
  return (
    <div className="pr-srodek">
      <p className="pr-nadtytul">{stan.quiz?.tytul}</p>
      <h1 className="pr-tytul">Wyścig po piwo</h1>
      <ol className="pr-etapy">
        {stan.plan_etapow.map((e, i) => (
          <li key={e.nr}>
            <span className="pr-nr">{e.nr}</span>
            {e.nazwa}
            {e.finalowy && <em> · finał</em>}
            <em>
              {" "}
              · {zLiczba(liczby[i].graja, "gra", "grają")}
              {liczby[i].dalej !== null ? `, ${zLiczba(liczby[i].dalej!, "przechodzi", "przechodzą")}` : ""}
            </em>
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
        {e.mnoznik !== 1 && !bezPunktow(e) && <span>Punkty ×{String(e.mnoznik).replace(".", ",")}</span>}
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

// „Gotowy” klikają gracze zawsze (26.10), nie tylko przy automacie
function Gotowi({ stan }: { stan: StanSesji }) {
  return (
    <p className="pr-gotowi">
      Gotowi {stan.gotowi}/{stan.gotowi_z}
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
    <div className="pr-pytanie pr-pytanie-srodek">
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
        {/* odsłaniana grafika (zgadnij po zdjęciu) bez rozmycia zdradzałaby odpowiedź: tu dopiero przy wyniku (28.10) */}
        {z.grafika_url && !(z.dane.odslaniaj && !wynik) && <img src={z.grafika_url} alt="" className="pr-grafika" />}
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
            <p className="pr-liczba-wynik">{poprawnaSzacowania(poprawna, d.poprawna_do, d.jednostka)}</p>
            {z.najblizej?.length ? (
              <p className="pr-opis pr-opis-duzy">
                Najbliżej: {z.najblizej.map((n) => `${n.nick} (${liczbaZJednostka(n.liczba, d.jednostka)})`).join(", ")}
              </p>
            ) : null}
          </>
        ) : (
          <p className="pr-opis pr-opis-duzy">
            Podaj liczbę od {liczbaZJednostka(d.min ?? 0, d.jednostka)} do {liczbaZJednostka(d.max ?? 0, d.jednostka)}.{" "}
            {celSzacowania(d)}.
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

/** Dobrze, częściowo (w szacowaniu „Blisko”) i źle, jak na głównym ekranie (28.10: częściowe stały w „Źle”). */
function Odpowiedzi({ stan, odpowiedzi }: { stan: StanSesji; odpowiedzi: WierszOdpowiedzi[] }) {
  const dobre = odpowiedzi.filter((o) => o.poprawna === true);
  const czesciowo = odpowiedzi.filter((o) => o.poprawna === false && (o.ocena ?? 0) > 0);
  const reszta = odpowiedzi.filter((o) => o.poprawna !== true && !czesciowo.includes(o));
  const szacowanie = stan.zadanie?.typ === "szacowanie";
  return (
    <div className="pr-pytanie">
      <Naglowek lewy={stan.zadanie?.tresc ?? "Odpowiedzi"} prawy={stan.zadanie ? `Pytanie ${stan.zadanie.lp}` : null} />
      <div className="pr-kolumny">
        <section className="pr-ramka pr-ramka-dobrze">
          <h2>
            {szacowanie ? "W punkt" : "Dobrze"} {dobre.length}
          </h2>
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
        {czesciowo.length > 0 && (
          <section className="pr-ramka pr-ramka-czesciowo">
            <h2>
              {szacowanie ? "Blisko" : "Częściowo"} {czesciowo.length}
            </h2>
            <ul>
              {czesciowo.map((o) => (
                <li key={o.nick}>
                  {o.nick}
                  <span>+{o.punkty ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
        <section className="pr-ramka pr-ramka-zle">
          <h2>Źle {reszta.length}</h2>
          <ul>
            {reszta.map((o) => (
              <li key={o.nick}>
                {o.nick}
                {o.dane ? null : <span>brak</span>}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

/** Ranking po pytaniu: strony po równo jak na głównym ekranie (12 graczy: 6 + 6), co kilka sekund następna (28.10). */
function Ranking({ stan, ranking }: { stan: StanSesji; ranking: WierszRankingu[] }) {
  const odciecie = odciecieEtapu(stan);
  const koniecEtapu = !!stan.etap && stan.ostatnie_w_etapie && !stan.etap.finalowy;
  const strona = useStronaRankingu(ranking.length);
  const naStronie = naStronieRankingu(ranking.length);
  const stron = stronyRankingu(ranking.length);
  const od = strona * naStronie;
  const widoczni = ranking.slice(od, od + naStronie);
  return (
    <div className="pr-pytanie">
      <Naglowek
        lewy={koniecEtapu ? `Koniec etapu ${stan.etap!.nr}` : "Ranking"}
        prawy={stan.zadanie ? `Po pytaniu ${stan.zadanie.lp}` : null}
      />
      <ol className="pr-tabela">
        {widoczni.map((w, i) => (
          <li
            key={w.nick}
            className={
              [w.miejsce === 1 && "pr-lider", odciecie !== null && od + i === odciecie - 1 && "pr-kreska"]
                .filter(Boolean)
                .join(" ") || undefined
            }
          >
            <span className="pr-nr">{w.miejsce}.</span>
            <span className="pr-nick">{w.nick}</span>
            <span className="pr-punkty">
              {w.punkty.toLocaleString("pl-PL")}
              {w.zdobyte > 0 && <em> +{w.zdobyte}</em>}
            </span>
          </li>
        ))}
      </ol>
      {stron > 1 && (
        <p className="pr-stopka">
          Strona {strona + 1} z {stron}
        </p>
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
        prawy={
          !pijany && doKonca > 0 && doKonca < Infinity ? (
            <span className="pr-zegar">{Math.ceil(doKonca / 1000)} s</span>
          ) : null
        }
      />
      <ul className="pr-final">
        {gracze.map((g) => {
          // z pijanym finałem nikt nie dobiega do mety (wyścig udaje, że trwa dalej)
          const kroki = Math.min(stan.pijany_final ? META_FINALU - 1 : META_FINALU, krokiFinalu(g));
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
  // po finale miejsce trójki dał wyścig: bez punktów, jak na głównym ekranie
  const finalistow = stan.finalisci?.length;
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
              {!miejsceZWyscigu(w.miejsce, finalistow) && (
                <span className="pr-punkty">{w.punkty.toLocaleString("pl-PL")} pkt</span>
              )}
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
          <li key={w.nick} className={w.miejsce === 1 ? "pr-lider" : undefined}>
            <span className="pr-nr">{w.miejsce}.</span>
            <span className="pr-nick">{w.nick}</span>
            {/* finalista: przebieg finału zamiast samych punktów, bo o miejscu zdecydował wyścig */}
            {w.final && (
              <span className="pr-final-wynik">
                <span className="pr-dobre">✓ {w.final.dobre}</span> <span className="pr-zle">✗ {w.final.zle}</span>{" "}
                {Math.min(META_FINALU, Math.round(w.final.kroki))}/{META_FINALU}
              </span>
            )}
            <span className="pr-punkty">{w.punkty.toLocaleString("pl-PL")}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
