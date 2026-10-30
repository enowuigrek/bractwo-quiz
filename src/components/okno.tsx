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
 * Fokus dostaje samo okno, a nie „Anuluj” (`fokusNaOknie`; atrybut `autofocus` Chromium przy `showModal` pomija): Enter niczego nie usuwa, a przeglądarka nie
 * rysuje złotej obwódki fokusu na przycisku po kliknięciu myszą (30.10, Łukasz). Tabem dalej przechodzi się po
 * przyciskach z obwódką.
 */
/**
 * Po otwarciu okna (`showModal`) przeglądarka daje fokus pierwszemu przyciskowi, a Safari rysuje na nim złotą obwódkę
 * także po kliknięciu myszą (30.10). Pierwszy fokus po otwarciu przejmuje więc samo okno; Enter niczego nie klika,
 * Esc zamyka, a Tab przechodzi po przyciskach z obwódką. Po zamknięciu znacznik się zeruje.
 */
export const fokusNaOknie = {
  onFocus: (e: React.FocusEvent<HTMLDialogElement>) => {
    const okno = e.currentTarget;
    if (okno.dataset.fokus) return;
    okno.dataset.fokus = "1";
    if (e.target !== okno) okno.focus();
  },
  onClose: (e: React.SyntheticEvent<HTMLDialogElement>) => {
    delete e.currentTarget.dataset.fokus;
  },
};

export function Okno({ ref, pytanie, nie = "Anuluj", onNie, children }: PropsOkna) {
  return (
    <dialog
      ref={ref}
      className="okno"
      tabIndex={-1}
      {...fokusNaOknie}
      onCancel={onNie}
      onClick={(e) => {
        if (e.target === e.currentTarget) onNie();
      }}
    >
      <div className="okno-tresc">
        <p className="okno-pytanie">{pytanie}</p>
        <div className="okno-przyciski">
          <button type="button" className="przycisk" onClick={onNie}>
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
