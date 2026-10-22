/* eslint-disable @next/next/no-img-element -- selfie z bucketu Supabase, małe i już przycięte */

// Tła kółek bez zdjęcia: kolory z design systemu, dobrane po nicku (ten sam nick = ten sam kolor).
const TLA = ["var(--zloto)", "var(--chmiel)", "var(--bursztyn)", "var(--kamien3)", "var(--zloto-blask)", "var(--chmiel-ciemny)"];

function tlo(nick: string): string {
  let h = 0;
  for (const z of nick) h = (h * 31 + z.codePointAt(0)!) | 0;
  return TLA[Math.abs(h) % TLA.length];
}

type Props = {
  nick: string;
  zdjecie?: string | null;
  /** Średnica w px. */
  rozmiar: number;
  className?: string;
};

/** Zdjęcie gracza w kółku, a bez zdjęcia kółko z pierwszą literą nicku. */
export function Awatar({ nick, zdjecie, rozmiar, className }: Props) {
  const styl = { width: rozmiar, height: rozmiar, fontSize: Math.round(rozmiar * 0.46) };
  if (zdjecie) {
    return <img src={zdjecie} alt="" className={`awatar${className ? ` ${className}` : ""}`} style={styl} />;
  }
  const litera = Array.from(nick.trim())[0]?.toLocaleUpperCase("pl") ?? "?";
  return (
    <span aria-hidden className={`awatar awatar-litera${className ? ` ${className}` : ""}`} style={{ ...styl, background: tlo(nick) }}>
      {litera}
    </span>
  );
}
