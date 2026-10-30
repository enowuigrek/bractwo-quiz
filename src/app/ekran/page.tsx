/* eslint-disable @next/next/no-img-element -- loga lokali z /public albo z bucketu Supabase */
import type { Metadata } from "next";
import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";
import { WpiszKod } from "./wpisz-kod";

export const metadata: Metadata = { title: "Ekran · Bractwo Quiz" };

// lista lokali zmienia się rzadko: odświeżamy ją co 5 minut zamiast przy każdym wejściu
export const revalidate = 300;

/**
 * `/ekran` bez adresu: strona dla telewizora. Ekrany lokali do wybrania (od 30.10 tutaj, a nie na stronie głównej,
 * która jest dla graczy) albo kod gry dla TV bez ekranu lokalu.
 */
export default async function Ekran() {
  const { data } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, miasto, logo_url, adres_ekranu")
    .eq("testowy", false)
    .order("miasto")
    .order("nazwa")
    .returns<Pick<Lokal, "id" | "nazwa" | "miasto" | "logo_url" | "adres_ekranu">[]>();
  const lokale = data ?? [];

  return (
    <main className="kolumna glowna">
      <h1>
        <LogoQuiz wysokosc={80} dopisek="ekran" priorytet />
      </h1>

      {lokale.length > 0 && (
        <section className="glowna-sekcja" aria-labelledby="ekrany">
          <h2 id="ekrany" className="nadtytul">
            Ekrany lokali
          </h2>
          <ul className="glowna-lokale">
            {lokale.map((l) => (
              <li key={l.id}>
                <Link href={`/ekran/${l.adres_ekranu}`} className="glowna-lokal">
                  {l.logo_url ? (
                    <img src={l.logo_url} alt="" className="glowna-lokal-logo" />
                  ) : (
                    <span className="glowna-lokal-logo glowna-lokal-litera" aria-hidden>
                      {l.nazwa.slice(0, 1)}
                    </span>
                  )}
                  <span className="glowna-lokal-tekst">
                    <strong>{l.nazwa}</strong>
                    <span>{[l.miasto, `/ekran/${l.adres_ekranu}`].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="glowna-lokal-strzalka" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="glowna-sekcja">
        <WpiszKod cel="/ekran/" przycisk="Pokaż grę na tym ekranie" autoFocus={false} />
      </section>
    </main>
  );
}
