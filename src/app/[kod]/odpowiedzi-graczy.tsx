"use client";

import { useEffect, useState } from "react";
import { Awatar } from "@/components/awatar";
import type { WierszOdpowiedzi } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Po pytaniu, gdy TV pokazuje, kto jak odpowiedział (faza `odpowiedzi`), telefon pokazuje to samo (26.10): trzy
 * grupy w kolorach (dobrze, częściowo, źle i bez odpowiedzi), w każdej kapsle z nickami, Twój wyróżniony.
 * Te same dane co TV (`odpowiedzi_zadania`).
 */
export function OdpowiedziGraczy({ kod, zadanieId, nick }: { kod: string; zadanieId: string; nick: string }) {
  const [odpowiedzi, ustawOdpowiedzi] = useState<WierszOdpowiedzi[] | null>(null);
  useEffect(() => {
    let anuluj = false;
    void supabase()
      .rpc("odpowiedzi_zadania", { p_kod: kod })
      .then(({ data }) => {
        if (!anuluj && data) ustawOdpowiedzi(data as WierszOdpowiedzi[]);
      });
    return () => {
      anuluj = true;
    };
  }, [kod, zadanieId]);
  if (!odpowiedzi) return null;

  const grupy = [
    { klasa: "dobrze", tytul: "Dobrze", lista: odpowiedzi.filter((o) => o.poprawna === true) },
    {
      klasa: "czesciowo",
      tytul: "Częściowo",
      lista: odpowiedzi.filter((o) => o.poprawna === false && (o.ocena ?? 0) > 0),
    },
    {
      klasa: "zle",
      tytul: "Źle",
      lista: odpowiedzi.filter((o) => o.poprawna === null || (o.poprawna === false && !((o.ocena ?? 0) > 0))),
    },
  ].filter((g) => g.lista.length > 0 || g.klasa === "dobrze");

  return (
    <div className="odpowiedzi-graczy">
      {grupy.map((g) => (
        <section key={g.klasa} className={`odpowiedzi-graczy-ramka ${g.klasa}`}>
          <p className="odpowiedzi-graczy-etykieta">
            {g.tytul} <span>{g.lista.length}</span>
          </p>
          {g.lista.length === 0 ? (
            <p className="odpowiedzi-graczy-pusto">Nikt.</p>
          ) : (
            <ul>
              {g.lista.map((o) => (
                <li key={o.nick} className={o.nick === nick ? "ja" : undefined}>
                  <Awatar nick={o.nick} zdjecie={o.zdjecie} rozmiar={24} />
                  <span>{o.nick}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
