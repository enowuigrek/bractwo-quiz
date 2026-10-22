import type { Metadata } from "next";
import { LogoQuiz } from "@/components/logo-quiz";
import { WpiszKod } from "../wpisz-kod";

export const metadata: Metadata = { title: "Ekran · Bractwo Quiz" };

/** `/ekran` bez adresu: wpisanie kodu gry na TV. Lokale mają swój stały adres ekranu (panel → Lokale). */
export default function Ekran() {
  return (
    <main className="kolumna">
      <h1 style={{ marginBottom: "var(--section-gap)" }}>
        <LogoQuiz wysokosc={80} dopisek="ekran" priorytet />
      </h1>
      <WpiszKod cel="/ekran/" przycisk="Pokaż grę na tym ekranie" />
      <p className="pomocniczy" style={{ marginTop: "var(--section-gap)" }}>
        Masz stały ekran lokalu? Otwórz jego adres z zakładek (znajdziesz go w panelu, w zakładce Lokale), a gra pojawi
        się sama, gdy prowadzący ją uruchomi.
      </p>
    </main>
  );
}
