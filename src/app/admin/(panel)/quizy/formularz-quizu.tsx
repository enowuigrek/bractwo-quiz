"use client";

import { useActionState } from "react";
import type { Quiz, StanFormularza } from "@/lib/typy";
import { bezResetu } from "../_komponenty/bez-resetu";
import { KomunikatFormularza } from "../_komponenty/stan";
import { utworzQuiz, zapiszQuiz } from "./akcje";
import { LIMITY } from "./limity";

export function FormularzQuizu({ quiz }: { quiz?: Quiz }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(
    quiz ? zapiszQuiz.bind(null, quiz.id) : utworzQuiz,
    {},
  );

  return (
    <form {...bezResetu(akcja)} className="formularz">
      <div>
        <label htmlFor="tytul">Tytuł</label>
        <input
          id="tytul"
          name="tytul"
          className="pole"
          defaultValue={quiz?.tytul}
          placeholder="np. Portery i stouty"
          required
          maxLength={LIMITY.tytul}
        />
      </div>
      <div>
        <label htmlFor="opis">Opis (tylko dla obsługi)</label>
        <textarea id="opis" name="opis" className="pole" defaultValue={quiz?.opis ?? ""} maxLength={LIMITY.opis} rows={2} />
      </div>
      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Zapisuję…" : quiz ? "Zapisz" : "Utwórz quiz"}
      </button>
    </form>
  );
}
