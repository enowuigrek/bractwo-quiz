import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { wymagajAdmina } from "@/lib/admin";
import { wylogujAdmina } from "../akcje";
import { Nawigacja } from "./_komponenty/nawigacja";
import "./panel.css";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await wymagajAdmina();

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
      </header>
      {children}
    </div>
  );
}
