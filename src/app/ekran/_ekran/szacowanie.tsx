"use client";

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
          <span className="tv-os-poprawna" style={{ left: gdzie(p) }}>
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
