"use client";
/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase, logo Bractwa z /public */

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { Werble } from "@/components/werble";
import {
  komunikatBledu,
  pamiec,
  pobierzStan,
  useCzasSerwera,
  useKoniecPytania,
  useNasluch,
  zZegarem,
} from "@/lib/gra/nasluch";
import { najblizszeOdciecie } from "@/lib/gra/odpadanie";
import type { Dolaczenie, GraczNaLiscie, MojWynik, StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { wyslijZdjecie, ustawKolorKapsla } from "@/lib/zdjecie";
import { kiedyStart, opisOdliczania, useDoStartu } from "@/lib/gra/zapowiedz";
import { useKolejnaPodpowiedz } from "@/lib/gra/dodatki";
import { nazwaRodzaju, quizKlasyczny } from "@/lib/gra/wyscig";
import { EtapGracza } from "./etap";
import { Gotowy } from "./gotowy";
import { MojRanking } from "./moj-ranking";
import { PijanyFinal } from "./pijany";
import { zapamietajKoniecSerii } from "@/lib/pijany";
import { SeriaGracza } from "./seria";
import { KoniecGracza } from "./fanfara";
import { Kibicowanie } from "./kibic";
import { czyKibic, Miejsce, Rozgrywka, ZmianaMiejsca, type Ja } from "./rozgrywka";
import { UdostepnijWynik } from "./udostepnij";
import { ZdjecieGracza } from "./zdjecie-gracza";

const kluczTokenu = (kod: string) => `bractwo-quiz:gracz:${kod}`;

/** Ile nicków mieści się w poczekalni na telefonie; reszta jako „+N”. */
const NICKI_W_POCZEKALNI = 8;

function widoczni(gracze: GraczNaLiscie[], ja: string): GraczNaLiscie[] {
  if (gracze.length <= NICKI_W_POCZEKALNI) return gracze;
  const pierwsi = gracze.slice(0, NICKI_W_POCZEKALNI);
  if (pierwsi.some((g) => g.nick === ja)) return pierwsi;
  return [gracze.find((g) => g.nick === ja), ...pierwsi.slice(0, NICKI_W_POCZEKALNI - 1)].filter(
    (g): g is GraczNaLiscie => !!g,
  );
}

export function Gracz({ kod }: { kod: string }) {
  const [stan, ustawStan] = useState<StanSesji | null>(null);
  const [gracze, ustawGraczy] = useState<GraczNaLiscie[]>([]);
  const [bladGry, ustawBladGry] = useState<string | null>(null);
  const [ja, ustawJa] = useState<Ja | null>(null);
  const [sprawdzamToken, ustawSprawdzamToken] = useState(true);
  const [moj, ustawMoj] = useState<MojWynik | null>(null);
  const [mojWiersz, ustawMojWiersz] = useState<WierszRankingu | null>(null);
  // punkty grających od najwyższych: w etapie z odcięciem telefon mówi, ile brakuje do miejsca, które przechodzi
  // cały ranking: na telefonie wycinek tabeli wokół gracza (moj-ranking.tsx)
  const [ranking, ustawRanking] = useState<WierszRankingu[] | null>(null);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);
  const [usuniety, ustawUsuniety] = useState(false);
  // token w refie, żeby `pobierz` od razu po dołączeniu albo powrocie wiedział, czyj wynik pobrać
  const tokenRef = useRef<string | null>(null);
  const nickRef = useRef<string | null>(null);

  // Prowadzący usunął gracza: telefon zapomina token i wraca do dołączania.
  const wyrzuc = useCallback(() => {
    pamiec.usun(kluczTokenu(kod));
    tokenRef.current = null;
    nickRef.current = null;
    ustawJa(null);
    ustawMoj(null);
    ustawUsuniety(true);
  }, [kod]);

  const pobierz = useCallback(async () => {
    try {
      const { stan, przesuniecie } = await pobierzStan(kod);
      zapamietajKoniecSerii(stan);
      ustawStan(stan);
      ustawPrzesuniecie(przesuniecie);
      ustawBladGry(null);
      if (stan.faza === "poczekalnia") {
        const { data } = await supabase().rpc("lista_graczy", { p_kod: kod });
        if (data) {
          const lista = data as GraczNaLiscie[];
          ustawGraczy(lista);
          if (nickRef.current && !lista.some((g) => g.nick === nickRef.current)) wyrzuc();
        }
      } else if (tokenRef.current) {
        // po `stan_sesji`, więc faza w `moj_wynik` nigdy nie jest starsza niż w stanie
        const { data, error } = await supabase().rpc("moj_wynik", { p_token: tokenRef.current });
        if (error && komunikatBledu(error).includes("Nieznany gracz")) wyrzuc();
        if (data) {
          const nowy = data as MojWynik;
          ustawMoj(nowy);
          // zmiana miejsca i punkty za ostatnie pytanie są tylko w rankingu (nick w grze jest unikalny)
          if (nowy.faza === "ranking" || nowy.faza === "podium" || nowy.faza === "tabela" || nowy.faza === "koniec") {
            const r = await supabase().rpc("ranking", { p_kod: kod });
            if (r.data) {
              const wiersze = r.data as WierszRankingu[];
              ustawRanking(wiersze);
              ustawMojWiersz(wiersze.find((w) => w.nick === nowy.nick) ?? null);
            }
          }
        }
      }
    } catch (e) {
      const komunikat = komunikatBledu(e);
      // chwilowy brak sieci nie zasłania gry, którą już widać
      if (!komunikat.startsWith("Brak połączenia")) ustawBladGry(komunikat);
    }
  }, [kod, wyrzuc]);

  useNasluch(kod, pobierz, ["stan", "gracz"]);
  useKolejnaPodpowiedz(stan, przesuniecie, pobierz);

  // Powrót po odświeżeniu: token z localStorage, `dolacz` sprawdza, że to ta sama gra.
  // Powrót na innym telefonie: QR z pilota prowadzi na `/<kod>#powrot=<token>` (fragment nie trafia na serwer).
  useEffect(() => {
    const zLinku = /^#powrot=([0-9a-f]{64})$/.exec(window.location.hash)?.[1];
    if (zLinku) {
      pamiec.zapisz(kluczTokenu(kod), zLinku);
      window.history.replaceState(null, "", window.location.pathname);
    }
    const token = zLinku ?? pamiec.czytaj(kluczTokenu(kod));
    void (async () => {
      if (token) {
        const { data, error } = await supabase().rpc("dolacz", { p_kod: kod, p_nick: null, p_token: token });
        if (!error) {
          const d = data as Dolaczenie;
          tokenRef.current = d.token;
          nickRef.current = d.nick;
          ustawJa({ nick: d.nick, token: d.token });
          void pobierz();
        } else if (!komunikatBledu(error).startsWith("Brak połączenia")) {
          pamiec.usun(kluczTokenu(kod));
        }
      }
      ustawSprawdzamToken(false);
    })();
  }, [kod, pobierz]);

  if (bladGry && !stan) {
    return (
      <>
        <Naglowek />
        <h1>Nie ma takiej gry</h1>
        <p className="pomocniczy">
          Nie znaleźliśmy gry o kodzie <strong className="gra-kod">{kod}</strong>. Sprawdź kod na telewizorze.
        </p>
        <Link href="/" className="przycisk zloty">
          Wpisz inny kod
        </Link>
      </>
    );
  }

  if (!stan || sprawdzamToken) {
    return (
      <>
        <Naglowek lokal={stan?.lokal} browar={stan?.browar} napis={nazwaRodzaju(stan)} />
        <p className="pomocniczy">Łączę z grą…</p>
      </>
    );
  }

  if (!ja) {
    return (
      <>
        <Naglowek lokal={stan?.lokal} browar={stan?.browar} napis={nazwaRodzaju(stan)} />
        {stan.faza === "koniec" ? (
          <>
            <h1>Ta gra już się skończyła</h1>
            <p className="pomocniczy">Do zobaczenia na kolejnym quizie. Piwu Cześć!</p>
          </>
        ) : !stan.poczekalnia_otwarta ? (
          <>
            {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
            <h1>{stan.quiz?.tytul ?? "Quiz"}</h1>
            <p className="pomocniczy">
              Zapisy jeszcze nie ruszyły
              {stan.planowany_start ? ` (start ${kiedyStart(stan.planowany_start)})` : ""}. Gdy na telewizorze
              pojawi się kod QR, zeskanuj go albo odśwież tę stronę.
            </p>
          </>
        ) : (
          <>
            {usuniety && (
              <p className="blad" role="alert">
                Prowadzący usunął Cię z gry. Możesz dołączyć jeszcze raz.
              </p>
            )}
            <Dolacz
              kod={kod}
              stan={stan}
              onDolaczono={(d) => {
                pamiec.zapisz(kluczTokenu(kod), d.token);
                tokenRef.current = d.token;
                nickRef.current = d.nick;
                ustawUsuniety(false);
                ustawJa({ nick: d.nick, token: d.token });
                void pobierz();
              }}
            />
          </>
        )}
      </>
    );
  }

  return (
    <>
      <Naglowek lokal={stan?.lokal} browar={stan?.browar} napis={nazwaRodzaju(stan)} />
      <WGrze
        stan={stan}
        ja={ja}
        gracze={gracze}
        moj={moj}
        mojWiersz={mojWiersz}
        ranking={ranking}
        przesuniecie={przesuniecie}
        odswiez={pobierz}
      />
    </>
  );
}

/**
 * Nagłówek telefonu: jak na TV (26.10) lokal z lewej (obok gościnny browar), rodzaj gry na środku, Bractwo z prawej.
 * Wszystkie loga tej samej wysokości. Kod gry jest wewnętrzny (gracz wchodzi z QR), więc go nie pokazujemy.
 */
function Naglowek({
  lokal,
  browar,
  napis = "Quiz",
}: {
  lokal?: { nazwa: string; logo_url: string | null } | null;
  browar?: { nazwa: string; logo_url: string | null } | null;
  /** Rodzaj gry: „Wyścig po piwo” albo „Pub quiz” (`nazwaRodzaju`). */
  napis?: string;
}) {
  return (
    <header className="gra-naglowek trzy">
      <span className="gra-loga-gospodarzy">
        {lokal?.logo_url && <img src={lokal.logo_url} alt={lokal.nazwa} className="gra-logo" />}
        {browar?.logo_url && <img src={browar.logo_url} alt={browar.nazwa} className="gra-logo" />}
      </span>
      <span className="logo-quiz-napis gra-napis-quiz">{napis}</span>
      <img src="/loga/bractwo.svg" alt="Bractwo Piwne" className="logo-bractwo gra-logo" />
    </header>
  );
}

function Dolacz({ kod, stan, onDolaczono }: { kod: string; stan: StanSesji; onDolaczono: (d: Dolaczenie) => void }) {
  const [nick, ustawNick] = useState("");
  const [blad, ustawBlad] = useState<string | null>(null);
  const [wysylam, ustawWysylam] = useState<false | "gracz" | "zdjecie">(false);
  const [zdjecie, ustawZdjecie] = useState<{ blob: Blob; podglad: string } | null>(null);
  // kolor kapsla (null: nie wybrany; wtedy ze zdjęcia albo po nicku)
  const [kolor, ustawKolor] = useState<string | null>(null);
  const druzyny = stan.tryb === "druzyny";
  const pelna = stan.liczba_graczy >= stan.max_graczy;

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nick.trim() || wysylam) return;
        ustawWysylam("gracz");
        ustawBlad(null);
        const { data, error } = await supabase().rpc("dolacz", { p_kod: kod, p_nick: nick, p_token: null });
        if (error) {
          ustawWysylam(false);
          const komunikat = komunikatBledu(error);
          // nick jest unikalny w grze (bez względu na wielkość liter); gracz sam dopisuje coś od siebie
          ustawBlad(
            komunikat.includes("jest już zajęty")
              ? `Ktoś już gra jako „${nick.trim()}”. Dopisz coś od siebie, np. pierwszą literę nazwiska („${nick.trim()} K.”) albo przydomek.`
              : komunikat,
          );
          return;
        }
        const d = data as Dolaczenie;
        // zdjęcie po dołączeniu (potrzebny token); nieudane nie blokuje gry, można dodać je potem
        if (zdjecie) {
          ustawWysylam("zdjecie");
          await wyslijZdjecie(d.token, zdjecie.blob, kolor).catch(() => undefined);
        } else if (kolor) {
          await ustawKolorKapsla(d.token, kolor).catch(() => undefined);
        }
        ustawWysylam(false);
        onDolaczono(d);
      }}
    >
      {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
      <h1>{stan.quiz?.tytul ?? "Quiz"}</h1>
      {stan.lokal && <p className="pomocniczy">{stan.lokal.nazwa}</p>}
      {stan.browar && <p className="pomocniczy">Kranoprzejęcie: {stan.browar.nazwa}</p>}

      <label htmlFor="nick" className="etykieta">
        {druzyny ? "Nazwa drużyny" : "Imię albo nick"}
      </label>
      <input
        id="nick"
        className="pole"
        value={nick}
        onChange={(e) => ustawNick(e.target.value)}
        maxLength={24}
        autoComplete="nickname"
        autoFocus
        enterKeyHint="go"
      />
      <p className="pomocniczy" style={{ margin: "6px 0 0" }}>
        {druzyny
          ? "Jedna drużyna gra na jednym telefonie. Nazwa pojawi się na telewizorze."
          : "Pojawi się na telewizorze. Każdy w grze musi mieć inne."}
      </p>
      <ZdjecieGracza
        nick={nick}
        zdjecie={zdjecie?.podglad ?? null}
        onWybrano={(blob, podglad) => ustawZdjecie({ blob, podglad })}
        onUsun={() => ustawZdjecie(null)}
        kolor={kolor}
        onKolor={ustawKolor}
      />
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
      <button
        type="submit"
        className="przycisk zloty"
        style={{ marginTop: 18 }}
        disabled={!nick.trim() || !!wysylam || pelna}
      >
        {pelna
          ? "Komplet graczy"
          : wysylam === "zdjecie"
            ? "Wysyłam zdjęcie…"
            : wysylam
              ? "Dołączam…"
              : "Dołącz do gry"}
      </button>
    </form>
  );
}

