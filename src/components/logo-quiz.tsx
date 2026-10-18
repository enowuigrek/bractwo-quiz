import Image from "next/image";

// Proporcje przyciętego viewBox w public/loga/bractwo.svg
const PROPORCJA = 3284 / 1990;

type Props = {
  /** Wysokość logo w px. Napis „Quiz” skaluje się razem z nim. */
  wysokosc?: number;
  /** Dopisek po „Quiz”, np. „panel”. */
  dopisek?: string;
  priorytet?: boolean;
};

/** Logo Bractwa (zawsze białe, bez blasku) + złoty napis „Quiz”. */
export function LogoQuiz({ wysokosc = 72, dopisek, priorytet }: Props) {
  return (
    <span className="logo-quiz" style={{ fontSize: Math.round(wysokosc * 0.42) }}>
      <Image
        src="/loga/bractwo.svg"
        alt="Bractwo Piwne"
        width={Math.round(wysokosc * PROPORCJA)}
        height={wysokosc}
        priority={priorytet}
        className="logo-bractwo"
      />
      <span className="logo-quiz-napis">
        Quiz
        {dopisek && <span className="logo-quiz-dopisek"> · {dopisek}</span>}
      </span>
    </span>
  );
}
