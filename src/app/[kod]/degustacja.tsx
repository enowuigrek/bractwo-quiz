"use client";

import { useEffect, useRef, useState } from "react";
import type { StanSesji } from "@/lib/gra/typy";
import { komunikatBledu } from "@/lib/gra/nasluch";
import { zapiszZPonowieniem } from "@/lib/gra/zapis";
import { supabase } from "@/lib/supabase/przegladarka";
import {
  GRUPY_AROMATOW,
  KLAROWNOSC,
  KOLORY,
  SUWAKI,
  WADY,
  czystaKarta,
  napisOceny,
  napisSlowa,
  slowoSuwaka,
  wynikiSali,
  type KartaPiwa,
  type KartyPiwa,
  type Suwak,
} from "@/lib/degustacja";
import { opisPiwa } from "@/lib/zadania";
import type { Ja } from "./rozgrywka";

type MojaKarta = { zadanie_id: string; dane: KartaPiwa };

/**
 * Degustacja na telefonie (02.11, docs/DEGUSTACJA.md): w trakcie oceniania karta krok po kroku (wygląd, aromat,
 * smak, w ustach, wady, ocena), po „Pokaż wyniki” twoja karta obok sali, a na koniec „Twoja degustacja”. Karta zapisuje
 * się przy każdym kroku (`zapisz_karte`) i do zamknięcia oceniania można ją poprawiać.
 */
export function DegustacjaGracza({ stan, ja }: { stan: StanSesji; ja: Ja }) {
  const z = stan.zadanie;
  const [moje, ustawMoje] = useState<MojaKarta[] | null>(null);
  const [sala, ustawSale] = useState<KartyPiwa[]>([]);

  // własne karty (powrót do karty po odświeżeniu) i, po zamknięciu oceniania, karty sali
  useEffect(() => {
    let aktualne = true;
    void Promise.all([
      supabase().rpc("moje_karty", { p_token: ja.token }),
      stan.faza === "pytanie" ? Promise.resolve({ data: null }) : supabase().rpc("karty_degustacji", { p_kod: stan.kod }),
    ]).then(([m, s]) => {
      if (!aktualne) return;
      if (m.data) ustawMoje(m.data as MojaKarta[]);
      if (s.data) ustawSale(s.data as KartyPiwa[]);
    });
    return () => {
      aktualne = false;
    };
  }, [ja.token, stan.kod, stan.faza, z?.id]);

  if (!z) return <p className="pomocniczy">Za chwilę następne piwo.</p>;
  const moja = moje?.find((k) => k.zadanie_id === z.id)?.dane;

  if (stan.faza === "podium" || stan.faza === "tabela" || stan.faza === "koniec") {
    return <TwojaDegustacja moje={moje ?? []} sala={sala} stan={stan} />;
  }

  const naglowek = (
    <>
      <p className="etykieta gra-pasek">
        <span>
          Piwo {z.lp}
          {stan.quiz ? ` z ${stan.quiz.liczba_zadan}` : ""}
        </span>
      </p>
      <h2 className="gra-pytanie degustacja-nazwa">{z.tresc}</h2>
      {opisPiwa(z.dane) && <p className="degustacja-opis">{opisPiwa(z.dane)}</p>}
    </>
  );

  if (stan.faza === "pytanie") {
    // karta startuje od zapisanej (powrót po odświeżeniu); dopóki nie przyszła z bazy, czekamy
    if (moje === null) return naglowek;
    return (
      <>
        {naglowek}
        <Karta key={z.id} zadanieId={z.id} token={ja.token} poczatek={moja ?? {}} />
      </>
    );
  }

  const karty = sala.find((s) => s.zadanie_id === z.id)?.karty ?? [];
  return (
    <>
      {naglowek}
      <TyISala moja={moja ?? {}} karty={karty} />
    </>
  );
}

const KROKI = ["Wygląd", "Aromat", "Smak", "W ustach", "Coś nie gra?", "Ocena"] as const;

