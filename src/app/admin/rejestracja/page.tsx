import type { Metadata } from "next";
import { LogoQuiz } from "@/components/logo-quiz";
import { FormularzRejestracji } from "../logowanie/formularz";

export const metadata: Metadata = { title: "Nowe konto · Bractwo Quiz" };

/** Zakładanie konta osobowego: bez ról, aż Łukasz nada dostęp na stronie „Konta”. */
export default function Rejestracja() {
  return (
    <div className="logowanie-ekran">
      <main className="kolumna logowanie">
        <h1>
          <LogoQuiz wysokosc={72} dopisek="panel" priorytet />
        </h1>
        <FormularzRejestracji />
      </main>
    </div>
  );
}