function WGrze({
  stan,
  ja,
  gracze,
  moj,
  mojWiersz,
  ranking,
  przesuniecie,
  odswiez,
}: {
  stan: StanSesji;
  ja: Ja;
  gracze: GraczNaLiscie[];
  moj: MojWynik | null;
  mojWiersz: WierszRankingu | null;
  ranking: WierszRankingu[] | null;
  przesuniecie: number;
  odswiez: () => Promise<void>;
}) {
  // gęściej w odliczaniu, żeby pytanie odsłoniło się możliwie równo z TV
  const teraz = useCzasSerwera(przesuniecie, zZegarem(stan.faza), stan.faza === "przygotuj" ? 100 : 250);
  useKoniecPytania(stan.kod, stan, teraz);

  // podium, tabela i koniec to jeden ekran, żeby medal i konfetti nie startowały od nowa przy przejściach
  if (stan.faza === "podium" || stan.faza === "tabela" || stan.faza === "koniec") {
    return (
      <KoniecGracza
        stan={stan}
        faza={stan.faza}
        fazaOd={stan.faza_od}
        przesuniecie={przesuniecie}
        moj={moj}
        nick={ja.nick}
        kod={stan.kod}
        token={ja.token}
        nagrody={stan.nagrody}
        zdjecie={moj?.zdjecie ?? null}
      />
    );
  }

  if (stan.faza === "poczekalnia") {
    return (
      <>
        <p className="nadtytul">Jesteś w grze</p>
        <h1 style={{ color: "var(--zloto)", overflowWrap: "anywhere" }}>{ja.nick}</h1>
        {/* po dołączeniu kapsel jest zatwierdzony (27.10, Łukasz: bez poprawiania koloru i zdjęcia, żeby nie
            przeciągać), a zamiast tego godzina startu z odliczaniem, np. żeby zdążyć po piwo */}
        <div className="poczekalnia-kapsel">
          <Awatar nick={ja.nick} zdjecie={gracze.find((g) => g.nick === ja.nick)?.zdjecie ?? null} rozmiar={88} />
        </div>
        {stan.planowany_start ? (
          <StartWPoczekalni start={stan.planowany_start} przesuniecie={przesuniecie} />
        ) : (
          <p>Pytania pojawią się tutaj, gdy prowadzący wystartuje quiz.</p>
        )}
        <section style={{ marginTop: "var(--section-gap)" }}>
          <p className="etykieta">
            {stan.tryb === "druzyny" ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}/{stan.max_graczy}
          </p>
          {/* przy wielu graczach tylko część listy (z Tobą), żeby ekran nie przewijał się */}
          <ul className="nicki">
            {widoczni(gracze, ja.nick).map((g) => (
              <li key={g.nick} className={g.nick === ja.nick ? "ja" : undefined}>
                <Awatar nick={g.nick} zdjecie={g.zdjecie} rozmiar={26} />
                {g.nick}
              </li>
            ))}
            {gracze.length > NICKI_W_POCZEKALNI && <li>+{gracze.length - NICKI_W_POCZEKALNI}</li>}
          </ul>
        </section>
      </>
    );
  }

  // klasyczny pub quiz: plansza startowa z odliczaniem (10 s), potem samo 1. pytanie
  if (stan.faza === "wstep" && quizKlasyczny(stan)) {
    const ile = stan.faza_do ? Math.max(0, Math.ceil((Date.parse(stan.faza_do) - teraz) / 1000)) : 0;
    return (
      <>
        <p className="nadtytul">{ja.nick}</p>
        <h1>Zaczynamy!</h1>
        <p>
          {ile > 0 ? (
            <>
              Pierwsze pytanie za <strong className="gra-kod">{ile}</strong> s. Kto szybciej, ten więcej punktów.
            </>
          ) : (
            "Pierwsze pytanie już leci!"
          )}
        </p>
      </>
    );
  }

  // wstęp przed 1. etapem: prowadzący opowiada całą drogę, telefon tylko odsyła do TV
  if (stan.faza === "wstep") {
    return (
      <>
        <p className="nadtytul">{ja.nick}</p>
        <h1>Zaraz zaczynamy!</h1>
        <p>Patrz na telewizor: prowadzący opowie, jak wygląda wyścig po piwo.</p>
        <Gotowy stan={stan} token={ja.token} />
      </>
    );
  }

  if (stan.faza === "seria") {
    return <SeriaGracza stan={stan} ja={ja} teraz={teraz} />;
  }

  if (stan.faza === "pijany") {
    // kibic nie gra dogrywki (25.10), tylko dalej dopinguje finalistów (od 26.10 także w dogrywce)
    if (czyKibic(stan, ja.nick)) return <Kibicowanie stan={stan} ja={ja} teraz={teraz} />;
    return <PijanyFinal stan={stan} teraz={teraz} />;
  }

  if (stan.faza === "werble") {
    // po pijanym finale telefon już zgasł z błyskiem (pijany.tsx): teraz tylko napis wchodzi na czerni
    return <Werble blysk={!stan.pijany_final} />;
  }

  // odpadł w etapie przed finałem: do finału tylko patrzy na TV (w finale kibicuje jak reszta, EtapGracza i seria)
  if (
    moj?.odpadl != null &&
    !stan.etap?.finalowy &&
    ["etap", "przygotuj", "pytanie", "wynik", "odpowiedzi", "ranking"].includes(stan.faza)
  ) {
    return <Odpadl nick={ja.nick} moj={moj} stan={stan} />;
  }

  // plansza finału u kogoś spoza trójki (odpadł w walce o finał albo wcześniej): bez „Gotowy”, za chwilę kibicuje
  if (stan.faza === "etap" && stan.etap?.finalowy && czyKibic(stan, ja.nick)) {
    return (
      <>
        <p className="nadtytul gra-ja">
          <Awatar nick={ja.nick} zdjecie={moj?.zdjecie ?? null} rozmiar={40} />
          {ja.nick}
        </p>
        <h1>Finał bez Ciebie</h1>
        {moj && <Miejsce moj={moj} />}
        <p className="etap-uwaga">
          Niestety nie wchodzisz do finału. Za chwilę zacznie się wyścig trójki, a Ty stąd, z telefonu, będziesz
          kibicować finalistom: Twoje okrzyki pojawią się na telewizorze.
        </p>
      </>
    );
  }

  if (stan.faza === "etap") {
    return (
      <>
        <EtapGracza stan={stan} nick={ja.nick} />
        <Gotowy stan={stan} token={ja.token} />
      </>
    );
  }

  if (stan.faza === "ranking") {
    // rozgrzewka (1. etap) bez statusu, chyba że już po niej ktoś odpada: nikogo nie stresujemy na starcie
    const dalsze = najblizszeOdciecie(stan);
    const nastepne = stan.etap?.nr === 1 && dalsze?.poEtapie !== 1 ? null : dalsze;
    return (
      <>
        {/* awatar obok nicku: gracz od razu widzi, że to jego wynik */}
        <p className="nadtytul gra-ja">
          <Awatar nick={ja.nick} zdjecie={moj?.zdjecie ?? null} rozmiar={40} />
          {ja.nick}
        </p>
        <h1>{stan.etap && stan.ostatnie_w_etapie ? `Koniec etapu ${stan.etap.nr}` : "Ranking"}</h1>
        {/* miejsce zielone albo czerwone względem najbliższego odcięcia zamiast opisu (26.10) */}
        {moj && (
          <Miejsce
            moj={moj}
            status={mojWiersz && nastepne ? (mojWiersz.miejsce <= nastepne.ile ? "na-drodze" : "zagrozony") : null}
          />
        )}
        {mojWiersz && <ZmianaMiejsca w={mojWiersz} />}
        {/* wycinek tabeli z Tobą w środku (26.10); bez szklanki na telefonie (wyścig jest na TV) */}
        {ranking && <MojRanking key={`ranking-${stan.zadanie?.nr ?? 0}`} wiersze={ranking} nick={ja.nick} />}
      </>
    );
  }

  return <Rozgrywka stan={stan} ja={ja} moj={moj} teraz={teraz} odswiez={odswiez} />;
}

