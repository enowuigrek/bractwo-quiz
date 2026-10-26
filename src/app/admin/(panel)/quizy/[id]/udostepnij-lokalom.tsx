"use client";

import { useTransition } from "react";
import { ustawWidocznoscQuizu } from "../akcje";

/** Przełącznik przy quizie Bractwa: lokale widzą go i mogą nim grać (bez zmian). Tylko u głównego. */
export function UdostepnijLokalom({ quizId, udostepniony }: { quizId: string; udostepniony: boolean }) {
  const [trwa, start] = useTransition();
  return (
    <label className="przelacznik">
      <input
        type="checkbox"
        checked={udostepniony}
        disabled={trwa}
        onChange={(e) => {
          const wlacz = e.target.checked;
          start(() => ustawWidocznoscQuizu(quizId, !wlacz));
        }}
      />{" "}
      udostępnij lokalom
    </label>
  );
}
