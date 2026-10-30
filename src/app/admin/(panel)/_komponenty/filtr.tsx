"use client";

import { useRouter } from "next/navigation";

/** Opcja listy rozwijanej filtra: adres strony z tym filtrem i (opcjonalnie) grupa, np. miasto lokalu. */
export type OpcjaFiltra = { href: string; napis: string; grupa?: string | null };

/**
 * Filtr nad listą panelu (30.10): podpis i lista rozwijana, wybór przechodzi od razu na adres opcji. Pierwsza opcja to
 * „wszystkie” (bez filtra). Ustawiony filtr ma złotą ramkę (`.ustawiony`). Opcje z grupą idą w `<optgroup>`.
 */
export function Filtr({
  podpis,
  wszystkie,
  opcje,
  wybrana,
}: {
  podpis: string;
  wszystkie: OpcjaFiltra;
  opcje: OpcjaFiltra[];
  /** href wybranej opcji albo null („wszystkie”) */
  wybrana: string | null;
}) {
  const router = useRouter();
  const grupy: { grupa: string | null; opcje: OpcjaFiltra[] }[] = [];
  for (const o of opcje) {
    const grupa = o.grupa ?? null;
    const ostatnia = grupy.at(-1);
    if (ostatnia && ostatnia.grupa === grupa) ostatnia.opcje.push(o);
    else grupy.push({ grupa, opcje: [o] });
  }
  const opcja = (o: OpcjaFiltra) => (
    <option key={o.href} value={o.href}>
      {o.napis}
    </option>
  );
  return (
    <label className="filtr">
      <span className="filtr-podpis">{podpis}</span>
      <select
        value={wybrana ?? wszystkie.href}
        className={wybrana ? "ustawiony" : undefined}
        onChange={(e) => router.push(e.target.value, { scroll: false })}
      >
        {opcja(wszystkie)}
        {grupy.map((g) =>
          g.grupa ? (
            <optgroup key={g.grupa} label={g.grupa}>
              {g.opcje.map(opcja)}
            </optgroup>
          ) : (
            g.opcje.map(opcja)
          ),
        )}
      </select>
    </label>
  );
}
