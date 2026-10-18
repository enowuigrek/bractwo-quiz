"use client";

import { useActionState } from "react";
import { zalogujAdmina, type StanLogowania } from "../akcje";

export function FormularzLogowania() {
  const [stan, akcja, trwa] = useActionState<StanLogowania, FormData>(zalogujAdmina, {});

  return (
    <form action={akcja} className="karta" style={{ display: "grid", gap: "var(--card-pad)" }}>
      <label htmlFor="haslo" className="pomocniczy">
        Hasło obsługi
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
