"use client";

import { useState } from "react";
import { LIMITY_PIJANE, type PijanePytanie } from "@/lib/pijany";
import { FormularzPijany } from "../pijany-final/formularz";

/**
 * Wejście pijanego finału na liście etapów quizu (28.10): wygląda jak etap (nagłówek, zwijanie nazwą, pytania pod
 * spodem), ale w kolorze pijanego finału, bo jest opcjonalne. Pytania edytuje się w miejscu, jak pytania etapów;
 * zapis całej listy naraz (`zapiszPijanePytania`).
 */
export function WejsciePijanego({ quizId, pytania }: { quizId: string; pytania: PijanePytanie[] }) {
  const [zwiniety, ustawZwiniety] = useState(false);
  return (
    <div className="etap-blok etap-pijany">
      <div className={`etap-naglowek${zwiniety ? " zwiniety" : ""}`}>
        <div className="lista-glowna">
          <h3 className="etap-tytul">
            <button
              type="button"
              className="etap-zwin"
              aria-expanded={!zwiniety}
              onClick={() => ustawZwiniety((z) => !z)}
            >
              <span className="etap-nr">Pijany finał</span> Wejście
            </button>
          </h3>
          <p className="etap-znaczki">
            <span className="znaczek aktywny">opcjonalne</span>
            <span className="znaczek">po kolei</span>
            <span className={`znaczek${pytania.length ? " aktywny" : ""}`}>
              pytania {pytania.length} z {LIMITY_PIJANE.wejscie}
            </span>
          </p>
          <p className="lista-opis">
            Pierwsze pytania dogrywki, jeszcze na temat quizu, z każdym coraz dziwniej. Potem wspólna pula.
          </p>
        </div>
      </div>
      {!zwiniety && <FormularzPijany pytania={pytania} quizId={quizId} />}
    </div>
  );
}
