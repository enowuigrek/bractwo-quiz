"use client";

import { useMarka } from "./marka";

/**
 * Hasło kibica z nickiem finalisty: „Jedziesz, Nowy!”. Od 26.10 sam tekst, bez awatara w środku (Łukasz: kibic
 * krzyczy imię).
 */
export function HasloKibica({ haslo, nick }: { haslo: number; nick: string }) {
  const hasla = useMarka().teksty.okrzyki;
  const [przed, po] = hasla[haslo] ?? hasla[0];
  return (
    <span className="haslo-kibica">
      {przed}
      <strong className="haslo-kibica-nick">{nick}</strong>
      {po}
    </span>
  );
}
