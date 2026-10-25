"use client";
/* eslint-disable @next/next/no-img-element -- loga i grafiki z bucketu Supabase albo z /public */

import { useCallback, useState, useSyncExternalStore } from "react";
import {
  fazaTeraz,
  komunikatBledu,
  pobierzStan,
  sekundaOdliczania,
  useCzasSerwera,
  useKoniecPytania,
  useNasluch,
  zZegarem,
} from "@/lib/gra/nasluch";
import { useBezWygaszacza, useNowaWersja } from "@/lib/ekran-tv";
import { sekundy } from "@/lib/czas";
import { useDzwiekOdblokowany } from "@/lib/gra/dzwiek";
import { naDrodzeFinalu } from "@/lib/gra/final";
import { nastrojFazy, type Nastroj } from "@/lib/gra/nastroj";
import type { GraczNaLiscie, SeriaGracz, StanSesji, WierszOdpowiedzi, WierszRankingu } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { LITERY, PODPOWIEDZI_TYPOW, jedenWybor } from "@/lib/zadania";
import { napisMnoznika } from "@/lib/etapy";
import { rozmycie, useKolejnaPodpowiedz } from "@/lib/gra/dodatki";
import { Werble } from "@/components/werble";
import { EtapTv } from "./etap";
import { SeriaTv } from "./seria";
import { PijanyTv, type GraczPijany } from "./pijany";
import { useAutoZTv } from "./auto";
import { startPoczekalni } from "@/lib/gra/auto";
import { EfektyTv } from "./efekty";
import { MuzykaTv } from "./muzyka";
import { OsLiczbowa } from "./szacowanie";
import { OdpowiedziTv, TabelaTv } from "./odpowiedzi";
import { kiedyStart, opisOdliczania, useDoStartu } from "@/lib/gra/zapowiedz";
import { Plansze } from "./plansze";
import { TloTv } from "./tlo";
import { WyscigTv } from "./wyscig";
import { rankingJakoWyscig } from "@/lib/gra/wyscig";
import { PodiumTv, RankingTv } from "./ranking";
import { LogoNaglowka } from "./logo";
import { NickiPoczekalni } from "./nicki";
import { WstepTv } from "./wstep";
import { ProstyTv, ScenaProsta } from "../_prosty/prosty";
import { useTrybProsty } from "@/lib/gra/prosty";

// Scena ma stałe 1920×1080 i skaluje się do ekranu, żeby każdy telewizor wyglądał tak samo.
const SZER = 1920;
const WYS = 1080;

function subskrybujRozmiar(zmiana: () => void) {
  window.addEventListener("resize", zmiana);
  return () => window.removeEventListener("resize", zmiana);
}
const skalaOkna = () => Math.min(window.innerWidth / SZER, window.innerHeight / WYS);

function useSkala() {
  return useSyncExternalStore(subskrybujRozmiar, skalaOkna, () => 1);
}

/**
 * Scena 1920×1080 przeskalowana do ekranu. Wspólna dla gry i plansz ekranu lokalu.
 * Trzyma telewizor bez wygaszacza.
 * Logo Bractwa jest w nagłówkach ekranów (logo.tsx), nie w rogu sceny, gdzie zasłaniało podpisy.
 */
