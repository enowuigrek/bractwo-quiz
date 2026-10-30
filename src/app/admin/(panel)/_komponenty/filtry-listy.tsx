import Link from "next/link";
import { NAZWY_RODZAJOW, type RodzajQuizu } from "@/lib/tagi";
import { Filtr, type OpcjaFiltra } from "./filtr";
import { BRACTWO, miastaLokali, type LokalAutor } from "./lokale-autorzy";

/**
 * Wspólne klocki list „Quizy” i „Rozgrywki”: obie strony mają ten sam układ (nagłówek, zakładki rodzaju, filtry,
 * lista), żeby przy przełączaniu nic nie skakało. Od 30.10 zakładki to zakładki z paskiem (`.zakladki`), a filtry to
 * równe listy rozwijane (`Filtr`): miasto (gdy lokale są w kilku miastach), lokal i temat.
 */

/** Zakładki „Wyścig po piwo / Pub quiz”. */
export function ZakladkiRodzaju({ rodzaj, adres }: { rodzaj: RodzajQuizu; adres: (r: RodzajQuizu) => string }) {
  return (
    <nav className="zakladki" aria-label="Rodzaj quizu">
      {(["wyscig", "klasyczny"] as const).map((r) => (
        <Link key={r} href={adres(r)} aria-current={rodzaj === r ? "page" : undefined}>
          {NAZWY_RODZAJOW[r]}
        </Link>
      ))}
    </nav>
  );
}

/** Wybrane filtry listy (wartości z adresu, już sprawdzone). */
export type WybraneFiltry = { miasto: string | null; lokal: string | null; tag: string | null };

/**
 * Rząd filtrów nad listą. `adres` składa adres strony z podanymi filtrami. Zmiana miasta zeruje lokal, a lokale
 * w liście są pogrupowane według miast, gdy miast jest kilka. Lokal (rola) nie ma filtra lokali: dostaje pustą listę.
 */
export function FiltryListy({
  lokale,
  tagi,
  wybrane,
  adres,
  podpisLokalu,
  zBractwem = false,
}: {
  lokale: LokalAutor[];
  tagi: string[];
  wybrane: WybraneFiltry;
  adres: (filtry: WybraneFiltry) => string;
  /** „Lokal” w rozgrywkach, „Autor” w quizach */
  podpisLokalu: string;
  /** opcja „Bractwo” (quizy bez lokalu) */
  zBractwem?: boolean;
}) {
  const miasta = miastaLokali(lokale);
  const { miasto, lokal, tag } = wybrane;
  const zLokalem = (l: string | null) => adres({ ...wybrane, lokal: l });
  const wMiescie = miasto ? lokale.filter((l) => l.miasto === miasto) : lokale;
  const opcjeLokali: OpcjaFiltra[] = [
    ...(zBractwem && !miasto ? [{ href: zLokalem(BRACTWO), napis: "Bractwo" }] : []),
    ...wMiescie.map((l) => ({
      href: zLokalem(l.id),
      napis: l.nazwa,
      grupa: miasta.length > 1 && !miasto ? (l.miasto ?? "Bez miasta") : null,
    })),
  ];
  return (
    <div className="filtry">
      {miasta.length > 1 && (
        <Filtr
          podpis="Miasto"
          wszystkie={{ href: adres({ ...wybrane, miasto: null, lokal: null }), napis: "Wszystkie" }}
          opcje={miasta.map((m) => ({ href: adres({ ...wybrane, miasto: m, lokal: null }), napis: m }))}
          wybrana={miasto && adres({ ...wybrane, lokal: null })}
        />
      )}
      {lokale.length > 0 && (
        <Filtr
          podpis={podpisLokalu}
          wszystkie={{ href: zLokalem(null), napis: "Wszystkie" }}
          opcje={opcjeLokali}
          wybrana={lokal && zLokalem(lokal)}
        />
      )}
      {tagi.length > 0 && (
        <Filtr
          podpis="Temat"
          wszystkie={{ href: adres({ ...wybrane, tag: null }), napis: "Wszystkie" }}
          opcje={tagi.map((t) => ({ href: adres({ ...wybrane, tag: t }), napis: t }))}
          wybrana={tag && adres(wybrane)}
        />
      )}
    </div>
  );
}
