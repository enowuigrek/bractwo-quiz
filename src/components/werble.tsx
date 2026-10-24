// Werble po finale (faza `werble`): ekran gaśnie jak wyłączany telewizor (błysk, pozioma kreska, czerń),
// a po chwili wolno pojawia się napis z trzema skaczącymi kropkami. Wynik (podium) odsłania dopiero prowadzący.
// Ten sam na TV (`duzy`, scena 1920×1080) i na telefonach, żeby wszystko zgasło naraz.
// `dalej`: ciąg dalszy tych samych werbli (telefon po „Pokaż podium”, zanim odsłoni się miejsce): bez błysku
// i bez powolnego wejścia, więc gracz nie widzi żadnej zmiany ekranu.

export function Werble({ duzy = false, dalej = false }: { duzy?: boolean; dalej?: boolean }) {
  return (
    <div className={`werble${duzy ? " duzy" : ""}${dalej ? " dalej" : ""}`} role="status">
      <span className="werble-blysk" aria-hidden />
      <div className="werble-tresc">
        <Kropki />
        <p className="werble-tytul">Werble…</p>
        <p className="werble-podpis">Wynik za chwilę.</p>
      </div>
    </div>
  );
}

/** Trzy złote kropki skaczące na zmianę: proste „czekamy”. */
function Kropki() {
  return (
    <span className="werble-kropki" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}
