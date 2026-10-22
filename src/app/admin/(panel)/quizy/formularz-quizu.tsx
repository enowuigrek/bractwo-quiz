"use client";

import { useActionState } from "react";
import type { StanFormularza } from "@/lib/typy";
import { bezResetu } from "../_komponenty/bez-resetu";
import { KomunikatFormularza } from "../_komponenty/stan";
import { utworzQuiz } from "./akcje";
import { LIMITY } from "./limity";

/** Nowy quiz: tytuł i opis. Po utworzeniu przechodzi do edycji pytań. */
export function FormularzQuizu() {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(utworzQuiz, {});

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <div>
        <label htmlFor="tytul">Tytuł</label>
        <input
          id="tytul"
          name="tytul"
          className="pole"
          placeholder="np. Portery i stouty"
          required
          maxLength={LIMITY.tytul}
          autoFocus
        />
      </div>
      <div>
        <label htmlFor="opis">Opis (tylko dla obsługi)</label>
        <textarea id="opis" name="opis" className="pole" maxLength={LIMITY.opis} rows={2} />
      </div>
      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Tworzę…" : "Utwórz quiz i dodaj pytania"}
      </button>
    </form>
  );
}
