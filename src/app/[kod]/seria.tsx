"use client";
/* eslint-disable @next/next/no-img-element -- grafiki pytań z bucketu Supabase */

import { useEffect, useState } from "react";
import { komunikatBledu } from "@/lib/gra/nasluch";
import type { PytanieSerii, StanSesji, ZapisOdpowiedzi, ZadanieWidoczne } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { LITERY, PODPOWIEDZI_TYPOW, type DaneOdpowiedzi } from "@/lib/zadania";
import {
  OdpowiedzKolejnosc,
  OdpowiedzLiczba,
  OdpowiedzPary,
  OdpowiedzPrawdaFalsz,
  OdpowiedzWielokrotna,
} from "./odpowiadanie";
import { czyKibic, type Ja } from "./rozgrywka";

/** Pytanie serii w kształcie, którego oczekują komponenty odpowiadania. */
function jakoZadanie(p: PytanieSerii): ZadanieWidoczne {
  return { ...p, lp: 0, czas_s: null, podpowiedzi: [], liczba_podpowiedzi: 0, podpowiedzi_co_s: null };
}

/**
 * Telefon w serii (faza `seria`): pytania etapu jedno po drugim we własnym tempie. Po odpowiedzi od razu
 * następne, bez wyniku (wynik i ranking po całej serii). Kibice w finale tylko patrzą na TV.
 */
export function SeriaGracza({ stan, ja, teraz }: { stan: StanSesji; ja: Ja; teraz: number }) {
  const [pytania, ustawPytania] = useState<PytanieSerii[] | null>(null);
  const [odpowiedziane, ustawOdpowiedziane] = useState<string[]>([]);
  const [wysylam, ustawWysylam] = useState(false);
  const [blad, ustawBlad] = useState<string | null>(null);
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
  if (kibic) {
    return (
      <>
        <p className="etykieta gra-pasek">
          <span>{e?.nazwa ?? "Seria"}</span>
        </p>
        <p className="gra-kibic">
          Finał! Odpowiadają {stan.finalisci?.map((f) => f.nick).join(", ")}. Patrz na telewizor, kto pierwszy dojdzie
          do piwa, i kibicuj!
        </p>
      </>
    );
  }

  if (!wystartowala) {
    return (
      <div className="odliczanie" aria-live="polite">
        <span className="odliczanie-liczba">{Math.max(1, Math.ceil((od - teraz) / 1000))}</span>
        <span>Seria startuje!</span>
        <span className="odliczanie-typ">
          {e?.liczba_pytan ?? ""} pytań, {e?.czas_s ?? 60} s na wszystkie. Odpowiadaj szybko: każda dobra odpowiedź to
          krok do piwa.
        </span>
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

  if (!teraz_ || zostalo <= 0) {
    return (
      <>
        {pasek}
        <div className="werdykt czesciowo">
          <span className="werdykt-tytul">{teraz_ ? "Koniec czasu!" : "Gotowe!"}</span>
          <span className="pomocniczy">
            Odpowiedziano na {odpowiedziane.length} z {pytania.length}. Wynik po całej serii, patrz na telewizor.
          </span>
        </div>
      </>
    );
  }

  async function odpowiedz(dane: DaneOdpowiedzi) {
    if (!teraz_ || wysylam) return;
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
    if (wynik.przyjeta || wynik.powod === "juz_odpowiedziano") {
      ustawOdpowiedziane((l) => [...l, teraz_.id]);
    } else {
      ustawBlad(wynik.powod === "po_czasie" ? "Koniec czasu." : "Ta odpowiedź nie przeszła.");
    }
  }

  const z = jakoZadanie(teraz_);
  const wspolne = { z, wyslana: null, zablokowane: wysylam, onWyslij: (d: DaneOdpowiedzi) => void odpowiedz(d) };

  return (
    <>
      <p className="etykieta gra-pasek">
        <span>
          Seria · pytanie {ktore}/{pytania.length}
        </span>
        <span className="gra-kod">{Math.ceil(zostalo / 1000)} s</span>
      </p>
      {pasek}
      <h2 className="gra-pytanie">{z.tresc}</h2>
      {z.grafika_url && <img src={z.grafika_url} alt="" className="gra-grafika" />}
      {z.typ !== "wybor" && <p className="gra-podpowiedz">{PODPOWIEDZI_TYPOW[z.typ]}</p>}
      {z.typ === "prawda_falsz" ? (
        <OdpowiedzPrawdaFalsz key={z.id} {...wspolne} />
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
              <button className="odp" disabled={wysylam} onClick={() => void odpowiedz({ odpowiedz: i })}>
                <span className="odp-litera">{LITERY[i]}</span>
                <span className="odp-tekst">{o}</span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {blad && (
        <p className="blad" role="alert">
          {blad}
        </p>
      )}
    </>
  );
}
