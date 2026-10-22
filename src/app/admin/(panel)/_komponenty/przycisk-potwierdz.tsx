"use client";

import { useRef } from "react";
import { useFormStatus } from "react-dom";
import { Okno } from "@/components/okno";

type Props = {
  akcja: () => Promise<void>;
  pytanie: string;
  children: React.ReactNode;
  className?: string;
  /** Podpis przycisku z samą ikoną (dymek po najechaniu i etykieta dla czytników). */
  tytul?: string;
  /** Napis przycisku potwierdzenia w oknie. */
  tak?: string;
};

function Wyzwalacz({ children, className, tytul, onClick }: Pick<Props, "children" | "className" | "tytul"> & { onClick: () => void }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="button"
      className={className ?? "przycisk-maly niebezpieczny"}
      disabled={pending}
      aria-label={tytul}
      data-podpis={tytul}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

/** Przycisk akcji nieodwracalnej (usuń, zakończ). Najpierw pyta w oknie, potem wysyła formularz. */
export function PrzyciskPotwierdz({ akcja, pytanie, children, className, tytul, tak = "Usuń" }: Props) {
  const okno = useRef<HTMLDialogElement>(null);
  return (
    <form action={akcja} onSubmit={() => okno.current?.close()}>
      <Wyzwalacz className={className} tytul={tytul} onClick={() => okno.current?.showModal()}>
        {children}
      </Wyzwalacz>
      <Okno ref={okno} pytanie={pytanie} onNie={() => okno.current?.close()}>
        <button type="submit" className="przycisk niebezpieczny">
          {tak}
        </button>
      </Okno>
    </form>
  );
}
