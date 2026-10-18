"use client";

import { useFormStatus } from "react-dom";

type Props = {
  akcja: () => Promise<void>;
  pytanie: string;
  children: React.ReactNode;
  className?: string;
  tytul?: string;
};

function Przycisk({ children, className, tytul }: Pick<Props, "children" | "className" | "tytul">) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className ?? "przycisk-maly niebezpieczny"} disabled={pending} title={tytul} aria-label={tytul}>
      {children}
    </button>
  );
}

/** Przycisk akcji nieodwracalnej (usuń, zakończ) z pytaniem o potwierdzenie. */
export function PrzyciskPotwierdz({ akcja, pytanie, children, className, tytul }: Props) {
  return (
    <form
      action={akcja}
      onSubmit={(e) => {
        if (!confirm(pytanie)) e.preventDefault();
      }}
    >
      <Przycisk className={className} tytul={tytul}>
        {children}
      </Przycisk>
    </form>
  );
}
