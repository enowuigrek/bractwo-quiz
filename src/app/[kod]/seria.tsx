"use client";
/* eslint-disable @next/next/no-img-element -- grafiki pytań z bucketu Supabase */

import { useEffect, useState } from "react";
import { Werble } from "@/components/werble";
import { krokiFinalu, META_FINALU } from "@/lib/gra/final";
import { komunikatBledu } from "@/lib/gra/nasluch";
import type { PytanieSerii, StanSesji, ZapisOdpowiedzi, ZadanieWidoczne } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { LITERY, type DaneOdpowiedzi } from "@/lib/zadania";
import {
  OdpowiedzKolejnosc,
  OdpowiedzLiczba,
  OdpowiedzPary,
  OdpowiedzPrawdaFalsz,
  OdpowiedzWielokrotna,
} from "./odpowiadanie";
import { Kibicowanie } from "./kibic";
import { czyKibic, type Ja } from "./rozgrywka";

/**
 * Utrudnienia w drugiej połowie finału: od połowy drogi do szklanki (własne kroki z przewagą, src/lib/gra/final.ts)
 * każde pytanie coś robi, za każdym razem co innego. Same efekty to CSS (`.utrudnienie-*` w globals.css).
 */
const UTRUDNIENIA = ["drzenie", "zamiana", "mgla", "dryf", "zanikanie", "ucieczka", "kolysanie"] as const;
/** Te działają na przyciskach prawda/fałsz; przy innym rodzaju pytania zamiast nich drży treść. */
const NA_PRZYCISKACH: readonly string[] = ["zamiana", "ucieczka"];

function utrudnienie(kroki: number, ktore: number, typ: string): string | null {
  // od połowy drogi do szklanki (własne kroki z przewagą), co pytanie inny przeszkadzacz
  if (kroki < META_FINALU / 2) return null;
  const efekt = UTRUDNIENIA[ktore % UTRUDNIENIA.length];
  return typ !== "prawda_falsz" && NA_PRZYCISKACH.includes(efekt) ? "drzenie" : efekt;
}

/**
 * Ile trwa ocena po odpowiedzi w finale (błysk tła, puls albo drżenie przycisku); przyciski stoją wtedy
 * zablokowane. Krótko w pierwszej połowie drogi, a od utrudnień coraz dłużej: 0,4 s → 1 s tuż przed szklanką.
 */
function czasOceny(kroki: number): number {
  const polowa = META_FINALU / 2;
  if (kroki < polowa) return 400;
  return Math.round(Math.min(1000, 600 + (400 * (kroki - polowa)) / Math.max(1, META_FINALU - 1 - polowa)));
}

type Ocena = { id: string; dane: DaneOdpowiedzi; dobrze: boolean; ms: number };

/** Pytanie serii w kształcie, którego oczekują komponenty odpowiadania. */
function jakoZadanie(p: PytanieSerii): ZadanieWidoczne {
  return { ...p, lp: 0, czas_s: null, podpowiedzi: [], liczba_podpowiedzi: 0, podpowiedzi_co_s: null };
}

/**
 * Telefon w serii (faza `seria`): pytania etapu jedno po drugim we własnym tempie. Po odpowiedzi od razu
 * następne, bez wyniku (wynik i ranking po całej serii). Kibice w finale wysyłają okrzyki (kibic.tsx).
 */
