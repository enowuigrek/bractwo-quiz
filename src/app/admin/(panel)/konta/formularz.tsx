"use client";
/* eslint-disable @next/next/no-img-element -- loga lokali z bucketu Supabase */

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { LinkDoSkopiowania } from "../gry/[id]/kopiuj";
import { wygenerujLink, zapiszKonto, type StanKonta } from "./akcje";

export type KontoDoEdycji = {
  id: string;
  nazwa: string;
  email: string;
  role: { rola: "tworca" | "bractwo" | "lokal"; lokal_id: string | null }[];
};
export type LokalDoWyboru = { id: string; nazwa: string; logo_url: string | null; testowy: boolean };

/** Imię, e-mail i dostęp (role). Nowe konto: po zapisie link do ustawienia hasła. */
export function FormularzKonta({
  konto = null,
  lokale,
  lokalNaStart = null,
}: {
  konto?: KontoDoEdycji | null;
  lokale: LokalDoWyboru[];
  /** „+ Dodaj osobę” ze strony lokalu: ten lokal od razu zaznaczony */
  lokalNaStart?: string | null;
}) {
  const [stan, akcja, trwa] = useActionState<StanKonta, FormData>(zapiszKonto.bind(null, konto?.id ?? null), {});
  const ma = (rola: string, lokal: string | null = null) =>
    konto ? konto.role.some((r) => r.rola === rola && r.lokal_id === lokal) : rola === "lokal" && lokal === lokalNaStart;

  if (!konto && stan.link) {
    return (
      <div className="stos">
        <p className="sukces" role="status">
          {stan.ok}
        </p>
        <p className="etykieta">Link do ustawienia hasła (7 dni)</p>
        <LinkDoSkopiowania url={stan.link} />
        <div className="przyciski">
          <Link href={`/admin/konta/${stan.id}`} className="przycisk">
            Konto
          </Link>
          <Link href="/admin/konta" className="przycisk">
            Wszystkie konta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={akcja} className="formularz">
      <div>
        <label htmlFor="nazwa">Imię</label>
        <input id="nazwa" name="nazwa" className="pole" defaultValue={konto?.nazwa} required maxLength={60} />
      </div>
      <div>
        <label htmlFor="email">E-mail</label>
        <input id="email" name="email" type="email" className="pole" defaultValue={konto?.email} required maxLength={200} />
      </div>
      <fieldset className="konto-role">
        <legend>Dostęp</legend>
        <label className="przelacznik">
          <input type="checkbox" name="rola" value="bractwo" defaultChecked={ma("bractwo")} /> Bractwo Piwne
        </label>
        {lokale.map((l) => (
          <label key={l.id} className="przelacznik">
            <input type="checkbox" name="lokal" value={l.id} defaultChecked={ma("lokal", l.id)} />
            {l.logo_url && <img src={l.logo_url} alt="" className="konto-role-logo" />}
            {l.nazwa}
            {l.testowy ? " (testowy)" : ""}
          </label>
        ))}
        <label className="przelacznik">
          <input type="checkbox" name="rola" value="tworca" defaultChecked={ma("tworca")} /> Twórca
        </label>
      </fieldset>
      {stan.blad && (
        <p className="blad" role="alert">
          {stan.blad}
        </p>
      )}
      {stan.ok && (
        <p className="sukces" role="status">
          {stan.ok}
        </p>
      )}
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Zapisuję…" : konto ? "Zapisz" : "Załóż konto"}
      </button>
    </form>
  );
}

/** Nowy link do ustawienia hasła: pierwsze hasło albo reset; poprzedni link przestaje działać. */
export function NowyLink({ kontoId }: { kontoId: string }) {
  const [stan, ustawStan] = useState<StanKonta>({});
  const [trwa, start] = useTransition();
  return (
    <div className="stos">
      <button
        type="button"
        className="przycisk-maly"
        disabled={trwa}
        onClick={() => start(async () => ustawStan(await wygenerujLink(kontoId)))}
      >
        {trwa ? "Tworzę…" : "Nowy link do hasła"}
      </button>
      {stan.link && <LinkDoSkopiowania url={stan.link} />}
      {stan.blad && (
        <p className="blad" role="alert">
          {stan.blad}
        </p>
      )}
    </div>
  );
}
