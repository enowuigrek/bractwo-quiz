"use client";
/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase, skalowane CSS-em na scenie */

import { kiedyStart, opisOdliczania, useDoStartu } from "@/lib/gra/zapowiedz";

type Props = {
  lokal: { nazwa: string; logo_url: string | null } | null;
  /** Zapowiedziany klasyczny pub quiz: tytuł, godzina i odliczanie pod logo. Bez niej sam lokal. */
  zapowiedz?: { planowany_start: string | null; tytul: string | null; okazja: string | null } | null;
  /** Różnica zegara TV względem serwera (ms). */
  przesuniecie?: number;
};

/**
 * Ekran lokalu (26.10, Łukasz): jeden ekran zamiast zmieniających się plansz. Duże logo lokalu na środku, które
 * powoli unosi się nad ciepłym blaskiem, a w tle tylko dryfujące plamy światła (przygaszone logo lokalu w tle
 * jest dopiero w trakcie klasycznego quizu, tlo.tsx). Zapowiedziany klasyczny pub quiz
 * dokłada tytuł, godzinę i odliczanie. Zapowiedziany wyścig po piwo ma dalej plansze (plansze.tsx).
 */
export function EkranLogo({ lokal, zapowiedz = null, przesuniecie = 0 }: Props) {
  const doStartu = useDoStartu(zapowiedz?.planowany_start ?? null, przesuniecie);
  return (
    <div className={`ekran-logo${zapowiedz ? " z-zapowiedzia" : ""}`}>
      <div className="ekran-logo-znak">
        <span className="ekran-logo-blask" aria-hidden />
        {lokal?.logo_url ? (
          <img src={lokal.logo_url} alt={lokal.nazwa} className="ekran-logo-obraz" />
        ) : (
          <span className="ekran-logo-nazwa">{lokal?.nazwa ?? "Quiz"}</span>
        )}
      </div>
      {zapowiedz && (
        <div className="ekran-logo-zapowiedz">
          {zapowiedz.okazja && <p className="tv-okazja">{zapowiedz.okazja}</p>}
          <h1 className="plansza-tytul">{zapowiedz.tytul ?? "Pub quiz"}</h1>
          {zapowiedz.planowany_start && doStartu !== null && (
            <p className="plansza-start">
              <span>
                Start <strong>{kiedyStart(zapowiedz.planowany_start)}</strong>
              </span>
              <span className="plansza-odliczanie">{opisOdliczania(doStartu)}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}