/**
 * Gracz, który odpadł w etapie przed finałem: do finału patrzy na TV, a w finale kibicuje finalistom z telefonu.
 * Grafikę na pamiątkę może pobrać od razu (26.10), z miejscem z chwili odpadnięcia.
 */
function Odpadl({ nick, moj, stan }: { nick: string; moj: MojWynik; stan: StanSesji }) {
  return (
    <>
      <p className="nadtytul gra-ja">
        <Awatar nick={nick} zdjecie={moj.zdjecie} rozmiar={40} />
        {nick}
      </p>
      <h1>Odpadasz po {moj.odpadl}. etapie</h1>
      <Miejsce moj={moj} />
      <p className="etap-uwaga">
        Dzięki za walkę! Zostań z nami do finału: wtedy stąd, z telefonu, będziesz kibicować finalistom, a Twoje
        okrzyki pojawią się na telewizorze.
      </p>
      <UdostepnijWynik
        wynik={{
          tytul: stan.quiz?.tytul ?? "Quiz",
          okazja: stan.okazja ?? nazwaRodzaju(stan),
          lokal: stan.lokal,
          browar: stan.browar,
          data: new Date().toLocaleDateString("pl-PL"),
          nick,
          zdjecie: moj.zdjecie,
          miejsce: moj.miejsce,
          liczbaGraczy: moj.liczba_graczy,
          punkty: moj.punkty,
        }}
        konta={[stan.lokal?.instagram, stan.browar?.instagram]}
      />
    </>
  );
}

/** Poczekalnia po dołączeniu: kiedy start i ile zostało (po czasie „Zaraz zaczynamy!”). */
function StartWPoczekalni({ start, przesuniecie }: { start: string; przesuniecie: number }) {
  const doStartu = useDoStartu(start, przesuniecie);
  return (
    <p className="poczekalnia-start">
      <span>
        Start <strong>{kiedyStart(start)}</strong>
      </span>
      {doStartu !== null && <span className="poczekalnia-odliczanie">{opisOdliczania(doStartu)}</span>}
    </p>
  );
}