function Karta({
  zadanieId,
  token,
  poczatek,
}: {
  zadanieId: string;
  token: string;
  poczatek: KartaPiwa;
}) {
  // gotowa karta wraca od podsumowania, pusta od pierwszego kroku
  const [krok, ustawKrok] = useState(poczatek.ocena !== undefined ? KROKI.length : 0);
  const [karta, ustawKarte] = useState<KartaPiwa>(poczatek);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [zapisuje, ustawZapisuje] = useState(false);
  const ostatnia = useRef(JSON.stringify(czystaKarta(poczatek)));
  const zmien = (zmiany: Partial<KartaPiwa>) => ustawKarte((k) => ({ ...k, ...zmiany }));

  async function zapisz(): Promise<boolean> {
    const dane = czystaKarta(karta);
    const json = JSON.stringify(dane);
    if (json === ostatnia.current) return true;
    ustawZapisuje(true);
    const { data, error } = await zapiszZPonowieniem("zapisz_karte", {
      p_token: token,
      p_zadanie_id: zadanieId,
      p_dane: dane,
    });
    ustawZapisuje(false);
    if (error) {
      ustawBlad(`${komunikatBledu(error)}. Spróbuj jeszcze raz.`);
      return false;
    }
    if (!(data as { przyjeta: boolean }).przyjeta) {
      ustawBlad("Ocenianie tego piwa już się skończyło.");
      return false;
    }
    ostatnia.current = json;
    ustawBlad(null);
    return true;
  }

  async function idz(nowy: number) {
    if (await zapisz()) {
      ustawKrok(nowy);
      window.scrollTo({ top: 0 });
    }
  }

  if (krok >= KROKI.length) {
    return (
      <div className="karta-gotowa">
        <p className="karta-gotowa-napis">Karta zapisana</p>
        {karta.ocena !== undefined && <Gwiazdki ocena={karta.ocena} />}
        <p className="pomocniczy">Wyniki sali pokażą się na telewizorze.</p>
        <button type="button" className="przycisk" onClick={() => ustawKrok(0)}>
          Popraw kartę
        </button>
      </div>
    );
  }

  return (
    <div className="karta-degustacji">
      <ol className="karta-kroki" aria-label="Kroki karty">
        {KROKI.map((k, i) => (
          <li key={k} className={i === krok ? "teraz" : i < krok ? "zrobiony" : undefined}>
            <button type="button" onClick={() => void idz(i)} aria-label={k} aria-current={i === krok || undefined} />
          </li>
        ))}
      </ol>
      <h3 className="karta-krok-nazwa">{KROKI[krok]}</h3>

      {krok === 0 && (
        <>
          <div className="karta-kolory">
            {KOLORY.map((k, i) => (
              <button
                key={k.napis}
                type="button"
                className={`karta-kolor${karta.kolor === i ? " wybrany" : ""}`}
                aria-pressed={karta.kolor === i}
                onClick={() => zmien({ kolor: karta.kolor === i ? undefined : i })}
              >
                <span style={{ background: k.kolor }} aria-hidden />
                {k.napis}
              </button>
            ))}
          </div>
          <div className="karta-opcje">
            {KLAROWNOSC.map((k, i) => (
              <button
                key={k}
                type="button"
                className={`slowo${karta.klarownosc === i ? " wybrane" : ""}`}
                aria-pressed={karta.klarownosc === i}
                onClick={() => zmien({ klarownosc: karta.klarownosc === i ? undefined : i })}
              >
                {k}
              </button>
            ))}
          </div>
          {SUWAKI.wyglad.map((s) => (
            <SuwakKarty key={s.pole} s={s} karta={karta} zmien={zmien} />
          ))}
        </>
      )}

      {(krok === 1 || krok === 2) && (
        <>
          {krok === 2 &&
            SUWAKI.smak.map((s) => <SuwakKarty key={s.pole} s={s} karta={karta} zmien={zmien} />)}
          <Slowa pole={krok === 1 ? "aromaty" : "smaki"} karta={karta} zmien={zmien} />
          {krok === 1 && SUWAKI.aromat.map((s) => <SuwakKarty key={s.pole} s={s} karta={karta} zmien={zmien} />)}
        </>
      )}

      {krok === 3 && SUWAKI.usta.map((s) => <SuwakKarty key={s.pole} s={s} karta={karta} zmien={zmien} />)}

      {krok === 4 && (
        <>
          <div className="karta-slowa">
            {WADY.map((w) => {
              const wybrane = karta.wady?.includes(w.klucz) ?? false;
              return (
                <button
                  key={w.klucz}
                  type="button"
                  className={`slowo slowo-wada${wybrane ? " wybrane" : ""}`}
                  aria-pressed={wybrane}
                  onClick={() =>
                    zmien({
                      bez_wad: false,
                      wady: wybrane
                        ? (karta.wady ?? []).filter((x) => x !== w.klucz)
                        : [...(karta.wady ?? []), w.klucz],
                    })
                  }
                >
                  {w.napis}
                  <small>{w.opis}</small>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className={`slowo slowo-szerokie${karta.bez_wad ? " wybrane" : ""}`}
            aria-pressed={!!karta.bez_wad}
            onClick={() => zmien({ bez_wad: !karta.bez_wad, wady: [] })}
          >
            Nic nie czuję, wszystko gra
          </button>
        </>
      )}

      {krok === 5 && (
        <>
          <WyborGwiazdek ocena={karta.ocena} onZmiana={(ocena) => zmien({ ocena })} />
          <p className="karta-pytanie">Wypił(a)bym jeszcze jedno?</p>
          <div className="karta-opcje karta-opcje-dwie">
            {[
              [true, "Tak"],
              [false, "Nie"],
            ].map(([w, napis]) => (
              <button
                key={String(w)}
                type="button"
                className={`slowo${karta.jeszcze === w ? " wybrane" : ""}`}
                aria-pressed={karta.jeszcze === w}
                onClick={() => zmien({ jeszcze: karta.jeszcze === w ? undefined : (w as boolean) })}
              >
                {napis as string}
              </button>
            ))}
          </div>
          <label className="karta-pytanie" htmlFor="notatka">
            Słowo dla piwowara
          </label>
          <textarea
            id="notatka"
            className="pole"
            rows={3}
            maxLength={300}
            value={karta.notatka ?? ""}
            onChange={(e) => zmien({ notatka: e.target.value })}
          />
        </>
      )}

      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
      <div className="karta-nawigacja">
        <button type="button" className="przycisk" disabled={krok === 0 || zapisuje} onClick={() => void idz(krok - 1)}>
          Wstecz
        </button>
        <button type="button" className="przycisk zloty" disabled={zapisuje} onClick={() => void idz(krok + 1)}>
          {krok === KROKI.length - 1 ? "Gotowe" : "Dalej"}
        </button>
      </div>
    </div>
  );
}

/** Kafelki aromatów albo smaków w grupach. */
function Slowa({
  pole,
  karta,
  zmien,
}: {
  pole: "aromaty" | "smaki";
  karta: KartaPiwa;
  zmien: (z: Partial<KartaPiwa>) => void;
}) {
  const wybrane = karta[pole] ?? [];
  return (
    <>
      {GRUPY_AROMATOW.map((g) => (
        <section key={g.nazwa} className="karta-grupa">
          <p className="etykieta">{g.nazwa}</p>
          <div className="karta-slowa">
            {g.slowa.map((s) => {
              const tak = wybrane.includes(s.klucz);
              return (
                <button
                  key={s.klucz}
                  type="button"
                  className={`slowo${tak ? " wybrane" : ""}`}
                  aria-pressed={tak}
                  onClick={() =>
                    zmien({ [pole]: tak ? wybrane.filter((x) => x !== s.klucz) : [...wybrane, s.klucz] })
                  }
                >
                  {s.napis}
                  {s.opis && <small>{s.opis}</small>}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}

/** Suwak karty; nieruszony nie ma wartości (krok można pominąć). */
function SuwakKarty({
  s,
  karta,
  zmien,
}: {
  s: Suwak;
  karta: KartaPiwa;
  zmien: (z: Partial<KartaPiwa>) => void;
}) {
  const w = karta[s.pole] as number | undefined;
  return (
    <div className={`karta-suwak${w === undefined ? " pusty" : ""}`}>
      <p className="karta-suwak-nazwa">{s.nazwa}</p>
      <input
        type="range"
        min={0}
        max={100}
        step={1}
        value={w ?? 50}
        onChange={(e) => zmien({ [s.pole]: Number(e.target.value) })}
        aria-label={s.nazwa}
      />
      <p className="karta-suwak-konce">
        <span>{s.od}</span>
        <span>{s.do}</span>
      </p>
    </div>
  );
}

/** Pięć gwiazdek; lewa połowa gwiazdki to pół, prawa całość. */
function WyborGwiazdek({ ocena, onZmiana }: { ocena?: number; onZmiana: (o: number) => void }) {
  return (
    <div className="karta-ocena">
      <div className="gwiazdki gwiazdki-wybor" role="radiogroup" aria-label="Ocena">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="gwiazdka">
            <Wypelnienie ile={Math.max(0, Math.min(1, (ocena ?? 0) - (n - 1)))} />
            <button type="button" className="gwiazdka-pol lewa" onClick={() => onZmiana(n - 0.5)} aria-label={`${napisOceny(n - 0.5)}`} />
            <button type="button" className="gwiazdka-pol prawa" onClick={() => onZmiana(n)} aria-label={`${napisOceny(n)}`} />
          </span>
        ))}
      </div>
      <p className="karta-ocena-liczba">{ocena !== undefined ? napisOceny(ocena) : "–"}</p>
    </div>
  );
}

export function Gwiazdki({ ocena }: { ocena: number }) {
  return (
    <span className="gwiazdki" aria-label={`${napisOceny(ocena)} na 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="gwiazdka">
          <Wypelnienie ile={Math.max(0, Math.min(1, ocena - (n - 1)))} />
        </span>
      ))}
    </span>
  );
}

function Wypelnienie({ ile }: { ile: number }) {
  return (
    <>
      <span className="gwiazdka-tlo" aria-hidden>
        ★
      </span>
      <span className="gwiazdka-pelna" style={{ width: `${ile * 100}%` }} aria-hidden>
        ★
      </span>
    </>
  );
}

/** Po „Pokaż wyniki”: twoja karta obok sali. */
function TyISala({ moja, karty }: { moja: KartaPiwa; karty: KartaPiwa[] }) {
  const w = wynikiSali(karty);
  const moje = new Set([...(moja.aromaty ?? []), ...(moja.smaki ?? [])]);
  const salaSlowa = [...w.aromaty, ...w.smaki]
    .reduce<{ klucz: string; napis: string; ile: number }[]>((acc, s) => {
      const b = acc.find((x) => x.klucz === s.klucz);
      if (b) b.ile = Math.max(b.ile, s.ile);
      else acc.push({ ...s });
      return acc;
    }, [])
    .sort((a, b) => b.ile - a.ile)
    .slice(0, 8);
  return (
    <div className="ty-i-sala">
      <div className="ty-i-sala-oceny">
        <div>
          <p className="etykieta">Ty</p>
          <p className="ty-i-sala-liczba">{moja.ocena !== undefined ? napisOceny(moja.ocena) : "–"}</p>
        </div>
        <div>
          <p className="etykieta">Sala ({w.ocen})</p>
          <p className="ty-i-sala-liczba zloto">{w.srednia !== null ? napisOceny(w.srednia) : "–"}</p>
        </div>
      </div>

      {salaSlowa.length > 0 && (
        <section>
          <p className="etykieta">Sala poczuła</p>
          <div className="karta-slowa">
            {salaSlowa.map((s) => (
              <span key={s.klucz} className={`slowo${moje.has(s.klucz) ? " wybrane" : ""}`}>
                {s.napis} <small>{s.ile}</small>
              </span>
            ))}
          </div>
        </section>
      )}

      <ul className="ty-i-sala-suwaki">
        {w.suwaki
          .filter((s) => s.ile > 0 && typeof moja[s.pole] === "number")
          .map((s) => (
            <li key={s.pole}>
              <strong>{s.nazwa}</strong>
              <span>
                ty: {slowoSuwaka(s, moja[s.pole] as number)} · sala: {slowoSuwaka(s, s.srednia)}
              </span>
            </li>
          ))}
      </ul>

      {w.wady.length > 0 && (
        <section>
          <p className="etykieta">Coś nie grało</p>
          <div className="karta-slowa">
            {w.wady.map((s) => (
              <span key={s.klucz} className={`slowo slowo-wada${moja.wady?.includes(s.klucz) ? " wybrane" : ""}`}>
                {s.napis} <small>{s.ile}</small>
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Koniec: wszystkie piwa z twoimi ocenami obok sali, do zrzutu ekranu. */
function TwojaDegustacja({ moje, sala, stan }: { moje: MojaKarta[]; sala: KartyPiwa[]; stan: StanSesji }) {
  const [piwa, ustawPiwa] = useState<{ id: string; tresc: string; nr: number }[] | null>(null);
  useEffect(() => {
    void supabase()
      .rpc("piwa_degustacji", { p_kod: stan.kod })
      .then(({ data }) => ustawPiwa((data as { id: string; tresc: string; nr: number }[]) ?? []));
  }, [stan.kod]);
  return (
    <>
      <p className="nadtytul">Twoja degustacja</p>
      <h1>{stan.quiz?.tytul ?? "Degustacja"}</h1>
      <ol className="twoja-degustacja">
        {(piwa ?? []).map((p) => {
          const moja = moje.find((k) => k.zadanie_id === p.id)?.dane ?? {};
          const w = wynikiSali(sala.find((s) => s.zadanie_id === p.id)?.karty ?? []);
          return (
            <li key={p.id}>
              <p className="twoja-degustacja-nazwa">{p.tresc}</p>
              <p className="twoja-degustacja-oceny">
                ty <strong>{moja.ocena !== undefined ? napisOceny(moja.ocena) : "–"}</strong> · sala{" "}
                <strong className="zloto">{w.srednia !== null ? napisOceny(w.srednia) : "–"}</strong>
              </p>
              {(moja.aromaty?.length ?? 0) + (moja.smaki?.length ?? 0) > 0 && (
                <p className="pomocniczy">
                  {[...new Set([...(moja.aromaty ?? []), ...(moja.smaki ?? [])])].map(napisSlowa).join(", ")}
                </p>
              )}
              {moja.notatka && <p className="twoja-degustacja-notatka">„{moja.notatka}”</p>}
            </li>
          );
        })}
      </ol>
      <p className="pomocniczy">Do zobaczenia na kolejnej degustacji. Piwu Cześć!</p>
    </>
  );
}