export function Scena({
  children,
  zgaszona = false,
  nastroj,
}: {
  children: React.ReactNode;
  /** Werble: czarny ekran bez smug tła. */
  zgaszona?: boolean;
  /** Nastrój tła według etapu (src/lib/gra/nastroj.ts); bez niego zwykłe ciepłe tło. */
  nastroj?: Nastroj;
}) {
  const skala = useSkala();
  useBezWygaszacza();
  return (
    <div className={`tv${zgaszona ? " zgaszona" : ""}`} data-nastroj={nastroj}>
      <TloTv />
      <div
        className="scena"
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

/** `host`: adres aplikacji bez protokołu, np. quiz.bractwopiwne.pl (pod QR, dla wpisujących ręcznie). */
type Props = { kod: string; qr: string; host: string };

export function Tv({ kod, qr, host }: Props) {
  const [stan, ustawStan] = useState<StanSesji | null>(null);
  const [gracze, ustawGraczy] = useState<GraczNaLiscie[]>([]);
  const [ranking, ustawRanking] = useState<WierszRankingu[]>([]);
  const [odpowiedzi, ustawOdpowiedzi] = useState<WierszOdpowiedzi[]>([]);
  // ostatni stan serii widziany na tym TV: stąd awatary ruszają w pijanym finale (baza nie wydaje już serii)
  const [ostatniaSeria, ustawOstatniaSerie] = useState<ZapamietanaSeria | null>(null);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);
  const [blad, ustawBlad] = useState<string | null>(null);

  const pobierz = useCallback(async () => {
    try {
      const { stan, przesuniecie } = await pobierzStan(kod);
      // lista nicków w poczekalni, a w pijanym finale bez finału trójki: kto lata po ekranie
      if (stan.faza === "poczekalnia" || (stan.faza === "pijany" && !stan.finalisci)) {
        const { data, error } = await supabase().rpc("lista_graczy", {
          p_kod: kod,
        });
        if (error) throw error;
        ustawGraczy(data as GraczNaLiscie[]);
      }
      if (stan.faza === "odpowiedzi") {
        const { data, error } = await supabase().rpc("odpowiedzi_zadania", {
          p_kod: kod,
        });
        if (error) throw error;
        ustawOdpowiedzi(data as WierszOdpowiedzi[]);
      }
      if (stan.faza === "ranking" || stan.faza === "podium" || stan.faza === "tabela" || stan.faza === "koniec") {
        const { data, error } = await supabase().rpc("ranking", { p_kod: kod });
        if (error) throw error;
        ustawRanking(data as WierszRankingu[]);
      }
      // w pijanym finale baza podaje stan serii z ostatnim krokiem zwycięzcy (stoi przy szklance)
      if ((stan.faza === "seria" || stan.faza === "pijany") && stan.seria) {
        ustawOstatniaSerie({ etap: stan.etap?.id ?? null, gracze: stan.seria });
      }
      ustawStan(stan);
      ustawPrzesuniecie(przesuniecie);
      ustawBlad(null);
    } catch (e) {
      ustawBlad(komunikatBledu(e));
    }
  }, [kod]);

  // okrzyk: kibic w serii finału (dymek nad drogą finalisty)
  useNasluch(kod, pobierz, ["stan", "gracz", "odpowiedz", "okrzyk"]);
  useKolejnaPodpowiedz(stan, przesuniecie, pobierz);

  const teraz = useCzasSerwera(przesuniecie, zZegarem(stan?.faza), stan?.faza === "przygotuj" ? 100 : 250);
  useKoniecPytania(kod, stan, teraz);
  // automatyczne prowadzenie i boty także stąd: pilot w tle prawie stoi
  useAutoZTv(kod, stan);

  // nowe wdrożenie: przeładowanie poza pytaniem, serią i odsłoną (tam przerwałoby odliczanie albo animację);
  // przy grającej muzyce dopiero po grze, bo po przeładowaniu przeglądarka znów czeka na OK na pilocie
  const muzykaGra = useDzwiekOdblokowany() && !!stan?.muzyka;
  useNowaWersja(
    !stan ||
      (muzykaGra
        ? stan.faza === "koniec"
        : !["przygotuj", "pytanie", "seria", "pijany", "werble", "podium"].includes(stan.faza)),
  );

  // starsza przeglądarka telewizora: prosty ekran (te same dane, muzyka i efekty, bez animacji i nowego CSS)
  const prosty = useTrybProsty();
  if (prosty) {
    return (
      <ScenaProsta ciemna={stan?.faza === "werble"}>
        <ProstyTv
          stan={stan}
          blad={blad}
          gracze={gracze}
          ranking={ranking}
          odpowiedzi={odpowiedzi}
          qr={qr}
          host={host}
          teraz={teraz}
          przesuniecie={przesuniecie}
        />
        {stan && <MuzykaTv stan={stan} teraz={teraz} />}
        {stan && <EfektyTv stan={stan} teraz={teraz} />}
      </ScenaProsta>
    );
  }

  const wGrze = ranking.filter((w) => w.odpadl === null);
  // zapowiedziana gra: zamiast poczekalni z QR plansze z godziną i odliczaniem (jak na ekranie lokalu)
  const zapowiedz = stan?.faza === "poczekalnia" && !stan.poczekalnia_otwarta;

  return (
    <Scena zgaszona={stan?.faza === "werble"} nastroj={stan ? nastrojFazy(stan) : undefined}>
      {!stan ? (
        <div className="tv-srodek">
          <p className="tv-duzy">{blad && !blad.startsWith("Brak połączenia") ? blad : "Łączę z grą…"}</p>
        </div>
      ) : stan.faza === "werble" ? (
        // po finale ekran gaśnie (bez łagodnego wejścia fazy), podium pokazuje prowadzący; po pijanym finale TV jest
        // już ciemny po wideo wybuchu, więc bez błysku. Bez napisu „Werble…” (25.10): werble słychać (efekty.tsx),
        // napis zostaje na telefonach
        <Werble duzy blysk={!stan.pijany_final} napis={false} />
      ) : (
        // nowa faza wchodzi łagodnie; pytanie od odliczania do wyniku to jeden ekran
        <div key={kluczEkranu(stan)} className="tv-ekran">
          {zapowiedz ? (
            <Plansze
              lokal={stan.lokal ?? { nazwa: "", logo_url: null }}
              ostatnia={null}
              przesuniecie={przesuniecie}
              zapowiedz={{
                planowany_start: stan.planowany_start,
                tytul: stan.quiz?.tytul ?? null,
                okazja: stan.okazja,
                browar: stan.browar,
              }}
            />
          ) : stan.faza === "wstep" ? (
            <WstepTv stan={stan} loga={<Loga lokal={stan.lokal} browar={stan.browar} />} />
          ) : stan.faza === "poczekalnia" ? (
            <Poczekalnia stan={stan} gracze={gracze} qr={qr} host={host} przesuniecie={przesuniecie} />
          ) : stan.faza === "seria" ? (
            <SeriaTv stan={stan} teraz={teraz} />
          ) : stan.faza === "pijany" ? (
            <PijanyTv
              stan={stan}
              teraz={teraz}
              przesuniecie={przesuniecie}
              gracze={graczePijani(stan, ostatniaSeria, gracze)}
            />
          ) : stan.faza === "etap" ? (
            <EtapTv stan={stan} loga={<Loga lokal={stan.lokal} browar={stan.browar} />} />
          ) : stan.faza === "przygotuj" || stan.faza === "pytanie" || stan.faza === "wynik" ? (
            <Pytanie stan={stan} teraz={teraz} />
          ) : stan.faza === "odpowiedzi" ? (
            <OdpowiedziTv stan={stan} odpowiedzi={odpowiedzi} />
          ) : stan.faza === "ranking" ? (
            // wyścig po piwo, gdy gracze mieszczą się na torach; inaczej tabela. Bez odpadniętych w etapach
            // (pełna tabela i podium na końcu mają wszystkich)
            rankingJakoWyscig(wGrze.length) ? (
              <WyscigTv stan={stan} ranking={wGrze} />
            ) : (
              <RankingTv stan={stan} ranking={wGrze} />
            )
          ) : stan.faza === "tabela" ? (
            <TabelaTv stan={stan} ranking={ranking} />
          ) : (
            <Koniec stan={stan} ranking={ranking} przesuniecie={przesuniecie} />
          )}
        </div>
      )}
      {stan && <MuzykaTv stan={stan} teraz={teraz} />}
      {stan && <EfektyTv stan={stan} teraz={teraz} />}
      {stan && !zapowiedz && <GotowiTv stan={stan} />}
      {stan && blad && <p className="tv-polaczenie">{blad}, ponawiam…</p>}
    </Scena>
  );
}

/**
 * Automatyczne prowadzenie (`stan.auto`): na planszach, na których gracze klikają „Gotowy” (wstęp, etap,
 * ciekawostka), w rogu ile osób już kliknęło. Gra rusza, gdy klikną wszyscy (src/app/pilot/[kod]/auto.tsx).
 */
function GotowiTv({ stan }: { stan: StanSesji }) {
  const plansza =
    stan.faza === "wstep" || stan.faza === "etap" || (stan.faza === "wynik" && stan.zadanie?.typ === "ciekawostka");
  if (!stan.auto || !plansza) return null;
  return (
    <p className={`tv-gotowi${stan.gotowi >= stan.w_grze ? " wszyscy" : ""}`}>
      Gotowi <strong>{stan.gotowi}</strong>/{stan.w_grze}
    </p>
  );
}

export function Loga({
  lokal,
  browar,
}: {
  lokal: { nazwa: string; logo_url: string | null } | null;
  /** Gościnny browar (kranoprzejęcie): jego logo po znaku ×. */
  browar?: { nazwa: string; logo_url: string | null } | null;
}) {
  return (
    <div className="tv-loga">
      {lokal?.logo_url && <img src={lokal.logo_url} alt={lokal.nazwa} className="tv-logo-lokalu" />}
      {browar && (
        <>
          <span className="tv-loga-x" aria-hidden>
            ×
          </span>
          {browar.logo_url ? (
            <img src={browar.logo_url} alt={browar.nazwa} className="tv-logo-browaru" />
          ) : (
            <span className="tv-browar-nazwa">{browar.nazwa}</span>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Poczekalnia: duży QR po lewej (pod nim drobniej adres gry dla wpisujących ręcznie),
 * na pierwszym planie okazja, tytuł quizu i grafika, pod nimi gracze.
 */
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
  const druzyny = stan.tryb === "druzyny";
  // automat: start 5 minut po otwarciu poczekalni (src/lib/gra/auto.ts)
  const start = startPoczekalni(stan);
  const doStartu = useDoStartu(start, przesuniecie);
  return (
    <div className="poczekalnia">
      {/* gospodarze obok siebie, równej wielkości: lokal (logo, a bez logo nazwa) | Bractwo (× browar przy
          kranoprzejęciu); bez powtórzonej nazwy lokalu i małego logo Bractwa po drugiej stronie */}
      <header className="tv-naglowek">
        <div className="tv-loga tv-loga-poczekalni">
          {stan.lokal &&
            (stan.lokal.logo_url ? (
              <img src={stan.lokal.logo_url} alt={stan.lokal.nazwa} className="tv-logo-lokalu" />
            ) : (
              <span className="tv-lokal-nazwa">{stan.lokal.nazwa}</span>
            ))}
          {stan.lokal && <span className="tv-loga-kreska" aria-hidden />}
          <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo tv-logo-bractwa" />
          {stan.browar && (
            <>
              <span className="tv-loga-x" aria-hidden>
                ×
              </span>
              {stan.browar.logo_url ? (
                <img src={stan.browar.logo_url} alt={stan.browar.nazwa} className="tv-logo-browaru" />
              ) : (
                <span className="tv-browar-nazwa">{stan.browar.nazwa}</span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="poczekalnia-tresc">
        <section className="tv-wejscie">
          <div className="tv-qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="tv-adres">
            {/* bez skanowania: adres do wpisania w przeglądarce prowadzi od razu do gry */}
            Bez skanowania: {host}/<strong className="tv-zloto">{stan.kod}</strong>
          </p>
        </section>

        <section className="tv-prawa">
          {stan.okazja && <p className="tv-okazja">{stan.okazja}</p>}
          <h1 className="tv-tytul-quizu">{stan.quiz?.tytul ?? "Quiz"}</h1>
          {start && doStartu !== null && (
            <p className="tv-start">
              Start <strong>{kiedyStart(start)}</strong> · {opisOdliczania(doStartu)}
            </p>
          )}
          {stan.grafika_url && <img src={stan.grafika_url} alt="" className="tv-grafika" />}

          {/* nagrody widać na starcie: tu ze zdjęciami, potem tylko nazwa przy szklance i podium */}
          {stan.nagrody && (
            <ul className="tv-nagrody-start">
              {stan.nagrody.map((n) => (
                <li key={n.miejsce}>
                  {n.zdjecie && <img src={n.zdjecie} alt="" />}
                  <span>
                    <strong>{n.miejsce}.</strong> {n.nagroda}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="tv-gracze">
            <p className="tv-etykieta">
              {druzyny ? "Drużyny" : "Gracze"}{" "}
              <span className="tv-licznik">
                {stan.liczba_graczy}/{stan.max_graczy}
              </span>
            </p>
            {gracze.length === 0 ? (
              <p className="tv-zacheta">
                Zeskanuj kod telefonem i wpisz {druzyny ? "nazwę drużyny" : "imię albo nick"}. Możesz też dodać selfie.
                <br />
                Czekamy na {druzyny ? "pierwsze drużyny" : "pierwszych graczy"}…
              </p>
            ) : (
              <NickiPoczekalni gracze={gracze} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/** Przygotuj (odliczanie 3 s), pytanie z czasem i wynik z rozkładem odpowiedzi. */
function Pytanie({ stan, teraz }: { stan: StanSesji; teraz: number }) {
  const z = stan.zadanie;
  const { faza, doStartu, doKonca, czasMinal, bezLimitu } = fazaTeraz(stan, teraz);
  // pytanie usunięte w trakcie gry
  if (!z)
    return (
      <div className="tv-srodek">
        <Loga lokal={stan.lokal} browar={stan.browar} />
        <p className="tv-duzy">Patrz na prowadzącego</p>
      </div>
    );
  // ciekawostka: duża grafika i krótki tekst, bez zegara i odpowiedzi (pilot od razu w fazie `wynik`)
  if (z.typ === "ciekawostka") {
    return (
      <div className="tv-ciekawostka">
        <header className="tv-naglowek">
          <Loga lokal={stan.lokal} browar={stan.browar} />
          <LogoNaglowka />
        </header>
        <div className="tv-ciekawostka-tresc">
          {z.grafika_url && <img src={z.grafika_url} alt="" className="tv-ciekawostka-grafika" />}
          <section>
            <p className="tv-okazja">Ciekawostka</p>
            <h1>{z.tresc}</h1>
            {z.dane.tekst && <p className="tv-ciekawostka-tekst">{z.dane.tekst}</p>}
          </section>
        </div>
      </div>
    );
  }
  const etap = stan.etap;
  const grajacy = stan.finalisci?.length ?? stan.liczba_graczy;
  const opisEtapu = etap ? ` · ${etap.nazwa}${etap.mnoznik !== 1 ? ` ${napisMnoznika(etap.mnoznik)}` : ""}` : "";
  const zEtapami = (stan.quiz?.liczba_etapow ?? 0) > 0;

  if (faza === "przygotuj") {
    return (
      <div className="tv-srodek">
        <Loga lokal={stan.lokal} browar={stan.browar} />
        <p className="tv-okazja">
          Pytanie {z.lp}
          {opisEtapu}
        </p>
        <p className="tv-odliczanie">{sekundaOdliczania(doStartu)}</p>
        <p className="tv-duzy">Przygotuj się!</p>
        {/* w quizie z etapami rodzaj pytania tłumaczy plansza etapu */}
        {!zEtapami && <p className="tv-odliczanie-typ">{PODPOWIEDZI_TYPOW[z.typ]}</p>}
      </div>
    );
  }

  const wynik = faza === "wynik";
  const p = z.dane.poprawna;
  const czyPoprawna = (i: number) => (Array.isArray(p) ? p.includes(i) : i === p);
  const rozklad = wynik ? z.rozklad : null;
  const najwiecej = Math.max(1, ...(rozklad ?? [0]));
  const zostalo = z.czas_s ? Math.max(0, Math.min(1, doKonca / (z.czas_s * 1000))) : 0;
  const rozmyta = rozmycie({ ...stan, faza }, teraz);
  return (
    <div className="tv-pytanie">
      <header className="tv-pytanie-gora">
        <p className="tv-okazja">
          Pytanie {z.lp}
          {opisEtapu}
        </p>
        {wynik ? (
          <p className="tv-zegar tv-zegar-wynik">Wynik</p>
        ) : czasMinal ? (
          <p className="tv-zegar tv-zegar-koniec">{z.czas_s ? "Czas minął!" : "Wszyscy odpowiedzieli!"}</p>
        ) : bezLimitu ? (
          // bez limitu czasu zegara nie ma: napis „bez limitu” tylko mylił
          <p className="tv-zegar" />
        ) : (
          <p className={`tv-zegar${doKonca <= 5000 ? " malo" : ""}`}>{Math.ceil(doKonca / 1000)}</p>
        )}
        <LogoNaglowka />
      </header>
      {z.czas_s ? (
        <div className="tv-czas" aria-hidden>
          <div style={{ transform: `scaleX(${wynik ? 0 : zostalo})` }} />
        </div>
      ) : null}

      <h1 className="tv-tresc">{z.tresc}</h1>
      {z.typ !== "wybor" && !wynik && !zEtapami && <p className="tv-typ-podpowiedz">{PODPOWIEDZI_TYPOW[z.typ]}</p>}
      {z.podpowiedzi.length > 0 && (
        <ol className="tv-podpowiedzi">
          {z.podpowiedzi.map((p, i) => (
            <li key={i}>
              <span>{i + 1}</span>
              {p}
            </li>
          ))}
          {!wynik &&
            Array.from({ length: z.liczba_podpowiedzi - z.podpowiedzi.length }, (_, i) => (
              <li key={`ukryta-${i}`} className="ukryta">
                <span>{z.podpowiedzi.length + i + 1}</span>…
              </li>
            ))}
        </ol>
      )}

      <div className={`tv-pytanie-srodek${z.grafika_url ? " z-grafika" : ""}`}>
        {z.grafika_url && (
          <img
            src={z.grafika_url}
            alt=""
            className={`tv-pytanie-grafika${z.dane.odslaniaj ? " odslaniana" : ""}`}
            style={rozmyta ? { filter: `blur(${rozmyta}px)` } : undefined}
          />
        )}
        {z.typ === "szacowanie" ? (
          <OsLiczbowa z={z} wynik={wynik} />
        ) : z.typ === "kolejnosc" ? (
          <ol className={`tv-odp-lista tv-odp-jedna${(z.dane.elementy?.length ?? 0) > 4 ? " gesto" : ""}`}>
            {(wynik && Array.isArray(p) ? p : (z.dane.elementy ?? []).map((_, i) => i)).map((idx, pozycja) => (
              <li key={idx} className={`tv-odp${wynik ? " poprawna" : ""}`}>
                <span className="tv-odp-litera">{wynik ? pozycja + 1 : "·"}</span>
                <span className="tv-odp-tekst">{z.dane.elementy?.[idx]}</span>
              </li>
            ))}
          </ol>
        ) : z.typ === "pary" ? (
          wynik && Array.isArray(p) ? (
            <ol className={`tv-odp-lista tv-odp-jedna${(z.dane.lewe?.length ?? 0) > 4 ? " gesto" : ""}`}>
              {(z.dane.lewe ?? []).map((l, i) => (
                <li key={i} className="tv-odp poprawna">
                  <span className="tv-odp-tekst">
                    {l} <span className="tv-para-laczenie">↔</span> {z.dane.prawe?.[p[i]]}
                  </span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="tv-pary">
              <ol className={`tv-odp-lista tv-odp-jedna${(z.dane.lewe?.length ?? 0) > 4 ? " gesto" : ""}`}>
                {(z.dane.lewe ?? []).map((l, i) => (
                  <li key={i} className="tv-odp">
                    <span className="tv-odp-litera">{i + 1}</span>
                    <span className="tv-odp-tekst">{l}</span>
                  </li>
                ))}
              </ol>
              <ol className={`tv-odp-lista tv-odp-jedna${(z.dane.prawe?.length ?? 0) > 4 ? " gesto" : ""}`}>
                {(z.dane.prawe ?? []).map((r, k) => (
                  <li key={k} className="tv-odp">
                    <span className="tv-odp-litera">{LITERY[k]}</span>
                    <span className="tv-odp-tekst">{r}</span>
                  </li>
                ))}
              </ol>
            </div>
          )
        ) : (
          <ol
            className={`tv-odp-lista${z.typ === "prawda_falsz" ? " tv-odp-pf" : ""}${
              (z.dane.odpowiedzi?.length ?? 0) > 4 ? " gesto" : ""
            }`}
          >
            {(z.dane.odpowiedzi ?? []).map((o, i) => {
              const klasa = !wynik ? "" : czyPoprawna(i) ? " poprawna" : " przygaszona";
              const ile = rozklad?.[i] ?? 0;
              return (
                <li key={i} className={`tv-odp${klasa}`}>
                  {rozklad && <span className="tv-odp-slupek" style={{ transform: `scaleX(${ile / najwiecej})` }} />}
                  <span className="tv-odp-litera">{z.typ === "prawda_falsz" ? (i === 0 ? "✓" : "✗") : LITERY[i]}</span>
                  <span className="tv-odp-tekst">{o}</span>
                  {rozklad && <span className="tv-odp-ile">{ile}</span>}
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <footer className="tv-pytanie-dol">
        {wynik ? (
          <>
            <span>
              {jedenWybor(z.typ) ? "Dobrze odpowiedziało" : z.typ === "szacowanie" ? "W punkt" : "W pełni dobrze"}{" "}
              <strong className="tv-dobrze">
                {z.liczba_poprawnych ?? 0}/{grajacy}
              </strong>
            </span>
            {z.najszybszy && (
              <span>
                Najszybciej: <strong className="tv-zloto">{z.najszybszy.nick}</strong> ({sekundy(z.najszybszy.czas_ms)})
              </span>
            )}
          </>
        ) : (
          <>
            <span>
              Odpowiedziało{" "}
              <strong className="tv-zloto">
                {stan.liczba_odpowiedzi}/{grajacy}
              </strong>
            </span>
            {czasMinal ? (
              <span className="tv-podpowiedz">Za chwilę wynik…</span>
            ) : stan.finalisci ? (
              <span className="tv-podpowiedz">
                Finał: odpowiadają <strong className="tv-zloto">{stan.finalisci.map((f) => f.nick).join(", ")}</strong>
              </span>
            ) : (
              <span className="tv-podpowiedz">
                Odpowiadaj na telefonie · kod gry <strong className="tv-zloto">{stan.kod}</strong>
              </span>
            )}
          </>
        )}
      </footer>
    </div>
  );
}

type ZapamietanaSeria = { etap: string | null; gracze: SeriaGracz[] };

/**
 * Kto lata w pijanym finale i skąd rusza: z miejsc na końcu serii, zwycięzca przy szklance (od 24.10 widać,
 * że już dobiegł, zanim zacznie się chaos). Bez danych serii finaliści (albo wszyscy) startują z połowy drogi.
 */
function graczePijani(stan: StanSesji, seria: ZapamietanaSeria | null, gracze: GraczNaLiscie[]): GraczPijany[] {
  const n = Math.max(1, stan.etap?.liczba_pytan ?? 1);
  if (seria && seria.etap === (stan.etap?.id ?? null)) {
    const naDrodze = (g: SeriaGracz) => (stan.etap?.finalowy ? naDrodzeFinalu(g) : Math.min(1, g.dobre / n));
    const najlepszy = Math.max(0, ...seria.gracze.map(naDrodze));
    return seria.gracze.map((g) => ({
      nick: g.nick,
      zdjecie: g.zdjecie,
      start: naDrodze(g),
      lider: naDrodze(g) > 0 && naDrodze(g) === najlepszy,
    }));
  }
  return (stan.finalisci ?? gracze).map((g) => ({ nick: g.nick, zdjecie: g.zdjecie, start: 0.5, lider: false }));
}

function kluczEkranu(stan: StanSesji): string {
  if (stan.faza === "etap") return `etap:${stan.etap?.id ?? ""}`;
  // seria przechodzi w pijany finał bez wejścia nowego ekranu: te same drogi i awatary, potem chaos
  if (stan.faza === "seria" || stan.faza === "pijany") return `seria:${stan.etap?.id ?? ""}`;
  const pytanie = stan.faza === "przygotuj" || stan.faza === "pytanie" || stan.faza === "wynik";
  return `${pytanie ? "pytanie" : stan.faza}:${stan.zadanie?.nr ?? 0}`;
}

/** Podium (z wjazdem po kolei) i koniec gry (podium od razu + podziękowanie). */
function Koniec({ stan, ranking, przesuniecie }: { stan: StanSesji; ranking: WierszRankingu[]; przesuniecie: number }) {
  const koniec = stan.faza === "koniec";
  const bylaGra = stan.zadanie !== null && ranking.length > 0;
  return (
    <div className="tv-koniec">
      {/* nad podium tylko loga: tytuł quizu jest na dole, żeby nie wisiał nad zwycięzcą */}
      <header className="tv-naglowek">
        <Loga lokal={stan.lokal} browar={stan.browar} />
        <LogoNaglowka />
      </header>
      {bylaGra ? (
        <PodiumTv
          ranking={ranking}
          odRazu={koniec}
          // początek podium w zegarze tego urządzenia: TV i telefony odsłaniają miejsca razem
          start={stan.faza_od ? Date.parse(stan.faza_od) - przesuniecie : null}
          nagrody={stan.nagrody}
        />
      ) : (
        <div className="tv-srodek">
          <p className="tv-duzy">Koniec gry</p>
        </div>
      )}
      <p className="tv-koniec-tytul">
        {[stan.okazja, stan.quiz?.tytul ?? "Quiz", stan.lokal?.nazwa].filter(Boolean).join(" · ")}
      </p>
      {koniec && <p className="tv-dziekujemy">Dziękujemy za grę! Piwu Cześć!</p>}
    </div>
  );
}
