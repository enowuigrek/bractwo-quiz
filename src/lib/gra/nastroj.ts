// Nastrój ekranu TV: tło idzie za muzyką etapów (ekran/_ekran/muzyka.tsx). Poczekalnia ciepła, etapy 1–3
// w stylu noir (cienie żaluzji, chłodniejsze światło, w 3. czerwony neon), walka o finał w ciemnej czerwieni
// z pulsującą winietą, podium w złocie. Finał (seria, pijany finał, werble) bez dodatków: wideo pękającej
// szklanki leży na całej scenie w trybie `screen` i przepuszcza wszystko, co jasne pod spodem.

import type { StanSesji } from "./typy";

export type Nastroj = "poczekalnia" | "etap1" | "etap2" | "etap3" | "etap4" | "final" | "podium";

export function nastrojFazy(stan: Pick<StanSesji, "faza" | "etap">): Nastroj {
  switch (stan.faza) {
    case "poczekalnia":
    case "wstep":
      return "poczekalnia";
    case "seria":
    case "pijany":
    case "werble":
      return "final";
    case "podium":
    case "tabela":
    case "koniec":
      return "podium";
    default:
      if (stan.etap?.finalowy) return "final";
      if (stan.etap?.final_po_etapie) return "etap4";
      if ((stan.etap?.nr ?? 1) >= 3) return "etap3";
      return stan.etap?.nr === 2 ? "etap2" : "etap1";
  }
}
