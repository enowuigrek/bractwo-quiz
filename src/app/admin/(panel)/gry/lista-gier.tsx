import Link from "next/link";
import { NAZWY_FAZ, type Faza } from "@/lib/typy";
import { Miniatura } from "../_komponenty/grafika";

export type GraNaLiscie = {
  id: string;
  kod: string;
  okazja: string | null;
  faza: Faza;
  utworzono: string;
  quizy: { tytul: string } | null;
  piwiarnie: { nazwa: string; miasto: string | null; logo_url: string | null } | null;
};

export const ZAPYTANIE_GIER = "id, kod, okazja, faza, utworzono, quizy(tytul), piwiarnie(nazwa, miasto, logo_url)";

const data = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

export function ListaGier({ gry, pusta }: { gry: GraNaLiscie[]; pusta: string }) {
  if (gry.length === 0) return <p className="lista-pusta">{pusta}</p>;
  return (
    <ul className="lista">
      {gry.map((g) => (
        <li key={g.id}>
          <Miniatura src={g.piwiarnie?.logo_url ?? null} alt="" />
          <div className="lista-glowna">
            <div className="lista-tytul">
              <Link href={`/admin/gry/${g.id}`}>
                {g.kod} · {g.quizy?.tytul ?? "quiz usunięty"}
              </Link>{" "}
              <span className={`znaczek${g.faza === "koniec" ? "" : " aktywny"}`}>{NAZWY_FAZ[g.faza]}</span>
            </div>
            <div className="lista-opis">
              {[g.piwiarnie?.nazwa ?? "bez lokalu", g.okazja, data.format(new Date(g.utworzono))]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="lista-akcje">
            <Link href={`/admin/gry/${g.id}`} className="przycisk-maly">
              Otwórz
            </Link>
          </div>
        </li>
      ))}
    </ul>
  );
}
