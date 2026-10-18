"use client";

import { useActionState } from "react";
import type { Lokal, StanFormularza } from "@/lib/typy";
import { bezResetu } from "../_komponenty/bez-resetu";
import { PoleGrafiki } from "../_komponenty/grafika";
import { KomunikatFormularza } from "../_komponenty/stan";
import { zapiszLokal } from "./akcje";

type Props = {
  lokal?: Lokal;
  /** Miasta, które już są w bazie, do podpowiedzi. */
  miasta: string[];
};

export function FormularzLokalu({ lokal, miasta }: Props) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(
    zapiszLokal.bind(null, lokal?.id ?? null),
    {},
  );

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <div>
        <label htmlFor="nazwa">Nazwa lokalu</label>
        <input id="nazwa" name="nazwa" className="pole" defaultValue={lokal?.nazwa} required maxLength={80} />
      </div>
      <div>
        <label htmlFor="miasto">Miasto</label>
        <input
          id="miasto"
          name="miasto"
          className="pole"
          defaultValue={lokal?.miasto ?? (miasta.length === 1 ? miasta[0] : "")}
          list="miasta"
          required
          maxLength={60}
          autoComplete="off"
        />
        <datalist id="miasta">
          {miasta.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </div>
      <PoleGrafiki
        nazwa="logo"
        etykieta="Logo"
        obecna={lokal?.logo_url}
        podpowiedz="Najlepiej kwadrat z przezroczystym tłem, bo pokazujemy je na czarnym ekranie TV. PNG, JPG, WebP albo SVG, do 5 MB."
      />
      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Zapisuję…" : lokal ? "Zapisz zmiany" : "Dodaj lokal"}
      </button>
    </form>
  );
}
