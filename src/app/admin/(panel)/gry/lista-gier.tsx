import Link from "next/link";
import { NAZWY_FAZ, type Faza } from "@/lib/typy";
import { Miniatura } from "../_komponenty/grafika";
import { IkonaKosz } from "@/components/ikony";
import { PrzyciskPotwierdz } from "../_komponenty/przycisk-potwierdz";
import { usunGre, zwolnijEkran } from "./akcje";

export type GraNaLiscie = {
  id: string;
  kod: string;
  okazja: string | null;
  faza: Faza;
  utworzono: string;
  host_token: string;
  tylko_glowny: boolean;
  planowany_start: string | null;
  quizy: { tytul: string } | null;
  lokale: { nazwa: string; miasto: string | null; logo_url: string | null } | null;
};

export const ZAPYTANIE_GIER =
  "id, kod, okazja, faza, utworzono, host_token, tylko_glowny, planowany_start, quizy(tytul), lokale(nazwa, miasto, logo_url)";

/** Trwająca gra otwiera się od razu w pilocie (26.10), zakończona na stronie gry z wynikami. */
const adresGry = (g: GraNaLiscie) => (g.faza === "koniec" ? `/admin/gry/${g.id}` : `/pilot/${g.kod}?t=${g.host_token}`);

const data = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Warsaw",
});

const godzina = new Intl.DateTimeFormat("pl-PL", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Warsaw" });

/**
 * Lista gier. `lokal`: ogląda panel lokalu; gry Bractwa (`tylko_glowny`) w jego lokalu są wtedy tylko do podglądu,
 * z oznaczeniem, kto je ustawił, a przed startem lokal może zwolnić ekran (28.10).
 */
export function ListaGier({ gry, pusta, lokal = false }: { gry: GraNaLiscie[]; pusta: string; lokal?: boolean }) {
  if (gry.length === 0) return <p className="lista-pusta">{pusta}</p>;
  return (
    <ul className="lista">
      {gry.map((g) =>
        lokal && g.tylko_glowny ? (
          <GraBractwa key={g.id} g={g} />
        ) : (
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
        ),
      )}
    </ul>
  );
}

/**
 * Gra Bractwa w panelu lokalu: bez pilota, wyników i usuwania (host_token nie trafia do strony). „Podgląd” otwiera
 * ekran gry (`/tv/<kod>`, ten sam co na telewizorze, bez sterowania) w nowej karcie. W zapowiedzi i poczekalni
 * „Zwolnij ekran” kończy ją po potwierdzeniu, a Bractwo dostaje powiadomienie; w trakcie gry nie.
 */
function GraBractwa({ g }: { g: GraNaLiscie }) {
  const start = g.planowany_start ? godzina.format(new Date(g.planowany_start)) : null;
  return (
    <li className="gra-bractwa">
      <Miniatura src="/loga/bractwo-biale.svg" alt="" />
      <div className="lista-glowna">
        <div className="lista-tytul">
          {g.quizy?.tytul ?? "Quiz"}{" "}
          <span className={`znaczek${g.faza === "koniec" ? "" : " aktywny"}`}>{NAZWY_FAZ[g.faza]}</span>
        </div>
        <div className="lista-opis">
          {["ustawiło Bractwo Piwne", start && `start ${start}`, data.format(new Date(g.utworzono))]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
      <div className="lista-akcje">
        {g.faza !== "koniec" && (
          <a href={`/tv/${g.kod}`} target="_blank" rel="noopener" className="przycisk-maly">
            Podgląd
          </a>
        )}
        {g.faza === "poczekalnia" ? (
          <PrzyciskPotwierdz
            akcja={zwolnijEkran.bind(null, g.id)}
            pytanie={`To gra Bractwa Piwnego${start ? ` zaplanowana na ${start}` : ""}. Zakończyć ją i zwolnić ekran lokalu? Bractwo dostanie powiadomienie.`}
            tytul="Zwolnij ekran"
            tak="Zakończ i zwolnij"
            className="przycisk-maly niebezpieczny"
          >
            Zwolnij ekran
          </PrzyciskPotwierdz>
        ) : g.faza !== "koniec" ? (
          <span className="pomocniczy">prowadzi Bractwo</span>
        ) : null}
      </div>
    </li>
  );
}
