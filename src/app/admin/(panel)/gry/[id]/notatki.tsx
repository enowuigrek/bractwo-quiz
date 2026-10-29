"use client";

import { useActionState } from "react";
import type { StanFormularza } from "@/lib/typy";
import { KomunikatFormularza } from "../../_komponenty/stan";
import { bezResetu } from "../../_komponenty/bez-resetu";
import { zapiszNotatke } from "../akcje";

/** Notatki do gry (29.10): widzi je tylko panel (główny i lokal gry), nie gracze ani lokal-gość. */
export function Notatki({ graId, notatka }: { graId: string; notatka: string | null }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zapiszNotatke.bind(null, graId), {});
  return (
    <form {...bezResetu(akcja)} className="formularz notatki-gry">
      <textarea
        name="notatka"
        className="pole"
        aria-label="Notatki"
        defaultValue={notatka ?? ""}
        maxLength={5000}
        rows={5}
      />
      <div className="notatki-stopka">
        <button type="submit" className="przycisk-maly" disabled={trwa}>
          {trwa ? "Zapisuję…" : "Zapisz notatki"}
        </button>
        <KomunikatFormularza stan={stan} />
      </div>
    </form>
  );
}
