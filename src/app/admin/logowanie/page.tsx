import type { Metadata } from "next";
import { FormularzLogowania } from "./formularz";

export const metadata: Metadata = { title: "Logowanie · Bractwo Quiz" };

export default function Logowanie() {
  return (
    <main className="kolumna">
      <h1>Panel quizu</h1>
      <FormularzLogowania />
    </main>
  );
}
