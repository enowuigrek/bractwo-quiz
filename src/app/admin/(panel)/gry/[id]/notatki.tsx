"use client";
/* eslint-disable @next/next/no-img-element -- logo lokalu z bucketu Supabase */

import { useActionState, useState } from "react";
import type { StanFormularza } from "@/lib/typy";
import { IkonaEdytuj } from "@/components/ikony";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { zapiszNotatke } from "../akcje";

export type AutorNotatki = { nazwa: string; logo: string | null };

/**
 * Notatka do gry (29.10): zapisana stoi jako zwijana karta (zwinięta: logo autora, data i pierwsza linijka) z logo autora (lokal albo Bractwo) i datą, a pod nią „Edytuj
 * notatkę”; bez notatki sam przycisk „Dodaj notatkę”. Pole do pisania pojawia się dopiero po kliknięciu, na całą
 * szerokość strony. Widzi ją tylko panel (główny i lokal gry), nie gracze ani lokal-gość.
 */
export function Notatki({
  graId,
  notatka,
  autor,
  zmieniono,
}: {
  graId: string;
  notatka: string | null;
  autor: AutorNotatki;
  zmieniono: string | null;
}) {
  const [edycja, ustawEdycje] = useState(false);
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(async (poprzedni, dane) => {
    const wynik = await zapiszNotatke(graId, poprzedni, dane);
    if (wynik.ok) ustawEdycje(false);
    return wynik.ok ? {} : wynik;
  }, {});

  if (edycja) {
    return (
      <form {...bezResetu(akcja)} className="formularz notatki-gry">
        <textarea
          name="notatka"
          className="pole"
          aria-label="Notatka"
          defaultValue={notatka ?? ""}
          maxLength={5000}
          rows={8}
          autoFocus
        />
        <div className="notatki-stopka">
          <button type="submit" className="przycisk-maly zloty" disabled={trwa}>
            {trwa ? "Zapisuję…" : "Zapisz notatkę"}
          </button>
          <button type="button" className="przycisk-maly" onClick={() => ustawEdycje(false)} disabled={trwa}>
            Anuluj
          </button>
          <KomunikatFormularza stan={stan} />
        </div>
      </form>
    );
  }

  return (
    <>
      {notatka && (
        <details className="karta karta-zwijana notatka-karta">
          <summary className="notatka-autor">
            {autor.logo ? (
              <img src={autor.logo} alt="" className="notatka-logo" />
            ) : (
              <span className="notatka-logo notatka-logo-tekst">{autor.nazwa.slice(0, 1)}</span>
            )}
            <span>
              <strong>{autor.nazwa}</strong>
              {zmieniono && (
                <span className="lista-opis">
                  {new Date(zmieniono).toLocaleString("pl-PL", {
                    timeZone: "Europe/Warsaw",
                    day: "numeric",
                    month: "long",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
              {/* zwinięta: pierwsza linijka notatki */}
              <span className="notatka-poczatek">{notatka.split("\n")[0]}</span>
            </span>
          </summary>
          <p className="notatka-tekst">{notatka}</p>
        </details>
      )}
      <button type="button" className="przycisk-maly notatka-przycisk" onClick={() => ustawEdycje(true)}>
        {notatka ? (
          <>
            <IkonaEdytuj /> Edytuj notatkę
          </>
        ) : (
          "+ Dodaj notatkę"
        )}
      </button>
    </>
  );
}
