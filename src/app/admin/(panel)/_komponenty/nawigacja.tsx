"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonaUstawienia } from "@/components/ikony";

// Quizy = przygotowanie pytań, Rozgrywki = uruchomione quizy (trwające i historia).
const POZYCJE = [
  { href: "/admin/gry", tekst: "Rozgrywki" },
  { href: "/admin/quizy", tekst: "Quizy" },
] as const;

export function Nawigacja() {
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
        href="/admin/lokale"
        className="przycisk-maly ikona nawigacja-ustawienia"
        aria-label="Ustawienia: lokale"
        data-podpis="Ustawienia"
        aria-current={sciezka.startsWith("/admin/lokale") ? "page" : undefined}
      >
        <IkonaUstawienia />
      </Link>
    </nav>
  );
}
