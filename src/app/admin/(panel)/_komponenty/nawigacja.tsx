"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonaUstawienia } from "@/components/ikony";

// Quizy = przygotowanie pytań, Rozgrywki = uruchomione quizy (trwające i historia).
const POZYCJE = [
  { href: "/admin/gry", tekst: "Rozgrywki" },
  { href: "/admin/quizy", tekst: "Quizy" },
] as const;

/**
 * `ustawienia`: lista lokali u głównego, strona własnego lokalu w panelu lokalu (wtedy zamiast zębatki logo lokalu).
 */
export function Nawigacja({
  ustawienia,
  lokal = null,
}: {
  ustawienia: string;
  lokal?: { nazwa: string; logo_url: string | null } | null;
}) {
  const sciezka = usePathname();
  const uruchamianie = sciezka.startsWith("/admin/gry/nowa");
  return (
    <nav className="panel-nawigacja" aria-label="Panel">
      {POZYCJE.map((p) => (
        <Link
          key={p.href}
          href={p.href}
          aria-current={sciezka.startsWith(p.href) && !uruchamianie ? "page" : undefined}
        >
          {p.tekst}
        </Link>
      ))}
      {/* najważniejsza akcja w lokalu: zawsze pod ręką */}
      <Link
        href="/admin/gry/nowa"
        className="przycisk-maly zloty nawigacja-start"
        aria-current={uruchamianie ? "page" : undefined}
      >
        ▶ Uruchom<span className="na-szerokim"> quiz</span>
      </Link>
      <Link
        href={ustawienia}
        className="przycisk-maly ikona nawigacja-ustawienia"
        aria-label="Ustawienia lokalu"
        data-podpis={lokal ? "Mój lokal" : "Ustawienia"}
        aria-current={sciezka.startsWith("/admin/lokale") ? "page" : undefined}
      >
        {lokal?.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo lokalu z bucketu Supabase
          <img src={lokal.logo_url} alt="" className="nawigacja-logo-lokalu" />
        ) : (
          <IkonaUstawienia />
        )}
      </Link>
    </nav>
  );
}
