"use client";

import { Awatar } from "@/components/awatar";
import type { ZadanieWidoczne } from "@/lib/gra/typy";
import { liczbaZJednostka } from "@/lib/zadania";

/**
 * Szacowanie na TV: oś od `min` do `max`. W trakcie pytania pusta (z zakresem), po wyniku każda podana
 * liczba to kropka (te same liczby piętrzą się w górę), a złota kreska z napisem to poprawna liczba.
 */
export function OsLiczbowa({ z, wynik }: { z: ZadanieWidoczne; wynik: boolean }) {
  const min = z.dane.min ?? 0;
  const max = z.dane.max ?? 1;
  const p = typeof z.dane.poprawna === "number" ? z.dane.poprawna : null;
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
      <div className="tv-os-pole">
        {kropki.map(({ x, i, wysokosc }) => (
          <span
            key={i}
            className="tv-os-kropka"
            style={{ left: gdzie(x), bottom: 18 + wysokosc * 30, animationDelay: `${0.2 + i * 0.05}s` }}
          />
        ))}
        {wynik && p !== null && (
          <span className="tv-os-poprawna" style={{ left: gdzie(p), height: kreska }}>
            <span>{liczbaZJednostka(p, z.dane.jednostka)}</span>
          </span>
        )}
        <div className="tv-os-linia" />
      </div>
      <div className="tv-os-zakres">
        <span>{liczbaZJednostka(min, z.dane.jednostka)}</span>
        {!wynik && <span className="tv-podpowiedz">Ustaw liczbę suwakiem na telefonie</span>}
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

/** Szerokość podpisu gracza na osi (px sceny) i ile rzędów podpisów mieści się nad i pod osią. */
const PODPIS_PX = 230;
/** Rzędy podpisów nad osią i pod nią (pod osią jeden więcej: nad osią jest jeszcze plakietka poprawnej odpowiedzi). */
const RZEDY = 3;
const RZEDY_POD = 4;
/** Pół szerokości plakietki z poprawną odpowiedzią (z zapasem), np. „568 ml” albo „1849”. */
const POPRAWNA_POL_PX = 150;
const SZEROKOSC_OSI = 1640;

type Odpowiedz = { nick: string; zdjecie: string | null; liczba: number; punkty: number; czas_ms: number | null };

/**
 * Odpowiedzi w szacowaniu (faza `odpowiedzi`): zamiast ramek „dobrze / źle” jedna oś przybliżona do odpowiedzi.
 * Na środku złota kreska z poprawną liczbą, gracze tam, gdzie strzelali (za mało z lewej, za dużo z prawej),
 * każdy z podpisem: nick, liczba i punkty. Podpisy układają się w rzędy nad i pod osią, żeby na siebie nie wchodziły.
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
  const p = typeof z.dane.poprawna === "number" ? z.dane.poprawna : 0;
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
  const pol = Math.max(krok * 5, ...strzaly.map((s) => Math.abs(s.liczba - p))) * 1.15;
  const x = (v: number) => ((v - (p - pol)) / (2 * pol)) * SZEROKOSC_OSI;

  // rzędy: na zmianę nad i pod osią; podpis trafia do pierwszego rzędu, w którym się mieści. Najwyższy rząd nad osią
  // dzieli wysokość z plakietką poprawnej odpowiedzi, więc obok niej podpis idzie gdzie indziej (25.10: zasłaniał ją)
  const konce: number[] = Array(RZEDY + RZEDY_POD).fill(-Infinity);
  const przyPoprawnej = (srodek: number) => Math.abs(srodek - x(p)) < PODPIS_PX / 2 + POPRAWNA_POL_PX;
  const ulozone = strzaly.map((s) => {
    const srodek = x(s.liczba);
    // na zmianę: nad 0, pod 0, nad 1, pod 1…, a gdy rzędów nad osią zabraknie, już tylko pod
    const kolejnosc = [
      ...Array.from({ length: RZEDY * 2 }, (_, i) => (i % 2 ? RZEDY + (i >> 1) : i >> 1)),
      ...Array.from({ length: RZEDY_POD - RZEDY }, (_, i) => RZEDY * 2 + i),
    ];
    const rzad =
      kolejnosc.find((r) => konce[r] < srodek - PODPIS_PX / 2 - 8 && !(r === RZEDY - 1 && przyPoprawnej(srodek))) ?? -1;
    if (rzad >= 0) konce[rzad] = srodek + PODPIS_PX / 2;
    return { ...s, srodek, rzad };
  });
  const najblizsi = [...strzaly].sort(
    (a, b) => Math.abs(a.liczba - p) - Math.abs(b.liczba - p) || (a.czas_ms ?? 0) - (b.czas_ms ?? 0),
  );

  return (
    <div className="tv-os-odp">
      <div className="tv-os-odp-pole" style={{ width: SZEROKOSC_OSI }}>
        <div className="tv-os-odp-linia" />
        <span className="tv-os-odp-strona lewa">← za mało</span>
        <span className="tv-os-odp-strona prawa">za dużo →</span>
        <span className="tv-os-odp-poprawna" style={{ left: x(p) }}>
          <span>{liczbaZJednostka(p, jednostka)}</span>
        </span>
        {ulozone.map((s, i) => {
          const nad = s.rzad >= 0 && s.rzad < RZEDY;
          const poziomRzedu = s.rzad < 0 ? 0 : nad ? s.rzad : s.rzad - RZEDY;
          return (
            <div
              key={s.nick}
              className={`tv-os-odp-gracz${nad ? " nad" : " pod"}${najblizsi[0]?.nick === s.nick ? " najblizej" : ""}`}
              style={{ left: s.srodek, ["--rzad" as string]: poziomRzedu, animationDelay: `${0.2 + i * 0.08}s` }}
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
          );
        })}
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
