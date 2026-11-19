"use client";

import Image from "next/image";
import { useMarka } from "./motyw";

type Props = {
  /** Wysokość logo w px. Napis „Quiz” skaluje się razem z nim. */
  wysokosc?: number;
  /** Dopisek po „Quiz”, np. „panel”. */
  dopisek?: string;
  priorytet?: boolean;
};

/**
 * Logo marki + napis „Quiz” w kolorze akcentu. Logo Bractwa (zawsze białe, bez blasku) o stałych proporcjach idzie
 * przez next/image, logo o dowolnych proporcjach (JOWES) zwykłym obrazkiem.
 */
export function LogoQuiz({ wysokosc = 72, dopisek, priorytet }: Props) {
  const { logo } = useMarka();
  return (
    // szerokie logo (JOWES): przy dużym logo napis „Quiz” stoi pod nim
    <span
      className={`logo-quiz${logo.szerokie && wysokosc >= 60 ? " logo-quiz-pod" : ""}`}
      style={{ fontSize: Math.round(wysokosc * 0.42) }}
    >
      {logo.proporcja ? (
        <Image
          src={logo.plik}
          alt={logo.alt}
          width={Math.round(wysokosc * logo.proporcja)}
          height={wysokosc}
          priority={priorytet}
          className={logo.klasa}
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- logo marki z public, dowolne proporcje
        <img src={logo.plik} alt={logo.alt} className={logo.klasa} style={{ height: wysokosc, width: "auto" }} />
      )}
      <span className="logo-quiz-napis">
        Quiz
        {dopisek && <span className="logo-quiz-dopisek"> · {dopisek}</span>}
      </span>
    </span>
  );
}
