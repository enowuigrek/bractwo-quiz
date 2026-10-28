"use client";

import { useState } from "react";
import { LIMITY_PIJANE, type PijanePytanie } from "@/lib/pijany";
import { FormularzPijany } from "../pijany-final/formularz";

/**
 * Pijany finał na liście etapów quizu (28.10): wejście tego quizu i wspólna pula wyglądają jak etapy (nagłówek,
 * zwijanie nazwą, pytania pod spodem), ale w swoich kolorach, bo tryb jest opcjonalny (włącza się go przy
 * uruchamianiu gry). Pytania edytuje się w miejscu; zapis całej listy naraz (`zapiszPijanePytania`). Bez `quizId`
 * to wspólna pula: zmiany w niej działają we wszystkich quizach.
 */
export function BlokPijany({ quizId, pytania }: { quizId?: string; pytania: PijanePytanie[] }) {
  const [zwiniety, ustawZwiniety] = useState(false);
  const wejscie = !!quizId;
  return (
    <div className={`etap-blok etap-pijany ${wejscie ? "wejscie" : "pula"}`}>
      <div className={`etap-naglowek${zwiniety ? " zwiniety" : ""}`}>
        <div className="lista-glowna">
          <h3 className="etap-tytul">
            <button
              type="button"
              className="etap-zwin"
              aria-expanded={!zwiniety}
              onClick={() => ustawZwiniety((z) => !z)}
            >
              <span className="etap-nr">Pijany finał</span> {wejscie ? "Wejście" : "Wspólna pula"}
            </button>
          </h3>
          <p className="etap-znaczki">
            <span className="znaczek aktywny">opcjonalny</span>
            {wejscie ? (
              <>
                <span className="znaczek">po kolei</span>
                <span className={`znaczek${pytania.length ? " aktywny" : ""}`}>
                  pytania {pytania.length} z {LIMITY_PIJANE.wejscie}
                </span>
              </>
            ) : (
              <>
                <span className="znaczek aktywny">wszystkie quizy</span>
                <span className="znaczek">losowo</span>
                <span className="znaczek">pytania {pytania.length}</span>
              </>
            )}
          </p>
          <p className="lista-opis">
            {wejscie
              ? "Pierwsze pytania dogrywki, jeszcze na temat quizu, z każdym coraz dziwniej. Potem wspólna pula."
              : "Po wejściu: najpierw złote (jeszcze o piwie), potem szare. Zmiany działają w każdym quizie."}
          </p>
        </div>
      </div>
      {!zwiniety && <FormularzPijany pytania={pytania} quizId={quizId ?? null} />}
    </div>
  );
}
