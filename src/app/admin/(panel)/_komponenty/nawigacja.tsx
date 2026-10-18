"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const POZYCJE = [
  { href: "/admin/gry", tekst: "Gry" },
  { href: "/admin/quizy", tekst: "Quizy" },
  { href: "/admin/piwiarnie", tekst: "Piwiarnie" },
] as const;

export function Nawigacja() {
  const sciezka = usePathname();
  return (
    <nav className="panel-nawigacja" aria-label="Panel">
      {POZYCJE.map((p) => (
        <Link key={p.href} href={p.href} aria-current={sciezka.startsWith(p.href) ? "page" : undefined}>
          {p.tekst}
        </Link>
      ))}
    </nav>
  );
}
