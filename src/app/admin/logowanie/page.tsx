import type { Metadata } from "next";
import { LogoQuiz } from "@/components/logo-quiz";
import { FormularzLogowania } from "./formularz";

export const metadata: Metadata = { title: "Logowanie · Bractwo Quiz" };

/** Jedno logowanie dla wszystkich (konta osobowe, 30.10): twórca, Bractwo i lokale. */
export default function Logowanie() {
  return (
    <div className="logowanie-ekran">
      <main className="kolumna logowanie">
        <h1>
          <LogoQuiz wysokosc={72} dopisek="panel" priorytet />
        </h1>
        <FormularzLogowania />
      </main>
    </div>
  );
}
