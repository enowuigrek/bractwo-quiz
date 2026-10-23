"use client";

import { SzklankaPiwa } from "@/components/szklanka-piwa";

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
        {/* bez liczby pytań do końca: tylko szklanka, a na koniec „Nalane!” */}
        {!zostalo && "Nalane! Koniec wyścigu."}
      </p>
    </section>
  );
}
