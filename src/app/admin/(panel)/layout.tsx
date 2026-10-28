import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { lokalRoli, wymagajAdmina } from "@/lib/admin";
import { wylogujAdmina } from "../akcje";
import { MenuPanelu, type GraWMenu } from "./_komponenty/menu";
import { filtrGier } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import type { Faza } from "@/lib/typy";
import { Nawigacja } from "./_komponenty/nawigacja";
import { Powiadomienia } from "./_komponenty/powiadomienia";
import "./panel.css";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const rola = await wymagajAdmina();
  const lokalId = lokalRoli(rola);
  const db = supabaseAdmin();
  // panel lokalu: jego logo w nagłówku (lokal z lewej, Bractwo z prawej), ustawienia to jego strona
  const { data: lokal } = lokalId
    ? await db
        .from("lokale")
        .select("nazwa, logo_url")
        .eq("id", lokalId)
        .maybeSingle<{ nazwa: string; logo_url: string | null }>()
    : { data: null };
  const ustawienia = lokalId ? `/admin/lokale/${lokalId}` : "/admin/lokale";
  // trwająca gra (najnowsza, którą ta rola widzi): w menu skrót do jej pilota zamiast „Uruchom quiz”
  const { data: trwa } = await filtrGier(
    db
      .from("sesje")
      .select("kod, host_token, faza, poczekalnia_otwarta, quizy(tytul), lokale(nazwa, logo_url)")
      .neq("faza", "koniec"),
    rola,
  )
    .order("utworzono", { ascending: false })
    .limit(1)
    .maybeSingle<{
      kod: string;
      host_token: string;
      faza: Faza;
      poczekalnia_otwarta: boolean;
      quizy: { tytul: string } | null;
      lokale: { nazwa: string; logo_url: string | null } | null;
    }>();
  const gra: GraWMenu | null = trwa
    ? {
        href: `/pilot/${trwa.kod}?t=${trwa.host_token}`,
        tytul: trwa.quizy?.tytul ?? "Quiz",
        kod: trwa.kod,
        faza: trwa.faza,
        poczekalniaOtwarta: trwa.poczekalnia_otwarta,
        lokal: trwa.lokale,
      }
    : null;

  return (
    <div className="panel">
      <header className="panel-naglowek">
        <Link href="/admin" className="panel-logo" aria-label="Panel, strona główna" style={{ textDecoration: "none" }}>
          {lokal &&
            (lokal.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element -- logo lokalu z bucketu Supabase
              <img src={lokal.logo_url} alt={lokal.nazwa} className="panel-logo-lokalu" />
            ) : (
              <span className="panel-logo-lokalu">{lokal.nazwa}</span>
            ))}
          <LogoQuiz wysokosc={44} dopisek={lokal ? undefined : "panel"} />
        </Link>
        <Nawigacja ustawienia={ustawienia} lokal={lokal} />
        <form action={wylogujAdmina} className="panel-wyloguj">
          <button type="submit" className="przycisk-maly">
            Wyloguj
          </button>
        </form>
        {/* telefon: zamiast paska i „Wyloguj” samo menu obok logo */}
        <MenuPanelu wyloguj={wylogujAdmina} gra={gra} ustawienia={ustawienia} lokal={lokal} />
      </header>
      <Powiadomienia rola={rola} />
      {children}
    </div>
  );
}
