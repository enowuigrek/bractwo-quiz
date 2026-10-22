"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode, type Ref } from "react";

type PropsOkna = {
  ref: Ref<HTMLDialogElement>;
  pytanie: ReactNode;
  /** Napis przycisku rezygnacji. */
  nie?: string;
  onNie: () => void;
  /** Przycisk potwierdzenia (submit w formularzu albo zwykły przycisk). */
  children: ReactNode;
};

/**
 * Okno potwierdzenia w stylu aplikacji, zamiast `window.confirm`. Natywny `<dialog>`:
 * wyśrodkowany, z przyciemnionym tłem, Esc i kliknięcie obok zamykają bez akcji.
 * Domyślnie zaznaczony jest przycisk rezygnacji, żeby Enter niczego nie usunął.
 */
export function Okno({ ref, pytanie, nie = "Anuluj", onNie, children }: PropsOkna) {
  return (
    <dialog
      ref={ref}
      className="okno"
      onCancel={onNie}
      onClick={(e) => {
        if (e.target === e.currentTarget) onNie();
      }}
    >
      <div className="okno-tresc">
        <p className="okno-pytanie">{pytanie}</p>
        <div className="okno-przyciski">
          <button type="button" className="przycisk" onClick={onNie} autoFocus>
            {nie}
          </button>
          {children}
        </div>
      </div>
    </dialog>
  );
}

export type OpcjePotwierdzenia = { tak?: string; nie?: string; niebezpieczne?: boolean };

/**
 * `const [potwierdz, okno] = usePotwierdzenie()`; `okno` wstawiamy do JSX,
 * a `await potwierdz("Na pewno?")` zwraca `true` po kliknięciu „tak”.
 */
export function usePotwierdzenie() {
  const ref = useRef<HTMLDialogElement>(null);
  const [pytanie, ustawPytanie] = useState<{
    tekst: string;
    opcje: OpcjePotwierdzenia;
    rozwiaz: (tak: boolean) => void;
  } | null>(null);

  const potwierdz = useCallback(
    (tekst: string, opcje: OpcjePotwierdzenia = {}) =>
      new Promise<boolean>((rozwiaz) => ustawPytanie({ tekst, opcje, rozwiaz })),
    [],
  );

  useEffect(() => {
    if (pytanie && !ref.current?.open) ref.current?.showModal();
  }, [pytanie]);

  function zamknij(tak: boolean) {
    ref.current?.close();
    pytanie?.rozwiaz(tak);
    ustawPytanie(null);
  }

  const okno = (
    <Okno ref={ref} pytanie={pytanie?.tekst} nie={pytanie?.opcje.nie} onNie={() => zamknij(false)}>
      <button
        type="button"
        className={`przycisk ${pytanie?.opcje.niebezpieczne ? "niebezpieczny" : "zloty"}`}
        onClick={() => zamknij(true)}
      >
        {pytanie?.opcje.tak ?? "Tak"}
      </button>
    </Okno>
  );

  return [potwierdz, okno] as const;
}