export function SeriaGracza({ stan, ja, teraz }: { stan: StanSesji; ja: Ja; teraz: number }) {
  const [pytania, ustawPytania] = useState<PytanieSerii[] | null>(null);
  const [odpowiedziane, ustawOdpowiedziane] = useState<string[]>([]);
  const [wysylam, ustawWysylam] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
  // finał: chwila oceny po odpowiedzi, zanim pojawi się następne pytanie
  const [ocena, ustawOcena] = useState<Ocena | null>(null);
  const od = stan.faza_od ? Date.parse(stan.faza_od) : teraz;
  const do_ = stan.faza_do ? Date.parse(stan.faza_do) : teraz;
  const wystartowala = teraz >= od;
  const kibic = czyKibic(stan, ja.nick);

  // pytania dopiero po starcie serii (wcześniej baza ich nie wyda)
  useEffect(() => {
    if (!wystartowala || pytania !== null || kibic) return;
    let anuluj = false;
    void supabase()
      .rpc("seria_pytania", { p_token: ja.token })
      .then(({ data }) => {
        if (anuluj || !data) return;
        const d = data as { pytania: PytanieSerii[]; odpowiedziane: string[] };
        if (d.pytania.length === 0) return;
        ustawPytania(d.pytania);
        ustawOdpowiedziane(d.odpowiedziane);
      });
    return () => {
      anuluj = true;
    };
  }, [wystartowala, pytania, kibic, ja.token]);

  const e = stan.etap;
  if (kibic) return <Kibicowanie stan={stan} ja={ja} teraz={teraz} />;

  if (!wystartowala) {
    return (
      <div className="odliczanie" aria-live="polite">
        <span className="odliczanie-liczba">{Math.max(1, Math.ceil((od - teraz) / 1000))}</span>
        {/* zasady były przed chwilą na planszy etapu, więc tu samo odliczanie */}
        <span>Seria startuje!</span>
      </div>
    );
  }

  const zostalo = Math.max(0, do_ - teraz);
  const ulamekCzasu = e?.czas_s ? Math.min(1, zostalo / (e.czas_s * 1000)) : 0;
  const pasek = (
    <div className="gra-czas" aria-hidden>
      <div style={{ transform: `scaleX(${ulamekCzasu})` }} />
    </div>
  );

  if (!pytania) return <p className="pomocniczy">Ładuję pytania…</p>;
  const teraz_ = pytania.find((p) => !odpowiedziane.includes(p.id));
  const ktore = odpowiedziane.length + 1;
  // własne kroki w wyścigu (przewaga + dobre) z serii, którą widzi też TV
  const mojeKroki = krokiFinalu(stan.seria?.find((g) => g.nick === ja.nick) ?? { dobre: 0, start: 0 });

  // koniec pytań albo czasu: bez „Gotowe!”, który mignąłby zwycięzcy i zdradził koniec. Zwykle od razu
  // ciemny ekran werbli; w pijanym finale sam pasek, z którego płynnie wychodzi „pytanie 15/14”
  if (!teraz_ || zostalo <= 0) {
    return stan.pijany_final ? pasek : <Werble />;
  }

  async function odpowiedz(dane: DaneOdpowiedzi) {
    if (!teraz_ || wysylam || ocena) return;
    ustawWysylam(true);
    ustawBlad(null);
    const { data, error } = await supabase().rpc("zapisz_odpowiedz_serii", {
      p_token: ja.token,
      p_zadanie_id: teraz_.id,
      p_dane: dane,
    });
    ustawWysylam(false);
    if (error) {
      ustawBlad(`${komunikatBledu(error)}. Spróbuj jeszcze raz.`);
      return;
    }
    const wynik = data as ZapisOdpowiedzi;
    if (wynik.przyjeta && e?.finalowy && wynik.poprawna !== undefined && pytania) {
      const id = teraz_.id;
      const ms = czasOceny(mojeKroki);
      ustawOcena({ id, dane, dobrze: wynik.poprawna, ms });
      setTimeout(() => {
        ustawOdpowiedziane((l) => [...l, id]);
        ustawOcena(null);
      }, ms);
    } else if (wynik.przyjeta || wynik.powod === "juz_odpowiedziano") {
      ustawOdpowiedziane((l) => [...l, teraz_.id]);
    } else {
      ustawBlad(wynik.powod === "po_czasie" ? "Koniec czasu." : "Ta odpowiedź nie przeszła.");
    }
  }

  const z = jakoZadanie(teraz_);
  const oceniane = ocena?.id === z.id ? ocena : null;
  const wspolne = {
    z,
    // w czasie oceny wybrany przycisk zostaje podświetlony (`wybrana`), reszta przygasa
    wyslana: oceniane?.dane ?? null,
    zablokowane: wysylam || !!oceniane,
    onWyslij: (d: DaneOdpowiedzi) => void odpowiedz(d),
  };
  // tylko w finale: od połowy pytań utrudnienia (numer pytania w serii, nie liczba odpowiedzi gracza)
  const efekt = e?.finalowy ? utrudnienie(mojeKroki, ktore, z.typ) : null;

  return (
    <>
      <p className="etykieta gra-pasek">
        <span>
          {/* bez liczby wszystkich pytań: w finale tylko straszy, a pijany finał liczy dalej (pytanie 15…) */}
          Pytanie {ktore}
        </span>
        <span className="gra-kod">{Math.ceil(zostalo / 1000)} s</span>
      </p>
      {pasek}
      {oceniane && (
        <div
          className={`seria-blysk ${oceniane.dobrze ? "dobrze" : "zle"}`}
          style={{ "--ocena-ms": `${oceniane.ms}ms` } as React.CSSProperties}
          aria-hidden
        />
      )}
      <div
        key={z.id}
        className={
          [efekt ? `utrudnienie-${efekt}` : "", oceniane ? (oceniane.dobrze ? "ocena-dobrze" : "ocena-zle") : ""]
            .filter(Boolean)
            .join(" ") || undefined
        }
        style={oceniane ? ({ "--ocena-ms": `${oceniane.ms}ms` } as React.CSSProperties) : undefined}
      >
        {/* miejsce na trzy linie: przyciski stoją w jednym miejscu, czy pytanie ma jedną linię, czy dwie */}
        <h2 className="gra-pytanie seria-pytanie">{z.tresc}</h2>
        {z.grafika_url && <img src={z.grafika_url} alt="" className="gra-grafika" />}
        {z.typ === "prawda_falsz" ? (
          <OdpowiedzPrawdaFalsz key={z.id} {...wspolne} okragle />
        ) : z.typ === "szacowanie" ? (
          <OdpowiedzLiczba key={z.id} {...wspolne} />
        ) : z.typ === "wielokrotny" ? (
          <OdpowiedzWielokrotna key={z.id} {...wspolne} />
        ) : z.typ === "kolejnosc" ? (
          <OdpowiedzKolejnosc key={z.id} {...wspolne} />
        ) : z.typ === "pary" ? (
          <OdpowiedzPary key={z.id} {...wspolne} />
        ) : (
          <ol className="odp-lista" key={z.id}>
            {(z.dane.odpowiedzi ?? []).map((o, i) => (
              <li key={i}>
                <button
                  className={`odp${oceniane ? (oceniane.dane.odpowiedz === i ? " wybrana" : " przygaszona") : ""}`}
                  disabled={wysylam || !!oceniane}
                  onClick={() => void odpowiedz({ odpowiedz: i })}
                >
                  <span className="odp-litera">{LITERY[i]}</span>
                  <span className="odp-tekst">{o}</span>
                </button>
              </li>
            ))}
          </ol>
        )}
      </div>
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
    </>
  );
}
