"use client";

import { useEffect, useState } from "react";
import type { WierszOdpowiedzi } from "@/lib/gra/typy";
import type { TypZadania } from "@/lib/zadania";
import { supabase } from "@/lib/supabase/przegladarka";

/**
 * Po pytaniu, gdy TV pokazuje, kto jak odpowiedział (faza `odpowiedzi`), telefon pokazuje ile osób (26.10, od 18.11
 * bez nicków): trzy grupy w kolorach (dobrze, częściowo, źle i bez odpowiedzi), grupa z Tobą wyróżniona.
 * Te same dane co TV (`odpowiedzi_zadania`). W szacowaniu środkowa grupa to „Blisko”, nie „Częściowo” (28.10).
 */
export function OdpowiedziGraczy({
  kod,
  zadanieId,
  nick,
  typ,
}: {
  kod: string;
  zadanieId: string;
  nick: string;
  typ: TypZadania;
}) {
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
      tytul: typ === "szacowanie" ? "Blisko" : "Częściowo",
      lista: odpowiedzi.filter((o) => o.poprawna === false && (o.ocena ?? 0) > 0),
    },
    {
      klasa: "zle",
      tytul: "Źle",
      lista: odpowiedzi.filter((o) => o.poprawna === null || (o.poprawna === false && !((o.ocena ?? 0) > 0))),
    },
  ].filter((g) => g.lista.length > 0 || g.klasa === "dobrze");

  // same liczby (18.11): listy nicków przy dużej grupie były za długie, pełne listy są na TV
  return (
    <div className="odpowiedzi-graczy">
      {grupy.map((g) => (
        <section
          key={g.klasa}
          className={`odpowiedzi-graczy-ramka ${g.klasa}${g.lista.some((o) => o.nick === nick) ? " ja" : ""}`}
        >
          <p className="odpowiedzi-graczy-etykieta">
            {g.tytul} <span>{g.lista.length}</span>
          </p>
        </section>
      ))}
    </div>
  );
}
