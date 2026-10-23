"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Awatar } from "@/components/awatar";
import { LogoQuiz } from "@/components/logo-quiz";
import { komunikatBledu, pamiec, pobierzStan, useCzasSerwera, useKoniecPytania, useNasluch } from "@/lib/gra/nasluch";
import type { Dolaczenie, GraczNaLiscie, MojWynik, StanSesji, WierszRankingu } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { usunZdjecie, wyslijZdjecie } from "@/lib/zdjecie";
import { godzinaStartu } from "@/lib/gra/zapowiedz";
import { useKolejnaPodpowiedz } from "@/lib/gra/dodatki";
import { EtapGracza } from "./etap";
import { KoniecGracza } from "./fanfara";
import { Miejsce, Rozgrywka, ZmianaMiejsca, type Ja } from "./rozgrywka";
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
            if (r.data) ustawMojWiersz((r.data as WierszRankingu[]).find((w) => w.nick === nowy.nick) ?? null);
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
        <Naglowek kod={kod} />
        <h1>Nie ma takiej gry</h1>
        <p className="pomocniczy">
          Nie znaleźliśmy gry o kodzie <strong className="gra-kod">{kod}</strong>. Sprawdź kod na telewizorze.
        </p>
        <p>
          <Link href="/">← Wpisz inny kod</Link>
        </p>
      </>
    );
  }

  if (!stan || sprawdzamToken) {
    return (
      <>
        <Naglowek kod={kod} />
        <p className="pomocniczy">Łączę z grą…</p>
      </>
    );
  }

  if (!ja) {
    return (
      <>
        <Naglowek kod={kod} />
        {stan.faza === "koniec" ? (
          <>
            <h1>Ta gra już się skończyła</h1>
            <p className="pomocniczy">Piwu Cześć! Do zobaczenia na kolejnym quizie.</p>
          </>
        ) : !stan.poczekalnia_otwarta ? (
          <>
            {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
            <h1>{stan.quiz?.tytul ?? "Quiz"}</h1>
            <p className="pomocniczy">
              Zapisy jeszcze nie ruszyły
              {stan.planowany_start ? ` (start o ${godzinaStartu(stan.planowany_start)})` : ""}. Gdy na telewizorze
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
      <Naglowek kod={kod} />
      <WGrze
        stan={stan}
        ja={ja}
        gracze={gracze}
        moj={moj}
        mojWiersz={mojWiersz}
        przesuniecie={przesuniecie}
        odswiez={pobierz}
      />
    </>
  );
}

function Naglowek({ kod }: { kod: string }) {
  return (
    <header className="gra-naglowek">
      <LogoQuiz wysokosc={40} />
      <span className="gra-kod">{kod}</span>
    </header>
  );
}

function Dolacz({ kod, stan, onDolaczono }: { kod: string; stan: StanSesji; onDolaczono: (d: Dolaczenie) => void }) {
  const [nick, ustawNick] = useState("");
  const [blad, ustawBlad] = useState<string | null>(null);
  const [wysylam, ustawWysylam] = useState<false | "gracz" | "zdjecie">(false);
  const [zdjecie, ustawZdjecie] = useState<{ blob: Blob; podglad: string } | null>(null);
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
          await wyslijZdjecie(d.token, zdjecie.blob).catch(() => undefined);
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
  przesuniecie,
  odswiez,
}: {
  stan: StanSesji;
  ja: Ja;
  gracze: GraczNaLiscie[];
  moj: MojWynik | null;
  mojWiersz: WierszRankingu | null;
  przesuniecie: number;
  odswiez: () => Promise<void>;
}) {
  const liczy = stan.faza === "przygotuj" || stan.faza === "pytanie";
  // gęściej w odliczaniu, żeby pytanie odsłoniło się możliwie równo z TV
  const teraz = useCzasSerwera(przesuniecie, liczy, stan.faza === "przygotuj" ? 100 : 250);
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
        <ZdjecieGracza
          nick={ja.nick}
          zdjecie={gracze.find((g) => g.nick === ja.nick)?.zdjecie ?? null}
          onWybrano={async (blob) => {
            await wyslijZdjecie(ja.token, blob);
            await odswiez();
          }}
          onUsun={async () => {
            await usunZdjecie({ token: ja.token });
            await odswiez();
          }}
        />
        <p>Patrz na telewizor. Pytania pojawią się tutaj, gdy prowadzący wystartuje quiz.</p>
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

  if (stan.faza === "etap") {
    return <EtapGracza stan={stan} nick={ja.nick} />;
  }

  if (stan.faza === "ranking") {
    return (
      <>
        <p className="nadtytul">{ja.nick}</p>
        <h1>Ranking</h1>
        {moj && <Miejsce moj={moj} />}
        {mojWiersz && <ZmianaMiejsca w={mojWiersz} />}
      </>
    );
  }

  return <Rozgrywka stan={stan} ja={ja} moj={moj} teraz={teraz} odswiez={odswiez} />;
}
