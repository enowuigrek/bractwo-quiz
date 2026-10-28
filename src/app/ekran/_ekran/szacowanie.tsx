"use client";

import { Awatar } from "@/components/awatar";
import type { ZadanieWidoczne } from "@/lib/gra/typy";
import { celSzacowania, liczbaZJednostka, poprawnaSzacowania, przedzialSzacowania } from "@/lib/zadania";

/**
 * Szacowanie na TV: oś od `min` do `max`. W trakcie pytania pusta (z zakresem), po wyniku każda podana
 * liczba to kropka (te same liczby piętrzą się w górę), a złota kreska z napisem to poprawna liczba
 * (przy przedziale kreska na środku, a sam przedział to złoty pas na osi). Przed wynikiem nad osią plakietka, czy
 * celujemy w widełki, czy w konkretną liczbę (28.10).
 */
export function OsLiczbowa({ z, wynik }: { z: ZadanieWidoczne; wynik: boolean }) {
  const min = z.dane.min ?? 0;
  const max = z.dane.max ?? 1;
  const zakres = typeof z.dane.poprawna === "number" ? przedzialSzacowania(z.dane.poprawna, z.dane.poprawna_do) : null;
  const p = zakres ? (zakres[0] + zakres[1]) / 2 : null;
  const gdzie = (x: number) => `${((x - min) / (max - min)) * 100}%`;
  const liczby = wynik ? (z.rozklad ?? []) : [];
  // ile kropek już stoi w danym miejscu (zaokrąglonym do 1% osi), żeby kolejne szły wyżej
  const stos = new Map<number, number>();
  const kropki = liczby.map((x, i) => {
    const klucz = Math.round(((x - min) / (max - min)) * 100);
    const wysokosc = stos.get(klucz) ?? 0;
    stos.set(klucz, wysokosc + 1);
    return { x, i, wysokosc };
  });
  // złota kreska poprawnej tylko trochę ponad najwyższy stos kropek, nie do góry pola: plakietka z liczbą stoi wtedy
  // tuż nad kropkami i nie wchodzi na treść pytania (25.10)
  const najwyzszy = kropki.reduce((m, k) => Math.max(m, k.wysokosc + 1), 0);
  const kreska = Math.min(300, Math.max(110, 18 + najwyzszy * 30 + 30));

  return (
    <div className="tv-os">
      {!wynik && <p className="tv-os-cel">{celSzacowania(z.dane)}</p>}
      <div className="tv-os-pole">
        {kropki.map(({ x, i, wysokosc }) => (
          <span
            key={i}
            className="tv-os-kropka"
            style={{ left: gdzie(x), bottom: 18 + wysokosc * 30, animationDelay: `${0.2 + i * 0.05}s` }}
          />
        ))}
        {wynik && zakres && zakres[1] > zakres[0] && (
          <span
            className="tv-os-przedzial"
            style={{ left: gdzie(zakres[0]), width: `${((zakres[1] - zakres[0]) / (max - min)) * 100}%` }}
          />
        )}
        {wynik && p !== null && (
          <span className="tv-os-poprawna" style={{ left: gdzie(p), height: kreska }}>
            <span>{poprawnaSzacowania(zakres![0], zakres![1], z.dane.jednostka)}</span>
          </span>
        )}
        <div className="tv-os-linia" />
      </div>
      <div className="tv-os-zakres">
        <span>{liczbaZJednostka(min, z.dane.jednostka)}</span>
        <span>{liczbaZJednostka(max, z.dane.jednostka)}</span>
      </div>
      {wynik && !!z.najblizej?.length && (
        <ol className="tv-os-najblizej">
          {z.najblizej.map((n, i) => (
            <li key={n.nick}>
              <strong>{i + 1}.</strong> {n.nick} <span>{liczbaZJednostka(n.liczba, z.dane.jednostka)}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** Szerokość podpisu gracza na osi (px sceny). */
const PODPIS_PX = 230;
/**
 * Rzędy podpisów nad osią (od 26.10 wszystkie nad nią, oś na dole). Pięć mieści się pod plakietką poprawnej
 * odpowiedzi na scenie 16:9 nawet przy dwuwierszowym pytaniu.
 */
const RZEDY = 5;
const SZEROKOSC_OSI = 1640;

type Odpowiedz = { nick: string; zdjecie: string | null; liczba: number; punkty: number; czas_ms: number | null };

/**
 * Odpowiedzi w szacowaniu (faza `odpowiedzi`): zamiast ramek „dobrze / źle” jedna oś przybliżona do odpowiedzi.
 * Oś na dole, nad nią gracze tam, gdzie strzelali, każdy z podpisem (nick, liczba i punkty) w rzędach, żeby na siebie
 * nie wchodziły. Poprawna liczba na plakietce u góry pola, zawsze pod nagłówkiem, ze złotą kreską w dół do osi
 * (26.10, Łukasz: wcześniej gracze stali nad osią i pod nią, a plakietka czasem wchodziła na nagłówek).
 */
export function OdpowiedziSzacowania({
  z,
  odpowiedzi,
}: {
  z: ZadanieWidoczne;
  odpowiedzi: {
    nick: string;
    zdjecie: string | null;
    dane: { liczba?: number } | null;
    punkty: number | null;
    czas_ms: number | null;
  }[];
}) {
  const [od, do_] = przedzialSzacowania(typeof z.dane.poprawna === "number" ? z.dane.poprawna : 0, z.dane.poprawna_do);
  // środek przedziału (albo sama poprawna), a odległość strzału od najbliższego brzegu przedziału
  const p = (od + do_) / 2;
  const odleglosc = (v: number) => Math.max(0, od - v, v - do_);
  const jednostka = z.dane.jednostka;
  const krok = z.dane.krok ?? 1;
  const strzaly: Odpowiedz[] = odpowiedzi
    .filter((o) => typeof o.dane?.liczba === "number")
    .map((o) => ({
      nick: o.nick,
      zdjecie: o.zdjecie,
      liczba: o.dane!.liczba!,
      punkty: o.punkty ?? 0,
      czas_ms: o.czas_ms,
    }))
    .sort((a, b) => a.liczba - b.liczba);
  const bez = odpowiedzi.filter((o) => typeof o.dane?.liczba !== "number");

  // oś symetryczna wokół poprawnej, przybliżona do najdalszego strzału (z zapasem)
  const pol = Math.max(krok * 5 + (do_ - od) / 2, ...strzaly.map((s) => Math.abs(s.liczba - p))) * 1.15;
  const x = (v: number) => ((v - (p - pol)) / (2 * pol)) * SZEROKOSC_OSI;

  const najblizsi = [...strzaly].sort(
    (a, b) => odleglosc(a.liczba) - odleglosc(b.liczba) || (a.czas_ms ?? 0) - (b.czas_ms ?? 0),
  );
  // rzędy od osi w górę: podpisy dostają najpierw najbliżsi poprawnej (26.10: trafiający w punkt zostawali bez
  // podpisu, gdy miejsca zajęli ci z lewej), każdy w najniższym rzędzie, w którym nie zachodzi na inny podpis.
  // Kto się nie zmieści w żadnym rzędzie, ma sam awatar na osi
  const zajete: [number, number][][] = Array.from({ length: RZEDY }, () => []);
  const rzedy = new Map<string, number>();
  for (const s of najblizsi) {
    const od = x(s.liczba) - PODPIS_PX / 2 - 4;
    const do_ = od + PODPIS_PX + 8;
    const rzad = zajete.findIndex((w) => w.every(([a, b]) => do_ <= a || od >= b));
    if (rzad >= 0) zajete[rzad].push([od, do_]);
    rzedy.set(s.nick, rzad);
  }
  const ulozone = strzaly.map((s) => ({ ...s, srodek: x(s.liczba), rzad: rzedy.get(s.nick) ?? -1 }));

  return (
    <div className="tv-os-odp">
      <div className="tv-os-odp-pole" style={{ width: SZEROKOSC_OSI }}>
        <div className="tv-os-odp-linia" />
        {do_ > od && <span className="tv-os-przedzial" style={{ left: x(od), width: x(do_) - x(od) }} />}
        <span className="tv-os-odp-poprawna" style={{ left: x(p) }}>
          <span>{poprawnaSzacowania(od, do_, jednostka)}</span>
        </span>
        {ulozone.map((s, i) => (
          <div
            key={s.nick}
            className={`tv-os-odp-gracz${najblizsi[0]?.nick === s.nick ? " najblizej" : ""}`}
            style={{ left: s.srodek, ["--rzad" as string]: Math.max(0, s.rzad), animationDelay: `${0.2 + i * 0.08}s` }}
          >
            <span className="tv-os-odp-kreska" />
            <Awatar nick={s.nick} zdjecie={s.zdjecie} rozmiar={62} />
            {s.rzad >= 0 && (
              <span className="tv-os-odp-podpis">
                <strong>{s.nick}</strong>
                <span>
                  {liczbaZJednostka(s.liczba, jednostka)} · <em>+{s.punkty}</em>
                </span>
              </span>
            )}
          </div>
        ))}
      </div>
      <p className="tv-os-odp-dol">
        {najblizsi[0] ? (
          <>
            Najbliżej: <strong className="tv-zloto">{najblizsi[0].nick}</strong> (
            {liczbaZJednostka(najblizsi[0].liczba, jednostka)})
          </>
        ) : (
          "Nikt nie odpowiedział."
        )}
        {bez.length > 0 && (
          <span className="tv-podpowiedz"> · bez odpowiedzi: {bez.map((o) => o.nick).join(", ")}</span>
        )}
      </p>
    </div>
  );
}
