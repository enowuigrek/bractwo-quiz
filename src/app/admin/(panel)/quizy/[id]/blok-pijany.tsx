"use client";

import { useState } from "react";
import type { PijanePytanie } from "@/lib/pijany";
import { FormularzPijany } from "../pijany-final/formularz";

/**
 * Pijany finał na liście etapów quizu (28.10): wygląda jak etap (nagłówek, zwijanie nazwą, pytania pod spodem), ale
 * w swoim kolorze i z przerywanym obrysem, bo tryb jest opcjonalny (włącza się go przy uruchamianiu gry). Pytania są
 * wspólne dla wszystkich quizów: „O piwie” po kolei, potem „Odklejone” losowo; zapis całej listy naraz.
 */
export function BlokPijany({ pytania }: { pytania: PijanePytanie[] }) {
  const [zwiniety, ustawZwiniety] = useState(false);
  const oPiwie = pytania.filter((p) => p.piwne).length;
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
              <span className="etap-nr">Pijany finał</span> Dogrywka
            </button>
          </h3>
          <p className="etap-znaczki">
            <span className="znaczek aktywny">opcjonalny</span>
            <span className="znaczek aktywny">wszystkie quizy</span>
            <span className="znaczek">o piwie {oPiwie}</span>
            <span className="znaczek">odklejone {pytania.length - oPiwie}</span>
          </p>
          <p className="lista-opis">
            Po finale, gdy przy uruchamianiu gry włączysz pijany finał. Pytania są wspólne: zmiany działają w każdym
            quizie.
          </p>
        </div>
      </div>
      {!zwiniety && <FormularzPijany pytania={pytania} />}
    </div>
  );
}
