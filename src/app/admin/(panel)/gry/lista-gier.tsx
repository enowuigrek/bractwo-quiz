import Link from "next/link";
import { NAZWY_FAZ, type Faza } from "@/lib/typy";
import { Miniatura } from "../_komponenty/grafika";
import { IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../_komponenty/przycisk-potwierdz";
import { usunGre } from "./akcje";

export type GraNaLiscie = {
  id: string;
  kod: string;
  okazja: string | null;
  faza: Faza;
  utworzono: string;
  host_token: string;
  quizy: { tytul: string } | null;
  lokale: { nazwa: string; miasto: string | null; logo_url: string | null } | null;
};

export const ZAPYTANIE_GIER =
  "id, kod, okazja, faza, utworzono, host_token, quizy(tytul), lokale(nazwa, miasto, logo_url)";

/** Trwająca gra otwiera się od razu w pilocie (26.10), zakończona na stronie gry z wynikami. */
const adresGry = (g: GraNaLiscie) => (g.faza === "koniec" ? `/admin/gry/${g.id}` : `/pilot/${g.kod}?t=${g.host_token}`);

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
          <Miniatura src={g.lokale?.logo_url ?? null} alt="" />
          <div className="lista-glowna">
            <div className="lista-tytul">
              <Link href={adresGry(g)}>
                {g.kod} · {g.quizy?.tytul ?? "quiz usunięty"}
              </Link>{" "}
              <span className={`znaczek${g.faza === "koniec" ? "" : " aktywny"}`}>{NAZWY_FAZ[g.faza]}</span>
            </div>
            <div className="lista-opis">
              {[g.lokale?.nazwa ?? "bez lokalu", g.okazja, data.format(new Date(g.utworzono))]
                .filter(Boolean)
                .join(" · ")}
            </div>
          </div>
          <div className="lista-akcje">
            <Link href={adresGry(g)} className={`przycisk-maly${g.faza === "koniec" ? "" : " zloty"}`}>
              {g.faza === "koniec" ? "Otwórz" : "Prowadź"}
            </Link>
            <PrzyciskPotwierdz
              akcja={usunGre.bind(null, g.id, false)}
              pytanie={
                g.faza === "koniec"
                  ? `Usunąć grę ${g.kod} razem z graczami i wynikami?`
                  : `Gra ${g.kod} jeszcze trwa. Usunąć ją razem z graczami i wynikami?`
              }
              tytul={`Usuń grę ${g.kod}`}
              className="przycisk-maly ikona niebezpieczny"
            >
              <IkonaKosz />
            </PrzyciskPotwierdz>
          </div>
        </li>
      ))}
    </ul>
  );
}
