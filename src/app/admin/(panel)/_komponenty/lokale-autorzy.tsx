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
