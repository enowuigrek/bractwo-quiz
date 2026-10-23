import type { CSSProperties } from "react";

// Ruchome tło wszystkich ekranów TV: ciepłe plamy światła jak od świec i złote bąbelki unoszące się
// jak w kuflu. Bardzo słabe, żeby nie przeszkadzało w czytaniu, i na samych transformacjach CSS,
// żeby przeglądarka telewizora nie musiała przeliczać układu. Ruch pomaga też OLED-om.

/** Bąbelki rozłożone na stałe (bez losowania, żeby serwer i przeglądarka rysowały to samo). */
const BABELKI = Array.from({ length: 22 }, (_, i) => ({
  lewo: (i * 37 + 11) % 100,
  rozmiar: 12 + ((i * 7) % 26),
  czas: 16 + ((i * 11) % 15),
  // ujemne opóźnienie: na starcie bąbelki są już w drodze, a nie startują wszystkie z dołu
  opoznienie: -((i * 13) % 28),
  dryf: ((i % 5) - 2) * 18,
}));

export function TloTv() {
  return (
    <div className="tv-tlo" aria-hidden>
      <span className="tv-blask tv-blask-1" />
      <span className="tv-blask tv-blask-2" />
      <span className="tv-blask tv-blask-3" />
      {BABELKI.map((b, i) => (
        <span
          key={i}
          className="tv-babel"
          style={
            {
              left: `${b.lewo}%`,
              width: b.rozmiar,
              height: b.rozmiar,
              animationDuration: `${b.czas}s`,
              animationDelay: `${b.opoznienie}s`,
              "--dryf": `${b.dryf}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
