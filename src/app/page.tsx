/* eslint-disable @next/next/no-img-element -- loga lokali z /public albo z bucketu Supabase */
import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { WpiszKod } from "./ekran/wpisz-kod";

// zapowiedzi zmieniają się rzadko: odświeżamy co minutę zamiast przy każdym wejściu
export const revalidate = 60;

type Zapowiedziana = {
  kod: string;
  planowany_start: string;
  okazja: string | null;
  quizy: { etapy: { count: number }[] } | null;
  lokale: { nazwa: string; miasto: string | null; logo_url: string | null } | null;
};

/** „pt 7.11, 19:00” w czasie polskim (serwer liczy w UTC). */
function kiedy(iso: string) {
  const d = new Date(iso);
  const dzien = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", weekday: "short" });
  const data = d.toLocaleDateString("pl-PL", { timeZone: "Europe/Warsaw", day: "numeric", month: "numeric" });
  const godzina = d.toLocaleTimeString("pl-PL", { timeZone: "Europe/Warsaw", hour: "2-digit", minute: "2-digit" });
  return `${dzien.replace(".", "")} ${data}, ${godzina}`;
}

/**
 * Zapowiedziane gry w lokalach, jeszcze przed startem (godzinę po planowanym starcie znikają, nawet jeśli prowadzący
 * zaczął później); gry testowe bez lokalu i „tylko dla mnie” się nie pokazują.
 */
async function zapowiedziane() {
  const { data } = await supabaseAdmin()
    .from("sesje")
    .select("kod, planowany_start, okazja, quizy(etapy(count)), lokale(nazwa, miasto, logo_url)")
    .eq("faza", "poczekalnia")
    .eq("tylko_glowny", false)
    .not("lokal_id", "is", null)
    .gte("planowany_start", new Date(Date.now() - 60 * 60 * 1000).toISOString())
    .order("planowany_start")
    .limit(6)
    .returns<Zapowiedziana[]>();
  return data ?? [];
}

/**
 * Strona główna dla graczy (30.10): pole na kod gry i najbliższe quizy w lokalach. QR z telewizora prowadzi od razu
 * do gry (`/<kod>`), więc tu trafia ten, kto wpisał adres z pamięci albo z plakatu. Ekrany lokali są w panelu
 * (strona lokalu), a panel ma link w stopce.
 */
export default async function Home() {
  const zapowiedzi = await zapowiedziane();

  return (
    <main className="kolumna glowna">
      <h1>
        <LogoQuiz wysokosc={96} priorytet />
      </h1>

      <section className="glowna-sekcja">
        <WpiszKod cel="/" przycisk="Graj" />
      </section>

      {zapowiedzi.length > 0 && (
        <section className="glowna-sekcja" aria-labelledby="najblizsze">
          <h2 id="najblizsze" className="nadtytul">
            Najbliższe quizy
          </h2>
          <ul className="glowna-lokale">
            {zapowiedzi.map((g) => (
              <li key={g.kod} className="glowna-lokal">
                {g.lokale?.logo_url ? (
                  <img src={g.lokale.logo_url} alt="" className="glowna-lokal-logo" />
                ) : (
                  <span className="glowna-lokal-logo glowna-lokal-litera" aria-hidden>
                    {g.lokale?.nazwa.slice(0, 1)}
                  </span>
                )}
                <span className="glowna-lokal-tekst">
                  <strong>{g.lokale?.nazwa}</strong>
                  <span>
                    {[
                      kiedy(g.planowany_start),
                      g.okazja ?? ((g.quizy?.etapy[0]?.count ?? 0) > 0 ? "Wyścig po piwo" : "Pub quiz"),
                      g.lokale?.miasto,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="glowna-stopka">
        <nav aria-label="Linki">
          <a href="https://bractwopiwne.pl" target="_blank" rel="noopener">
            bractwopiwne.pl
          </a>
          <Link href="/ekran">Ekran TV</Link>
          <Link href="/admin">Panel</Link>
        </nav>
        <p className="autor">
          <span className="autor-etykieta">Aplikacja</span>
          <a href="https://lukasznowak.dev" target="_blank" rel="noopener">
            lukasznowak.dev
          </a>
        </p>
      </footer>
    </main>
  );
}
