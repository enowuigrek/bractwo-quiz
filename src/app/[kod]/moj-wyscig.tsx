"use client";

import { SzklankaPiwa } from "@/components/szklanka-piwa";

function pytan(n: number): string {
  if (n === 1) return "pytanie";
  const r10 = n % 10;
  const r100 = n % 100;
  return r10 >= 2 && r10 <= 4 && (r100 < 12 || r100 > 14) ? "pytania" : "pytań";
}

/**
 * Wyścig po piwo na telefonie (ranking, gdy TV pokazuje wyścig): duża szklanka na środku, która dolewa
 * się po pytaniu tak jak na TV. Najpierw stan sprzed pytania, po chwili piwo rośnie z pianą na wierzchu.
 */
export function MojWyscig({ lp, n }: { lp: number; n: number }) {
  const zostalo = Math.max(0, n - lp);
  return (
    <section className="moj-wyscig" aria-label="Wyścig po piwo">
      <div className="moj-wyscig-szklanka">
        <SzklankaPiwa przed={n ? Math.min(1, (lp - 1) / n) : 0} teraz={n ? Math.min(1, lp / n) : 0} opoznienie={0.5} />
      </div>
      <p className="moj-wyscig-opis">
        {zostalo ? (
          <>
            Wyścig po piwo: jeszcze <strong>{zostalo}</strong> {pytan(zostalo)}
          </>
        ) : (
          "Nalane! Koniec wyścigu."
        )}
      </p>
    </section>
  );
}
