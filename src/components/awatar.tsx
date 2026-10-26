/* eslint-disable @next/next/no-img-element -- selfie z bucketu Supabase, małe i już przycięte */

// Tła liter bez zdjęcia: kolory z design systemu, dobrane po nicku (ten sam nick = ten sam kolor).
const TLA = ["var(--zloto)", "var(--chmiel)", "var(--bursztyn)", "var(--kamien3)", "var(--zloto-blask)", "var(--chmiel-ciemny)"];

function tlo(nick: string): string {
  let h = 0;
  for (const z of nick) h = (h * 31 + z.codePointAt(0)!) | 0;
  return TLA[Math.abs(h) % TLA.length];
}

/** Grubość brzegu kapsla jako część średnicy: tyle zostaje na ząbki dookoła zdjęcia albo litery. */
const BRZEG_KAPSLA = 0.12;

type Props = {
  nick: string;
  zdjecie?: string | null;
  /** Średnica w px. */
  rozmiar: number;
  className?: string;
};

/**
 * Awatar jako kapsel (26.10, Łukasz): złoty brzeg z ząbkami (`public/grafiki/kapsel.svg` w tle elementu), a w środku
 * zdjęcie gracza albo pierwsza litera nicku na kolorowym kółku. Brzeg to tło i dopełnienie (`padding`), bez
 * `clip-path` i masek, których starsze telewizory nie stosują.
 */
export function Awatar({ nick, zdjecie, rozmiar, className }: Props) {
  const styl = {
    width: rozmiar,
    height: rozmiar,
    padding: Math.max(2, Math.round(rozmiar * BRZEG_KAPSLA)),
    fontSize: Math.round(rozmiar * 0.4),
  };
  if (zdjecie) {
    return <img src={zdjecie} alt="" className={`awatar${className ? ` ${className}` : ""}`} style={styl} />;
  }
  const litera = Array.from(nick.trim())[0]?.toLocaleUpperCase("pl") ?? "?";
  return (
    <span
      aria-hidden
      className={`awatar awatar-litera${className ? ` ${className}` : ""}`}
      style={{ ...styl, "--tlo": tlo(nick) } as React.CSSProperties}
    >
      {litera}
    </span>
  );
}
