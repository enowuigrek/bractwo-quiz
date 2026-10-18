import Link from "next/link";
import { LogoQuiz } from "@/components/logo-quiz";
import { wymagajAdmina } from "@/lib/admin";
import { wylogujAdmina } from "../akcje";
import { Nawigacja } from "./_komponenty/nawigacja";
import "./panel.css";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  await wymagajAdmina();

  return (
    <div className="kolumna" style={{ maxWidth: "var(--max-w-header)" }}>
      <header className="panel-naglowek">
        <Link href="/admin" aria-label="Panel, strona główna" style={{ textDecoration: "none" }}>
          <LogoQuiz wysokosc={44} dopisek="panel" />
        </Link>
        <form action={wylogujAdmina}>
          <button type="submit" className="przycisk-maly">
            Wyloguj
          </button>
        </form>
      </header>
      <Nawigacja />
      {children}
    </div>
  );
}
