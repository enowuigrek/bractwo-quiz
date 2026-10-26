// Werble po finale (faza `werble`): ekran gaśnie jak wyłączany telewizor (błysk, pozioma kreska, czerń),
// a po chwili wolno pojawiają się trzy skaczące kropki (bez napisu od 26.10). Wynik (podium) odsłania dopiero prowadzący.
// Ten sam na TV (`duzy`, scena 1920×1080) i na telefonach, żeby wszystko zgasło naraz.
// `dalej`: ciąg dalszy tych samych werbli (telefon po „Pokaż podium”, zanim odsłoni się miejsce): bez błysku
// i bez powolnego wejścia, więc gracz nie widzi żadnej zmiany ekranu.
// Pijany finał: telefon gaśnie przed wybuchem szklanki z samym błyskiem (`napis={false}`), a potem w fazie
// werbli napis wchodzi powoli na tej samej czerni (`blysk={false}`).

export function Werble({
  duzy = false,
  dalej = false,
  blysk = true,
  napis = true,
}: {
  duzy?: boolean;
  dalej?: boolean;
  blysk?: boolean;
  napis?: boolean;
}) {
  return (
    <div className={`werble${duzy ? " duzy" : ""}${dalej ? " dalej" : ""}${blysk ? "" : " bez-blysku"}`} role="status">
      <span className="werble-blysk" aria-hidden />
      {napis && (
        // same skaczące kropki, bez napisu „Werble…” (26.10, Łukasz: werble słychać, a napis był zbędny)
        <div className="werble-tresc" aria-label="Wynik za chwilę">
          <Kropki />
        </div>
      )}
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
