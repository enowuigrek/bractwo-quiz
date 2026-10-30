"use client";

import Link from "next/link";
import { useActionState } from "react";
import { ustawHasloZLinku, zalogujAdmina, zalozKonto, type StanLogowania } from "../akcje";

/** Pole z podpisem nad nim (logowanie, zakładanie konta, hasło z linku). */
function Pole({
  nazwa,
  podpis,
  typ = "text",
  autocomplete,
  autoFocus = false,
}: {
  nazwa: string;
  podpis: string;
  typ?: string;
  autocomplete: string;
  autoFocus?: boolean;
}) {
  return (
    <div className="pole-z-podpisem">
      <label htmlFor={nazwa} className="pomocniczy">
        {podpis}
      </label>
      <input
        id={nazwa}
        name={nazwa}
        type={typ}
        className="pole"
        autoComplete={autocomplete}
        required
        autoFocus={autoFocus}
        maxLength={200}
      />
    </div>
  );
}

function Komunikat({ stan }: { stan: StanLogowania }) {
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

/** Logowanie e-mailem i hasłem (konta osobowe, 30.10). */
export function FormularzLogowania() {
  const [stan, akcja, trwa] = useActionState<StanLogowania, FormData>(zalogujAdmina, {});
  return (
    <>
      <form action={akcja} className="formularz-logowania">
        <Pole nazwa="email" podpis="E-mail" typ="email" autocomplete="username" autoFocus />
        <Pole nazwa="haslo" podpis="Hasło" typ="password" autocomplete="current-password" />
        <Komunikat stan={stan} />
        <button type="submit" className="przycisk zloty" disabled={trwa}>
          {trwa ? "Sprawdzam…" : "Wejdź"}
        </button>
      </form>
      <Link href="/admin/rejestracja" className="przycisk logowanie-dalej">
        Załóż konto
      </Link>
    </>
  );
}

/** Zakładanie konta: konto czeka bez ról, aż Łukasz nada dostęp. */
export function FormularzRejestracji() {
  const [stan, akcja, trwa] = useActionState<StanLogowania, FormData>(zalozKonto, {});
  if (stan.ok) {
    return (
      <>
        <Komunikat stan={stan} />
        <Link href="/admin/logowanie" className="przycisk logowanie-dalej">
          Logowanie
        </Link>
      </>
    );
  }
  return (
    <>
      <form action={akcja} className="formularz-logowania">
        <Pole nazwa="nazwa" podpis="Imię" autocomplete="given-name" autoFocus />
        <Pole nazwa="email" podpis="E-mail" typ="email" autocomplete="email" />
        <Pole nazwa="haslo" podpis="Hasło (co najmniej 8 znaków)" typ="password" autocomplete="new-password" />
        <Pole nazwa="haslo2" podpis="Hasło jeszcze raz" typ="password" autocomplete="new-password" />
        <Komunikat stan={stan} />
        <button type="submit" className="przycisk zloty" disabled={trwa}>
          {trwa ? "Zakładam…" : "Załóż konto"}
        </button>
      </form>
      <Link href="/admin/logowanie" className="przycisk logowanie-dalej">
        Mam konto
      </Link>
    </>
  );
}

/** Hasło z jednorazowego linku (nowe konto albo reset). */
export function FormularzHaslaZLinku({ token }: { token: string }) {
  const [stan, akcja, trwa] = useActionState<StanLogowania, FormData>(ustawHasloZLinku.bind(null, token), {});
  if (stan.ok) return <Komunikat stan={stan} />;
  return (
    <form action={akcja} className="formularz-logowania">
      <Pole nazwa="haslo" podpis="Nowe hasło (co najmniej 8 znaków)" typ="password" autocomplete="new-password" autoFocus />
      <Pole nazwa="haslo2" podpis="Hasło jeszcze raz" typ="password" autocomplete="new-password" />
      <Komunikat stan={stan} />
      <button type="submit" className="przycisk zloty" disabled={trwa}>
        {trwa ? "Zapisuję…" : "Ustaw hasło"}
      </button>
    </form>
  );
}
