import { HASLA } from "@/lib/gra/okrzyki";
import { Awatar } from "./awatar";

/** Hasło kibica z awatarem finalisty w miejscu kropek: „Dawaj [awatar]!”. */
export function HasloKibica({
  haslo,
  nick,
  zdjecie,
  rozmiar,
}: {
  haslo: number;
  nick: string;
  zdjecie: string | null;
  rozmiar: number;
}) {
  const [przed, po] = HASLA[haslo] ?? HASLA[0];
  return (
    <span className="haslo-kibica">
      {przed}
      <Awatar nick={nick} zdjecie={zdjecie} rozmiar={rozmiar} className="haslo-kibica-awatar" />
      {po}
    </span>
  );
}
