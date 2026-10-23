"use client";

import { useEffect, useRef, useState } from "react";
import { usePotwierdzenie } from "@/components/okno";
import { odslonaPodiumS } from "@/lib/gra/podium";
/* eslint-disable @next/next/no-img-element -- selfie z bucketu Supabase w medalu */
import type { MojWynik, Nagroda, StanSesji } from "@/lib/gra/typy";
import { deszczKonfetti, wybuchKonfetti } from "@/lib/konfetti";
import { komunikatBledu } from "@/lib/gra/nasluch";
import { supabase } from "@/lib/supabase/przegladarka";
import { Miejsce } from "./rozgrywka";
import { UdostepnijWynik } from "./udostepnij";

const TYTULY: Record<number, string> = { 1: "Zwycięstwo!", 2: "Srebro!", 3: "Brąz!" };

type Props = {
  /** Stan gry: tytuł, okazja, lokal i browar do grafiki z wynikiem. */
  stan: StanSesji;
  faza: "podium" | "tabela" | "koniec";
  /** Początek fazy `podium` według zegara serwera. */
  fazaOd: string | null;
  przesuniecie: number;
  moj: MojWynik | null;
  nick: string;
  kod: string;
  token: string;
  nagrody: Nagroda[] | null;
  /** Selfie gracza: na podium pokazuje się w medalu. */
  zdjecie: string | null;
};

/**
 * Koniec quizu na telefonie. Na podium miejsce odsłania się razem ze stopniem na TV
 * (wcześniej „werble”), a pierwsza trójka dostaje medal i konfetti.
 */
export function KoniecGracza({ stan, faza, fazaOd, przesuniecie, moj, nick, kod, token, nagrody, zdjecie }: Props) {
  const miejsce = moj?.miejsce ?? null;
  const nagroda = nagrody?.find((n) => n.miejsce === miejsce) ?? null;
  const [odslonieto, ustawOdslonieto] = useState(faza !== "podium");
  const wystrzelone = useRef(false);

  useEffect(() => {
    if (odslonieto || miejsce === null) return;
    const za = fazaOd ? Date.parse(fazaOd) + odslonaPodiumS(miejsce) * 1000 - (Date.now() + przesuniecie) : 0;
    const zegar = setTimeout(() => ustawOdslonieto(true), Math.max(0, za));
    return () => clearTimeout(zegar);
  }, [odslonieto, miejsce, fazaOd, przesuniecie]);

  // konfetti tylko przy odsłonie na żywo, nie po odświeżeniu strony w tabeli albo na końcu
  useEffect(() => {
    if (!odslonieto || faza !== "podium" || wystrzelone.current || !miejsce || miejsce > 3) return;
    wystrzelone.current = true;
    wybuchKonfetti(false);
    if (miejsce === 1) return deszczKonfetti(4000);
  }, [odslonieto, faza, miejsce]);

  // grafika z wynikiem do relacji: dla każdego gracza z miejscem, po odsłonięciu
  const udostepnienie = moj?.miejsce ? (
    <UdostepnijWynik
      wynik={{
        tytul: stan.quiz?.tytul ?? "Quiz",
        okazja: stan.okazja,
        lokal: stan.lokal,
        browar: stan.browar,
        data: new Date().toLocaleDateString("pl-PL"),
        nick,
        zdjecie,
        miejsce: moj.miejsce,
        liczbaGraczy: moj.liczba_graczy,
        punkty: moj.punkty,
      }}
      konta={[stan.lokal?.instagram, stan.browar?.instagram]}
    />
  ) : null;

  const podziekowanie = (
    <>
      <p className="podziekowanie">
        Dzięki za grę, <strong className="gra-kod">{nick}</strong>! Piwu Cześć!
      </p>
      <p className="autor">
        <span className="autor-etykieta">Aplikacja</span>
        <a href="https://lukasznowak.dev" target="_blank" rel="noopener">
          lukasznowak.dev
        </a>
      </p>
    </>
  );

  if (!odslonieto) {
    return (
      <div className="werble">
        <p className="nadtytul">{nick}</p>
        <h1>Werble…</h1>
        <p>Patrz na telewizor, zaraz poznasz swoje miejsce!</p>
      </div>
    );
  }

  if (moj && miejsce && miejsce <= 3) {
    return (
      <>
        <div className={`fanfara fanfara-${miejsce}${nagroda ? " z-nagroda" : ""}`}>
          <div className={`medal${zdjecie ? " ze-zdjeciem" : ""}`} aria-hidden>
            {zdjecie ? <img src={zdjecie} alt="" /> : null}
            <span>{miejsce}</span>
          </div>
          <h1 className="fanfara-tytul">{TYTULY[miejsce]}</h1>
          <p className="fanfara-opis">
            {miejsce}. miejsce z {moj.liczba_graczy} · <strong>{moj.punkty.toLocaleString("pl-PL")} pkt</strong>
          </p>
        </div>
        {nagroda && (
          <KartaNagrody nagroda={nagroda} nick={nick} kod={kod} token={token} odebrana={moj.nagroda_odebrana} />
        )}
        {udostepnienie}
        {podziekowanie}
      </>
    );
  }

  return (
    <>
      <p className="nadtytul">{nick}</p>
      <h1>{faza === "koniec" ? "Koniec gry" : "Koniec quizu!"}</h1>
      {moj && <Miejsce moj={moj} />}
      <p>
        {faza === "podium"
          ? "Na telewizorze podium. Brawa dla najlepszych!"
          : faza === "tabela"
            ? "Na telewizorze pełna tabela wyników."
            : ""}
      </p>
      {udostepnienie}
      {podziekowanie}
    </>
  );
}

