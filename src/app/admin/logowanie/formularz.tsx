"use client";

import { useActionState } from "react";
import { zalogujAdmina, type StanLogowania } from "../akcje";

type Props = {
  /** Logowanie lokalu (`zalogujLokal` z jego id); bez tego hasło główne. */
  akcja?: (stan: StanLogowania, dane: FormData) => Promise<StanLogowania>;
  etykieta?: string;
};

export function FormularzLogowania({ akcja: akcjaLogowania = zalogujAdmina, etykieta = "Hasło" }: Props) {
  const [stan, akcja, trwa] = useActionState<StanLogowania, FormData>(akcjaLogowania, {});

  return (
    <form action={akcja} style={{ display: "grid", gap: "var(--card-pad)" }}>
      <label htmlFor="haslo" className="pomocniczy">
        {etykieta}
      </label>
      <input
        id="haslo"
        name="haslo"
        type="password"
        className="pole"
        autoComplete="current-password"
        required
        autoFocus
      />
      {stan.blad && (
        <p className="blad" role="alert" style={{ margin: 0 }}>
          {stan.blad}
        </p>
      )}
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Sprawdzam…" : "Wejdź"}
      </button>
    </form>
  );
}
