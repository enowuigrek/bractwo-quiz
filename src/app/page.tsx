/* eslint-disable @next/next/no-img-element -- loga lokali z /public albo z bucketu Supabase */
import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Lokal } from "@/lib/typy";

// lista lokali zmienia się rzadko: odświeżamy ją co 5 minut zamiast przy każdym wejściu
export const revalidate = 300;

/**
 * Strona główna dla obsługi: ekrany lokali do otwarcia na telewizorze, panel i opis, jak to działa.
 * Gracze tu nie trafiają: QR z telewizora prowadzi od razu do gry (`/<kod>`).
 */
export default async function Home() {
  const { data } = await supabaseAdmin()
    .from("lokale")
    .select("id, nazwa, miasto, logo_url, adres_ekranu")
    .order("miasto")
    .order("nazwa")
    .returns<Pick<Lokal, "id" | "nazwa" | "miasto" | "logo_url" | "adres_ekranu">[]>();
  const lokale = data ?? [];

  return (
    <main className="kolumna glowna">
      <h1 style={{ marginBottom: "var(--section-gap)" }}>
        <LogoQuiz wysokosc={96} priorytet />
      </h1>

      {lokale.length > 0 && (
        <section className="glowna-sekcja" aria-labelledby="ekrany">
          <h2 id="ekrany" className="nadtytul">
            Ekrany lokali
          </h2>
          <p className="pomocniczy">
            Otwórz ekran swojego lokalu na telewizorze i zostaw go włączonego. Gdy ruszy quiz, ekran przełączy się sam.
          </p>
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

      <section className="glowna-sekcja" aria-labelledby="prowadzisz">
        <h2 id="prowadzisz" className="nadtytul">
          Prowadzisz quiz?
        </h2>
        <div className="glowna-przyciski">
          <Link href="/admin" className="przycisk zloty">
            Panel obsługi
          </Link>
          <Link href="/jak-to-dziala" className="przycisk">
            Jak to działa?
          </Link>
        </div>
      </section>

      <p className="autor">
        <span className="autor-etykieta">Aplikacja</span>
        <a href="https://lukasznowak.dev" target="_blank" rel="noopener">
          lukasznowak.dev
        </a>
      </p>
    </main>
  );
}
