"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { LogoQuiz } from "@/components/logo-quiz";
import { usePotwierdzenie, type OpcjePotwierdzenia } from "@/components/okno";
import {
  fazaTeraz,
  komunikatBledu,
  pamiec,
  przesuniecieZegara,
  useCzasSerwera,
  useNasluch,
} from "@/lib/gra/nasluch";
import type { AkcjaPilota, FazaWidoczna, PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

const kluczPilota = (kod: string) => `bractwo-quiz:pilot:${kod}`;
const LITERY = "ABCDEF";

const NAZWY: Record<FazaWidoczna, string> = {
  poczekalnia: "Poczekalnia",
  przygotuj: "Odliczanie",
  pytanie: "Pytanie trwa",
  wynik: "Wynik",
  ranking: "Ranking",
  podium: "Podium",
  koniec: "Gra zakończona",
};

const bezSubskrypcji = () => () => {};

type Props = { kod: string; tokenZAdresu: string | null };

export function Pilot({ kod, tokenZAdresu }: Props) {
  // Token z linku zapisujemy w localStorage i usuwamy z paska adresu,
  // żeby nie wyciekł przy pokazywaniu ekranu. Odświeżenie strony bierze go z pamięci.
  const zamontowany = useSyncExternalStore(bezSubskrypcji, () => true, () => false);
  const zPamieci = useSyncExternalStore(bezSubskrypcji, () => pamiec.czytaj(kluczPilota(kod)), () => null);
  const token = tokenZAdresu ?? zPamieci;

  // Zapis dopiero po udanym `pilot_stan`, żeby zły link nie nadpisał dobrego tokenu.
  const zapamietany = useRef(false);
  const zapamietaj = useCallback(() => {
    if (zapamietany.current || !tokenZAdresu) return;
    zapamietany.current = true;
    if (pamiec.zapisz(kluczPilota(kod), tokenZAdresu)) {
      window.history.replaceState(null, "", `/pilot/${kod}`);
    }
  }, [kod, tokenZAdresu]);

  const [stan, ustawStan] = useState<PilotStan | null>(null);
  const [gracze, ustawGraczy] = useState<string[]>([]);
  const [przesuniecie, ustawPrzesuniecie] = useState(0);
  const [bladDostepu, ustawBladDostepu] = useState<string | null>(null);
  const [bladSieci, ustawBladSieci] = useState<string | null>(null);
  const [bladAkcji, ustawBladAkcji] = useState<string | null>(null);
  const [wysylam, ustawWysylam] = useState(false);

  const pobierz = useCallback(async () => {
    if (!token) return;
    const wyslano = Date.now();
    const [s, g] = await Promise.all([
      supabase().rpc("pilot_stan", { p_kod: kod, p_host_token: token }),
      supabase().rpc("gracze_sesji", { p_kod: kod }),
    ]);
    const odebrano = Date.now();
    if (s.error) {
      const komunikat = komunikatBledu(s.error);
      if (komunikat.startsWith("Brak połączenia")) ustawBladSieci(komunikat);
      else ustawBladDostepu(komunikat);
      return;
    }
    const nowy = s.data as PilotStan;
    ustawStan(nowy);
    ustawPrzesuniecie(przesuniecieZegara(nowy.teraz, wyslano, odebrano));
    if (g.data) ustawGraczy(g.data as string[]);
    ustawBladDostepu(null);
    ustawBladSieci(null);
    zapamietaj();
  }, [kod, token, zapamietaj]);

  useNasluch(kod, pobierz, ["stan", "gracz", "odpowiedz"]);

  const liczy = stan?.faza === "przygotuj" || stan?.faza === "pytanie";
  const teraz = useCzasSerwera(przesuniecie, liczy);
  const [potwierdz, oknoPotwierdzenia] = usePotwierdzenie();

  if (!zamontowany) {
    return <Naglowek kod={kod} />;
  }

  if (!token || (bladDostepu && !stan)) {
    return (
      <>
        <Naglowek kod={kod} />
        <h1>Brak dostępu do pilota</h1>
        <p className="pomocniczy">
          Ten link pilota jest nieprawidłowy albo niepełny. Zeskanuj kod QR pilota z ekranu gry w panelu admina.
        </p>
      </>
    );
  }

  if (!stan) {
    return (
      <>
        <Naglowek kod={kod} />
        <p className="pomocniczy">{bladSieci ?? "Łączę z grą…"}</p>
      </>
    );
  }

  async function akcja(a: AkcjaPilota, pytanie?: string, opcje?: OpcjePotwierdzenia) {
    if (wysylam || !token) return;
    if (pytanie && !(await potwierdz(pytanie, opcje))) return;
    ustawWysylam(true);
    ustawBladAkcji(null);
    const wyslano = Date.now();
    const { data, error } = await supabase().rpc("pilot_akcja", { p_kod: kod, p_host_token: token, p_akcja: a });
    const odebrano = Date.now();
    ustawWysylam(false);
    if (error) {
      ustawBladAkcji(komunikatBledu(error));
      void pobierz();
      return;
    }
    const nowy = data as PilotStan;
    ustawStan(nowy);
    ustawPrzesuniecie(przesuniecieZegara(nowy.teraz, wyslano, odebrano));
  }

  // `przygotuj` przechodzi w `pytanie` sam, gdy minie `faza_od`; nie czekamy na odpytanie bazy
  const { faza, doStartu, doKonca, bezLimitu } = fazaTeraz(stan, teraz);
  const wszyscy = stan.liczba_graczy > 0 && stan.liczba_odpowiedzi >= stan.liczba_graczy;
  const z = stan.zadanie;
  const liczba = stan.quiz?.liczba_zadan ?? 0;
  const druzyny = stan.tryb === "druzyny";
  const nastepne = stan.ostatnie_zadanie
    ? { akcja: "podium" as const, napis: "Pokaż podium" }
    : { akcja: "nastepne" as const, napis: z ? `Następne pytanie (${z.lp + 1}/${liczba})` : "Start quizu" };

  return (
    <>
      <Naglowek kod={kod} />
      {stan.okazja && <p className="nadtytul">{stan.okazja}</p>}
      <h1 style={{ marginBottom: 4 }}>{stan.quiz?.tytul ?? "Quiz"}</h1>
      <p className="pomocniczy" style={{ marginTop: 0 }}>
        {[stan.lokal?.nazwa, NAZWY[faza]].filter(Boolean).join(" · ")}
      </p>

      {faza === "poczekalnia" && (
        <section className="karta" style={{ marginTop: 18 }}>
          <p className="etykieta" style={{ marginTop: 0 }}>
            {druzyny ? "Drużyny" : "Gracze"} · {stan.liczba_graczy}/{stan.max_graczy}
          </p>
          {gracze.length === 0 ? (
            <p className="pomocniczy" style={{ margin: 0 }}>
              Nikt jeszcze nie dołączył. Gracze skanują QR z telewizora.
            </p>
          ) : (
            <ul className="nicki">
              {gracze.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>
          )}
        </section>
      )}

      {z && faza !== "poczekalnia" && faza !== "koniec" && faza !== "podium" && (
        <section className="karta" style={{ marginTop: 18 }}>
          <p className="etykieta" style={{ marginTop: 0, display: "flex", justifyContent: "space-between" }}>
            <span>
              Pytanie {z.lp}/{liczba}
            </span>
            {faza === "przygotuj" && <span className="gra-kod">start za {Math.max(0, Math.ceil(doStartu / 1000))} s</span>}
            {faza === "pytanie" && (
              <span className="gra-kod">
                {bezLimitu ? "bez limitu" : doKonca > 0 ? `${Math.ceil(doKonca / 1000)} s` : wszyscy ? "wszyscy odpowiedzieli" : "czas minął"}
              </span>
            )}
          </p>
          <p style={{ fontWeight: "var(--w-black)", margin: "0 0 12px" }}>{z.tresc}</p>
          <ol className="pilot-odpowiedzi">
            {z.dane.odpowiedzi.map((o, i) => (
              <li key={i} className={i === stan.poprawna ? "poprawna" : undefined}>
                <span className="pilot-litera">{LITERY[i]}</span>
                {o}
                {i === stan.poprawna && <span className="ok"> ✓</span>}
                {z.rozklad && <span className="pilot-liczba">{z.rozklad[i] ?? 0}</span>}
              </li>
            ))}
          </ol>
          <p style={{ margin: "14px 0 0" }}>
            Odpowiedziało{" "}
            <strong className="gra-kod">
              {stan.liczba_odpowiedzi}/{stan.liczba_graczy}
            </strong>
            {z.liczba_poprawnych !== undefined && (
              <>
                {" · "}dobrze <strong className="ok">{z.liczba_poprawnych}</strong>
              </>
            )}
          </p>
        </section>
      )}

      {bladAkcji && (
        <p className="blad" role="alert">
          {bladAkcji}
        </p>
      )}
      {bladSieci && <p className="pomocniczy">{bladSieci}, ponawiam…</p>}

      <section style={{ marginTop: "var(--section-gap)", display: "grid", gap: 12 }}>
        {faza === "poczekalnia" && (
          <button
            className="przycisk zloty"
            disabled={wysylam || liczba === 0}
            onClick={() =>
              akcja(
                "nastepne",
                stan.liczba_graczy === 0 ? "Nikt jeszcze nie dołączył. Wystartować mimo to?" : undefined,
                { tak: "Wystartuj" },
              )
            }
          >
            {liczba === 0 ? "Quiz nie ma pytań" : "Start quizu"}
          </button>
        )}

        {(faza === "przygotuj" || faza === "pytanie") && (
          <button
            className="przycisk zloty"
            disabled={wysylam}
            onClick={() =>
              akcja(
                "wynik",
                bezLimitu
                  ? wszyscy
                    ? undefined
                    : "Nie wszyscy odpowiedzieli. Zakończyć pytanie teraz i pokazać wynik?"
                  : doKonca > 0
                    ? "Czas jeszcze leci. Zakończyć pytanie teraz i pokazać wynik?"
                    : undefined,
                { tak: "Pokaż wynik" },
              )
            }
          >
            Pokaż wynik
          </button>
        )}

        {faza === "wynik" && (
          <>
            <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("ranking")}>
              Pokaż ranking
            </button>
            <button className="przycisk" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
              {nastepne.napis}
            </button>
          </>
        )}

        {faza === "ranking" && (
          <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja(nastepne.akcja)}>
            {nastepne.napis}
          </button>
        )}

        {faza === "podium" && (
          <button className="przycisk zloty" disabled={wysylam} onClick={() => akcja("koniec")}>
            Zakończ grę
          </button>
        )}

        {faza === "koniec" && <p className="pomocniczy">Gra zakończona. Piwu Cześć!</p>}

        {faza !== "koniec" && faza !== "podium" && (
          <button
            className="przycisk-cichy"
            style={{ marginTop: 24 }}
            disabled={wysylam}
            onClick={() => akcja("koniec", "Zakończyć grę teraz? Tego nie da się cofnąć.", { tak: "Zakończ grę", niebezpieczne: true })}
          >
            Zakończ grę
          </button>
        )}
      </section>
      {oknoPotwierdzenia}
    </>
  );
}

function Naglowek({ kod }: { kod: string }) {
  return (
    <header className="gra-naglowek">
      <LogoQuiz wysokosc={40} dopisek="pilot" />
      <span className="gra-kod">{kod}</span>
    </header>
  );
}
