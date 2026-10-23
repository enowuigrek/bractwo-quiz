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
      // z klikniętym przyciskiem (name/value), gdy formularz ma kilka przycisków wysyłki
      const dane = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
      startTransition(() => akcja(dane));
    },
  };
}
