"use client";

import { useActionState } from "react";
import type { StanFormularza } from "@/lib/typy";
import { zmienHaslo, zmienImie } from "./akcje";

function Komunikat({ stan }: { stan: StanFormularza }) {
  if (stan.blad) {
    return (
      <p className="blad" role="alert">
        {stan.blad}
      </p>
    );
  }
  return stan.ok ? (
    <p className="sukces" role="status">
      {stan.ok}
    </p>
  ) : null;
}

export function FormularzImienia({ nazwa }: { nazwa: string }) {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zmienImie, {});
  return (
    <form action={akcja} className="formularz">
      <div>
        <label htmlFor="nazwa">Imię</label>
        <input id="nazwa" name="nazwa" className="pole" defaultValue={nazwa} required maxLength={60} />
      </div>
      <Komunikat stan={stan} />
      <button type="submit" className="przycisk" disabled={trwa}>
        Zapisz
      </button>
    </form>
  );
}

export function FormularzZmianyHasla() {
  const [stan, akcja, trwa] = useActionState<StanFormularza, FormData>(zmienHaslo, {});
  return (
    <form action={akcja} className="formularz">
      <div>
        <label htmlFor="obecne">Obecne hasło</label>
        <input id="obecne" name="obecne" type="password" className="pole" autoComplete="current-password" required />
      </div>
      <div>
        <label htmlFor="haslo">Nowe hasło (co najmniej 8 znaków)</label>
        <input id="haslo" name="haslo" type="password" className="pole" autoComplete="new-password" required />
      </div>
      <div>
        <label htmlFor="haslo2">Nowe hasło jeszcze raz</label>
        <input id="haslo2" name="haslo2" type="password" className="pole" autoComplete="new-password" required />
      </div>
      <Komunikat stan={stan} />
      <button type="submit" className="przycisk" disabled={trwa}>
        Zmień hasło
      </button>
    </form>
  );
}
