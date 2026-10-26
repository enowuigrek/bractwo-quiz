/* eslint-disable @next/next/no-img-element -- selfie z bucketu Supabase, małe i już przycięte */

import { BRZEG_KAPSLA, kolorNicku, kolorZAdresu, tloKapsla, ZLOTY_KAPSEL } from "@/lib/kapsel";

type Props = {
  nick: string;
  zdjecie?: string | null;
  /** Średnica w px. */
  rozmiar: number;
  className?: string;
};

/**
 * Awatar jako kapsel (26.10, Łukasz): brzeg z ząbkami to wygenerowany SVG w tle (`src/lib/kapsel.ts`), bez
 * `clip-path` i masek, których starsze telewizory nie stosują. Z selfie: zdjęcie w środku, kapsel w kolorze
 * dobranym ze zdjęcia (`#kapsel=` w adresie, inaczej złoty). Bez selfie: cały kapsel w jasnym kolorze nicku
 * z ciemną literą.
 */
export function Awatar({ nick, zdjecie, rozmiar, className }: Props) {
  const klasa = `awatar${className ? ` ${className}` : ""}`;
  if (zdjecie) {
    const styl = {
      width: rozmiar,
      height: rozmiar,
      padding: Math.max(2, Math.round(rozmiar * BRZEG_KAPSLA)),
      backgroundImage: tloKapsla(kolorZAdresu(zdjecie) ?? ZLOTY_KAPSEL),
    };
    return <img src={zdjecie} alt="" className={klasa} style={styl} />;
  }
  const litera = Array.from(nick.trim())[0]?.toLocaleUpperCase("pl") ?? "?";
  const styl = {
    width: rozmiar,
    height: rozmiar,
    fontSize: Math.round(rozmiar * 0.46),
    backgroundImage: tloKapsla(kolorNicku(nick)),
  };
  return (
    <span aria-hidden className={`${klasa} awatar-litera`} style={styl}>
      {litera}
    </span>
  );
}
