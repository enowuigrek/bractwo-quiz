/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase */
/** Lokal w filtrach i znaczkach panelu głównego. */
export type LokalAutor = { id: string; nazwa: string; logo_url: string | null; miasto?: string | null };

/** Miasta lokali, bez powtórzeń i po kolei; filtr „Miasto” pojawia się dopiero przy dwóch. */
export const miastaLokali = (lokale: LokalAutor[]) =>
  [...new Set(lokale.map((l) => l.miasto).filter((m): m is string => !!m))].sort((a, b) => a.localeCompare(b, "pl"));

/** Miasto z adresu (`?miasto=`) albo null (wszystkie). */
export function wybraneMiasto(wartosc: string | string[] | undefined, lokale: LokalAutor[]) {
  return typeof wartosc === "string" && miastaLokali(lokale).includes(wartosc) ? wartosc : null;
}

/** Wartość filtra `?lokal=` dla rzeczy Bractwa (bez lokalu: quizy założone przez głównego). */
export const BRACTWO = "bractwo";

/** Lokal z adresu (`?lokal=`) albo null (wszystkie). */
export function wybranyLokal(
  wartosc: string | string[] | undefined,
  lokale: LokalAutor[],
  zBractwem: boolean,
  miasto: string | null = null,
) {
  if (typeof wartosc !== "string") return null;
  if (zBractwem && !miasto && wartosc === BRACTWO) return BRACTWO;
  return lokale.some((l) => l.id === wartosc && (!miasto || l.miasto === miasto)) ? wartosc : null;
}

/** Inicjały z imienia i nazwiska: „Łukasz Nowak” → „ŁN”, samo imię → „Ł”. */
export const inicjaly = (nazwa: string) =>
  nazwa
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]!.toUpperCase())
    .join("");

/** Osoba z konta: imię i zdjęcie (konta osobowe, 30.10). */
export type Osoba = { nazwa: string; zdjecie_url?: string | null };

/**
 * Osoba, która założyła quiz albo uruchomiła grę: kółko ze zdjęciem z „Mojego konta”, a bez zdjęcia z inicjałami;
 * imię w podpowiedzi. Bez autora (starsze rzeczy) puste miejsce tej samej szerokości, żeby kolumna ikon się nie
 * rozjeżdżała. `duzy`: podgląd na „Moim koncie”.
 */
export function ZnaczekOsoby({ osoba, duzy = false }: { osoba: Osoba | null; duzy?: boolean }) {
  if (!osoba) return <span className="znaczek-osoby pusty" aria-hidden />;
  const klasa = `znaczek-osoby${duzy ? " duzy" : ""}`;
  return osoba.zdjecie_url ? (
    <img src={osoba.zdjecie_url} alt={osoba.nazwa} title={osoba.nazwa} className={klasa} />
  ) : (
    <span className={klasa} title={osoba.nazwa} aria-label={osoba.nazwa}>
      {inicjaly(osoba.nazwa)}
    </span>
  );
}

/** Znaczek autora w wierszu listy: logo lokalu (albo Bractwa), z nazwą w podpowiedzi. */
export function ZnaczekLokalu({ lokal }: { lokal: LokalAutor | null }) {
  if (!lokal) {
    return <img src="/loga/bractwo.svg" alt="Bractwo" title="Bractwo" className="znaczek-lokalu logo-bractwo" />;
  }
  return lokal.logo_url ? (
    <img src={lokal.logo_url} alt={lokal.nazwa} title={lokal.nazwa} className="znaczek-lokalu" />
  ) : (
    <span className="znaczek-lokalu znaczek-lokalu-nazwa" title={lokal.nazwa}>
      {lokal.nazwa.slice(0, 2)}
    </span>
  );
}
