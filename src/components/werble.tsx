// Werble po finale (faza `werble`): ekran gaśnie jak wyłączany telewizor (błysk, pozioma kreska, czerń),
// a po chwili wolno pojawia się napis z trzema skaczącymi kropkami. Wynik (podium) odsłania dopiero prowadzący.
// Ten sam na TV (`duzy`, scena 1920×1080) i na telefonach, żeby wszystko zgasło naraz.

export function Werble({ duzy = false }: { duzy?: boolean }) {
  return (
    <div className={`werble${duzy ? " duzy" : ""}`} role="status">
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
export function Kropki() {
  return (
    <span className="werble-kropki" aria-hidden>
      <span />
      <span />
      <span />
    </span>
  );
}
