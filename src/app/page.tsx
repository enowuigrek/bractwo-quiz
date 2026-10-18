import { LogoQuiz } from "@/components/logo-quiz";

export default function Home() {
  return (
    <main className="kolumna">
      <h1 style={{ marginBottom: "var(--section-gap)" }}>
        <LogoQuiz wysokosc={96} priorytet />
      </h1>
      <p className="pomocniczy">Piwu Cześć! Wpisz kod z telewizora, żeby dołączyć.</p>
    </main>
  );
}