/** Żywy zegar (sekundy) na karcie nagrody: zrzut ekranu od razu widać po zatrzymanym czasie. */
function useZegar() {
  const [teraz, ustawTeraz] = useState<Date | null>(null);
  useEffect(() => {
    const tik = () => ustawTeraz(new Date());
    tik();
    const zegar = setInterval(tik, 1000);
    return () => clearInterval(zegar);
  }, []);
  return teraz;
}

const godzina = (iso: string) => new Date(iso).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" });

/**
 * Karta nagrody do pokazania obsłudze: nagroda, instrukcja, nick, kod gry i żywy zegar.
 * Po odebraniu nagrody (przy barze albo gdziekolwiek ją wydają) ktoś klika „Potwierdź odbiór”:
 * karta zmienia się w „ODEBRANA o …”, więc tym samym ekranem nie da się odebrać drugi raz,
 * a w panelu przy grze widać, kto i kiedy odebrał.
 */
function KartaNagrody(props: { nagroda: Nagroda; nick: string; kod: string; token: string; odebrana: string | null }) {
  const { nagroda, nick, kod, token } = props;
  const teraz = useZegar();
  const [odebrana, ustawOdebrana] = useState(props.odebrana);
  // odbiór oznaczony (albo cofnięty) w panelu przychodzi z bazy i wygrywa z lokalnym kliknięciem
  const [zBazy, ustawZBazy] = useState(props.odebrana);
  if (props.odebrana !== zBazy) {
    ustawZBazy(props.odebrana);
    ustawOdebrana(props.odebrana);
  }
  const [blad, ustawBlad] = useState<string | null>(null);
  const [potwierdz, okno] = usePotwierdzenie();

  async function odbierz() {
    const tak = await potwierdz(
      "Kliknij dopiero po odebraniu nagrody. Karta zmieni się wtedy w „Odebrana”.",
      { tak: "Odebrana", nie: "Jeszcze nie" },
    );
    if (!tak) return;
    const { data, error } = await supabase().rpc("odbierz_nagrode", { p_token: token });
    if (error) {
      ustawBlad(komunikatBledu(error));
      return;
    }
    ustawOdebrana((data as { odebrana: string }).odebrana);
  }

  const widocznaOdebrana = odebrana;
  if (widocznaOdebrana) {
    return (
      <section className="karta-nagrody odebrana" aria-label="Nagroda odebrana">
        <p className="karta-nagrody-etykieta">Twoja nagroda</p>
        <p className="karta-nagrody-nazwa">{nagroda.nagroda}</p>
        <p className="karta-nagrody-pieczatka">Odebrana o {godzina(widocznaOdebrana)}</p>
        <p className="karta-nagrody-dowod">
          <span>{nick}</span>
          <span>gra {kod}</span>
        </p>
      </section>
    );
  }

  return (
    <section className="karta-nagrody" aria-label="Twoja nagroda">
      <p className="karta-nagrody-etykieta">Twoja nagroda</p>
      <p className="karta-nagrody-nazwa">{nagroda.nagroda}</p>
      {nagroda.instrukcja && <p className="karta-nagrody-instrukcja">{nagroda.instrukcja}</p>}
      <p className="karta-nagrody-dowod">
        <span>{nick}</span>
        <span>gra {kod}</span>
        <span className="karta-nagrody-zegar">
          {teraz?.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
        </span>
      </p>
      <button type="button" className="przycisk-zdjecie karta-nagrody-odbior" onClick={() => void odbierz()}>
        Potwierdź odbiór
      </button>
      {blad && (
        <p className="blad" role="alert" style={{ marginTop: 8 }}>
          {blad}
        </p>
      )}
      {okno}
    </section>
  );
}
