"use client";

import { useState } from "react";
import { ZdjecieNagrody } from "@/app/admin/(panel)/gry/nowa/zdjecie-nagrody";
import { komunikatBledu } from "@/lib/gra/nasluch";
import type { PilotStan } from "@/lib/gra/typy";
import { supabase } from "@/lib/supabase/przegladarka";
import { IkonaPodium1, IkonaPodium3 } from "@/components/ikony";

type Pole = { nagroda: string; instrukcja: string; zdjecie: string | null };

const pustePole = (): Pole => ({ nagroda: "", instrukcja: "", zdjecie: null });

/**
 * Nagrody z pilota przed startem quizu (26.10, Łukasz: gra jest zapowiedziana wcześniej, a nagrody ustala się na
 * miejscu). Tak jak w kreatorze (te same elementy): przełącznik, potem 1. miejsce albo pierwsza trójka, każda z „jak
 * odebrać” i zdjęciem.
 * Zapis przez `ustaw_nagrody` (tylko w poczekalni); TV i telefony dostają je od razu.
 */
export function NagrodyPilota({
  stan,
  kod,
  token,
  onZmiana,
}: {
  stan: PilotStan;
  kod: string;
  token: string;
  onZmiana: (s: PilotStan) => void;
}) {
  const obecne = stan.nagrody ?? [];
  const [ile, ustawIle] = useState<0 | 1 | 3>(obecne.length === 3 ? 3 : obecne.length ? 1 : 0);
  const [pola, ustawPola] = useState<Pole[]>(() =>
    [1, 2, 3].map((m) => {
      const n = obecne.find((x) => x.miejsce === m);
      return n ? { nagroda: n.nagroda, instrukcja: n.instrukcja ?? "", zdjecie: n.zdjecie ?? null } : pustePole();
    }),
  );
  const [zapisuje, ustawZapisuje] = useState(false);
  const [komunikat, ustawKomunikat] = useState<{ ok: boolean; tekst: string } | null>(null);

  const zmien = (i: number, zmiany: Partial<Pole>) => {
    ustawPola((p) => p.map((x, k) => (k === i ? { ...x, ...zmiany } : x)));
    ustawKomunikat(null);
  };

  async function zapisz() {
    ustawZapisuje(true);
    ustawKomunikat(null);
    const nagrody = pola.slice(0, ile).map((p, i) => ({
      miejsce: i + 1,
      nagroda: p.nagroda,
      instrukcja: p.instrukcja || null,
      zdjecie: p.zdjecie,
    }));
    const { data, error } = await supabase().rpc("ustaw_nagrody", {
      p_kod: kod,
      p_host_token: token,
      p_nagrody: ile ? nagrody : null,
    });
    ustawZapisuje(false);
    if (error) return ustawKomunikat({ ok: false, tekst: komunikatBledu(error) });
    onZmiana(data as PilotStan);
    ustawKomunikat({ ok: true, tekst: ile ? "Nagrody zapisane. Widać je na telewizorze." : "Gra bez nagród." });
  }

  return (
    <div className="pilot-nagrody">
      {/* te same elementy co w kreatorze gry: przełącznik, kafelki z podium, pola nagród (26.10) */}
      <label className="przelacznik">
        <input
          type="checkbox"
          checked={ile > 0}
          onChange={(e) => {
            ustawIle(e.target.checked ? 1 : 0);
            ustawKomunikat(null);
          }}
        />{" "}
        z nagrodami
      </label>
      {ile > 0 && (
        <>
          <div className="kafelki kafelki-dwa">
            {(
              [
                [1, "1. miejsce", <IkonaPodium1 key="1" />],
                [3, "pierwsza trójka", <IkonaPodium3 key="3" />],
              ] as const
            ).map(([n, napis, ikona]) => (
              <button
                key={n}
                type="button"
                className={`kafelek${ile === n ? " wybrany" : ""}`}
                aria-pressed={ile === n}
                onClick={() => {
                  ustawIle(n);
                  ustawKomunikat(null);
                }}
              >
                <span className="kafelek-ikona duza">{ikona}</span>
                <span className="kafelek-opis">{napis}</span>
              </button>
            ))}
          </div>
          <div className="nagrody-pola">
            {pola.slice(0, ile).map((p, i) => (
              <div key={i} className="nagroda-pole">
                <span className="krok-nr">{i + 1}.</span>
                <div>
                  <input
                    className="pole"
                    value={p.nagroda}
                    onChange={(e) => zmien(i, { nagroda: e.target.value })}
                    placeholder={i === 0 ? "np. Lane Piwo gratis" : "Nagroda"}
                    aria-label={`Nagroda za ${i + 1}. miejsce`}
                    maxLength={80}
                  />
                  <input
                    className="pole pole-male"
                    value={p.instrukcja}
                    onChange={(e) => zmien(i, { instrukcja: e.target.value })}
                    placeholder="Jak odebrać, np. przy barze"
                    aria-label={`Jak odebrać nagrodę za ${i + 1}. miejsce`}
                    maxLength={160}
                  />
                  <ZdjecieNagrody
                    miejsce={i + 1}
                    poczatkowe={p.zdjecie}
                    pilot={{ kod, token }}
                    onZmiana={(url) => zmien(i, { zdjecie: url })}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      {komunikat && (
        <p className={komunikat.ok ? "sukces" : "blad"} role={komunikat.ok ? "status" : "alert"} style={{ margin: 0 }}>
          {komunikat.tekst}
        </p>
      )}
      <button
        type="button"
        className="przycisk zloty"
        disabled={zapisuje || pola.slice(0, ile).some((p) => !p.nagroda.trim())}
        onClick={() => void zapisz()}
      >
        {zapisuje ? "Zapisuję…" : "Zapisz nagrody"}
      </button>
    </div>
  );
}
