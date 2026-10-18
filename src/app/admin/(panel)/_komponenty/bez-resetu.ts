import { startTransition, type FormEvent } from "react";

/**
 * Propsy `<form>` dla formularzy z `useActionState`. React po `<form action>` czyści pola,
 * także gdy serwer zwróci błąd. Po hydratacji `onSubmit` wysyła sam i nie czyści pól.
 * `action` zostaje, żeby wysyłka przed hydratacją poszła do kolejki Reacta, a nie GET-em.
 */
export function bezResetu(akcja: (dane: FormData) => void) {
  return {
    action: akcja,
    onSubmit(e: FormEvent<HTMLFormElement>) {
      e.preventDefault();
      const dane = new FormData(e.currentTarget);
      startTransition(() => akcja(dane));
    },
  };
}
