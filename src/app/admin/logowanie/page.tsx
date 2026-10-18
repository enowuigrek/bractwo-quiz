import type { Metadata } from "next";
import { LogoQuiz } from "@/components/logo-quiz";
import { FormularzLogowania } from "./formularz";

export const metadata: Metadata = { title: "Logowanie · Bractwo Quiz" };

export default function Logowanie() {
  return (
    <main className="kolumna">
      <h1 style={{ marginBottom: "var(--section-gap)" }}>
        <LogoQuiz wysokosc={72} dopisek="panel" priorytet />
      </h1>
      <FormularzLogowania />
    </main>
  );
}
