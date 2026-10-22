"use client";

import { useEffect, useRef, useState } from "react";
import { odslonaPodiumS } from "@/lib/gra/podium";
import type { MojWynik, Nagroda } from "@/lib/gra/typy";
import { deszczKonfetti, wybuchKonfetti } from "@/lib/konfetti";
import { Miejsce } from "./rozgrywka";

const TYTULY: Record<number, string> = { 1: "Zwycięstwo!", 2: "Srebro!", 3: "Brąz!" };

type Props = {
  faza: "podium" | "tabela" | "koniec";
  /** Początek fazy `podium` według zegara serwera. */
  fazaOd: string | null;
  przesuniecie: number;
  moj: MojWynik | null;
  nick: string;
  kod: string;
  nagrody: Nagroda[] | null;
};

/**
 * Koniec quizu na telefonie. Na podium miejsce odsłania się razem ze stopniem na TV
 * (wcześniej „werble”), a pierwsza trójka dostaje medal i konfetti.
 */
export function KoniecGracza({ faza, fazaOd, przesuniecie, moj, nick, kod, nagrody }: Props) {
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

  const podziekowanie = (
    <p>
      Dzięki za grę, <strong className="gra-kod">{nick}</strong>! Piwu Cześć!
    </p>
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
        <div className={`fanfara fanfara-${miejsce}`}>
          <div className="medal" aria-hidden>
            <span>{miejsce}</span>
          </div>
          <h1 className="fanfara-tytul">{TYTULY[miejsce]}</h1>
          <p className="fanfara-opis">
            {miejsce}. miejsce z {moj.liczba_graczy} · <strong>{moj.punkty.toLocaleString("pl-PL")} pkt</strong>
          </p>
        </div>
        {nagroda && <KartaNagrody nagroda={nagroda} nick={nick} kod={kod} />}
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

/** Karta nagrody do pokazania obsłudze: nagroda, instrukcja, nick, kod gry i żywy zegar. */
function KartaNagrody({ nagroda, nick, kod }: { nagroda: Nagroda; nick: string; kod: string }) {
  const teraz = useZegar();
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
    </section>
  );
}
