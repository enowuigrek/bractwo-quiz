import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { wymagajAdmina } from "@/lib/admin";
import { wylogujAdmina } from "../akcje";
import { MenuPanelu, type GraWMenu } from "./_komponenty/menu";
import { widoczne } from "@/lib/admin-dostep";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { NAZWY_FAZ, type Faza } from "@/lib/typy";
import { Nawigacja } from "./_komponenty/nawigacja";
import "./panel.css";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const rola = await wymagajAdmina();
  // trwająca gra (najnowsza, którą ta rola widzi): w menu skrót do jej pilota zamiast „Uruchom quiz”
  const { data: trwa } = await supabaseAdmin()
    .from("sesje")
    .select("kod, host_token, faza, poczekalnia_otwarta, quizy(tytul), lokale(nazwa, logo_url)")
    .neq("faza", "koniec")
    .in("tylko_glowny", widoczne(rola))
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
        status: trwa.faza === "poczekalnia" && !trwa.poczekalnia_otwarta ? "zapowiedź" : (NAZWY_FAZ[trwa.faza] ?? "trwa"),
        lokal: trwa.lokale,
      }
    : null;

  return (
    <div className="panel">
      <header className="panel-naglowek">
        <Link href="/admin" className="panel-logo" aria-label="Panel, strona główna" style={{ textDecoration: "none" }}>
          <LogoQuiz wysokosc={44} dopisek="panel" />
        </Link>
        <Nawigacja />
        <form action={wylogujAdmina} className="panel-wyloguj">
          <button type="submit" className="przycisk-maly">
            Wyloguj
          </button>
        </form>
        {/* telefon: zamiast paska i „Wyloguj” samo menu obok logo */}
        <MenuPanelu wyloguj={wylogujAdmina} gra={gra} />
      </header>
      {children}
    </div>
  );
}
