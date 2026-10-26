"use client";

import { useActionState } from "react";
import type { StanFormularza } from "@/lib/typy";
import { KomunikatFormularza } from "../_komponenty/stan";
import { zmienHasloLokalu } from "./akcje";

/** Nowe hasło panelu lokalu (dwa razy, żeby nie zapisać literówki). */
export function FormularzHasla({ lokalId, ma }: { lokalId: string; ma: boolean }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zmienHasloLokalu.bind(null, lokalId), {});
  return (
    <form action={akcja} className="formularz">
      <div>
        <label htmlFor="haslo">{ma ? "Nowe hasło" : "Hasło"}</label>
        <input
          id="haslo"
          name="haslo"
          type="password"
          className="pole"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <div>
        <label htmlFor="haslo2">Powtórz hasło</label>
        <input
          id="haslo2"
          name="haslo2"
          type="password"
          className="pole"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </div>
      <KomunikatFormularza stan={stan} />
      <button type="submit" className="przycisk" disabled={trwa}>
        {trwa ? "Zapisuję…" : ma ? "Zmień hasło" : "Ustaw hasło"}
      </button>
    </form>
  );
}
