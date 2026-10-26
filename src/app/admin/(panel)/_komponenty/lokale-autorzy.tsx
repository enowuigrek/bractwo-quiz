/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase */
import Link from "next/link";

/** Lokal w filtrach i znaczkach panelu głównego. */
export type LokalAutor = { id: string; nazwa: string; logo_url: string | null };

/** Wartość filtra `?lokal=` dla rzeczy Bractwa (bez lokalu: quizy założone przez głównego). */
export const BRACTWO = "bractwo";

/** Lokal z adresu (`?lokal=`) albo null (wszystkie). */
export function wybranyLokal(wartosc: string | string[] | undefined, lokale: LokalAutor[], zBractwem: boolean) {
  if (typeof wartosc !== "string") return null;
  if (zBractwem && wartosc === BRACTWO) return BRACTWO;
  return lokale.some((l) => l.id === wartosc) ? wartosc : null;
}

/**
 * Filtr „kto” u głównego (26.10): wszystkie, Bractwo (tylko w quizach) i każdy lokal z logo. `adres` składa
 * adres strony z wybranym filtrem (pozostałe filtry strony zostają).
 */
export function FiltrLokali({
  lokale,
  wybrany,
  adres,
  zBractwem = false,
}: {
  lokale: LokalAutor[];
  wybrany: string | null;
  adres: (lokal: string | null) => string;
  zBractwem?: boolean;
}) {
  if (lokale.length === 0) return null;
  return (
    <p className="tagi filtr-lokali" aria-label="Kto">
      <Link href={adres(null)} className={`tag${wybrany ? "" : " wybrany"}`}>
        wszyscy
      </Link>
      {zBractwem && (
        <Link href={adres(BRACTWO)} className={`tag${wybrany === BRACTWO ? " wybrany" : ""}`}>
          <img src="/loga/bractwo.svg" alt="" className="tag-logo logo-bractwo" /> Bractwo
        </Link>
      )}
      {lokale.map((l) => (
        <Link key={l.id} href={adres(l.id)} className={`tag${wybrany === l.id ? " wybrany" : ""}`}>
          {l.logo_url && <img src={l.logo_url} alt="" className="tag-logo" />}
          {l.nazwa}
        </Link>
      ))}
    </p>
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
