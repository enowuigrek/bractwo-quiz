/* eslint-disable @next/next/no-img-element -- selfie z bucketu Supabase, małe i już przycięte */

import { adresZdjecia, BRZEG_KAPSLA, kolorNicku, kolorZAdresu, tloKapsla, ZLOTY_KAPSEL } from "@/lib/kapsel";

type Props = {
  nick: string;
  /** `gracze.zdjecie_url`: adres selfie i/albo kolor kapsla (`#kapsel=rrggbb`, src/lib/kapsel.ts). */
  zdjecie?: string | null;
  /** Średnica w px. */
  rozmiar: number;
  className?: string;
  /** Kolor kapsla zamiast zapisanego (podgląd przy dołączaniu). */
  kolor?: string | null;
};

/**
 * Awatar jako kapsel (26.10, Łukasz): brzeg z ząbkami to wygenerowany SVG w tle (`src/lib/kapsel.ts`), bez
 * `clip-path` i masek, których starsze telewizory nie stosują. Kolor wybiera gracz (albo dobiera go telefon ze
 * zdjęcia). Z selfie zdjęcie w środku kapsla, bez selfie wygrawerowana pierwsza litera nicku, a bez nicku pusty kapsel.
 */
export function Awatar({ nick, zdjecie, rozmiar, className, kolor }: Props) {
  const klasa = `awatar${className ? ` ${className}` : ""}`;
  const obraz = adresZdjecia(zdjecie);
  const kolorKapsla = kolor ?? kolorZAdresu(zdjecie) ?? (obraz ? ZLOTY_KAPSEL : kolorNicku(nick));
  if (obraz) {
    const styl = {
      width: rozmiar,
      height: rozmiar,
      padding: Math.max(2, Math.round(rozmiar * BRZEG_KAPSLA)),
      backgroundImage: tloKapsla(kolorKapsla),
    };
    return <img src={obraz} alt="" className={klasa} style={styl} />;
  }
  const litera = Array.from(nick.trim())[0]?.toLocaleUpperCase("pl") ?? "";
  const styl = {
    width: rozmiar,
    height: rozmiar,
    fontSize: Math.round(rozmiar * 0.56),
    backgroundImage: tloKapsla(kolorKapsla),
  };
  return (
    <span aria-hidden className={`${klasa} awatar-litera`} style={styl}>
      {litera}
    </span>
  );
}
