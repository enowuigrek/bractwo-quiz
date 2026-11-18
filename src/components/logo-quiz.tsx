"use client";

import Image from "next/image";
import { LOGO_NEUTRALNE } from "@/lib/motyw";
import { useNeutralny } from "./motyw";

// Proporcje przyciętego viewBox w public/loga/bractwo.svg
const PROPORCJA = 3284 / 1990;

type Props = {
  /** Wysokość logo w px. Napis „Quiz” skaluje się razem z nim. */
  wysokosc?: number;
  /** Dopisek po „Quiz”, np. „panel”. */
  dopisek?: string;
  priorytet?: boolean;
};

/**
 * Logo Bractwa (zawsze białe, bez blasku) + złoty napis „Quiz”. W motywie neutralnym (src/lib/motyw.ts) logo motywu
 * albo sam napis.
 */
export function LogoQuiz({ wysokosc = 72, dopisek, priorytet }: Props) {
  const neutralny = useNeutralny();
  return (
    <span className="logo-quiz" style={{ fontSize: Math.round(wysokosc * 0.42) }}>
      {!neutralny ? (
        <Image
          src="/loga/bractwo.svg"
          alt="Bractwo Piwne"
          width={Math.round(wysokosc * PROPORCJA)}
          height={wysokosc}
          priority={priorytet}
          className="logo-bractwo"
        />
      ) : (
        LOGO_NEUTRALNE && (
          // eslint-disable-next-line @next/next/no-img-element -- logo motywu z public, dowolne proporcje
          <img src={LOGO_NEUTRALNE} alt="" className="logo-motywu" style={{ height: wysokosc, width: "auto" }} />
        )
      )}
      <span className="logo-quiz-napis">
        Quiz
        {dopisek && <span className="logo-quiz-dopisek"> · {dopisek}</span>}
      </span>
    </span>
  );
}
