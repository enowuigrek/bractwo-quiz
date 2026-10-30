import type { Metadata } from "next";
import Link from "next/link";
import { wymagajTworcy } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/serwer";

export const metadata: Metadata = { title: "Konta · Bractwo Quiz" };

type KontoNaLiscie = {
  id: string;
  nazwa: string;
  email: string;
  skrot: string | null;
  zablokowane: boolean;
  ostatnie_logowanie: string | null;
  konta_role: { rola: "tworca" | "bractwo" | "lokal"; lokale: { nazwa: string } | null }[];
};

const kiedy = new Intl.DateTimeFormat("pl-PL", { day: "numeric", month: "short", timeZone: "Europe/Warsaw" });

/** Role konta krótko: „Twórca · Bractwo · Piwiarnia w Alejach”. */
const opisRol = (k: KontoNaLiscie) =>
  [...k.konta_role]
    .sort((a, b) => ["tworca", "bractwo", "lokal"].indexOf(a.rola) - ["tworca", "bractwo", "lokal"].indexOf(b.rola))
    .map((r) => (r.rola === "tworca" ? "Twórca" : r.rola === "bractwo" ? "Bractwo" : (r.lokale?.nazwa ?? "lokal")))
    .join(" · ");

/** Konta osobowe (30.10, tylko twórca): kto ma dostęp i do czego; nowe konta bez ról czekają na górze. */
export default async function Konta() {
  await wymagajTworcy();
  const { data, error } = await supabaseAdmin()
    .from("konta")
    .select("id, nazwa, email, skrot, zablokowane, ostatnie_logowanie, konta_role(rola, lokale(nazwa))")
    .order("nazwa")
    .returns<KontoNaLiscie[]>();
  const konta = data ?? [];
  const czekaja = konta.filter((k) => !k.konta_role.length && !k.zablokowane);
  const reszta = konta.filter((k) => !czekaja.includes(k));

  const wiersz = (k: KontoNaLiscie) => (
    <li key={k.id}>
      <div className="lista-glowna">
        <div className="lista-tytul">
          <Link href={`/admin/konta/${k.id}`}>{k.nazwa}</Link>
        </div>
        <div className="lista-opis">
          {[
            k.email,
            k.zablokowane ? "zablokowane" : opisRol(k) || null,
            !k.skrot ? "bez hasła" : k.ostatnie_logowanie ? `ostatnio ${kiedy.format(new Date(k.ostatnie_logowanie))}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </div>
      </div>
    </li>
  );

  return (
    <main>
      <div className="naglowek-strony">
        <h1>Konta</h1>
        <Link href="/admin/konta/nowe" className="przycisk-maly zloty">
          + Nowe konto
        </Link>
      </div>
      {error && <p className="blad">Nie udało się pobrać kont: {error.message}</p>}
      {czekaja.length > 0 && (
        <section className="panel-sekcja">
          <h2 className="naglowek-z-licznikiem">
            Czekają na dostęp <span className="licznik">{czekaja.length}</span>
          </h2>
          <ul className="lista">{czekaja.map(wiersz)}</ul>
        </section>
      )}
      <section className="panel-sekcja">
        <h2 className="naglowek-z-licznikiem">
          Z dostępem <span className="licznik">{reszta.length}</span>
        </h2>
        <ul className="lista">{reszta.map(wiersz)}</ul>
      </section>
    </main>
  );
}
