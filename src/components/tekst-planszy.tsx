/**
 * Tekst planszy (ciekawostki) na TV i telefonie (18.11, plansze JOWES): akapity oddziela pusta linia, nowe linie
 * w akapicie zostają, fragmenty w `**gwiazdkach**` są pogrubione, a akapit od „> ” (uwaga, pułapka) stoi w ramce
 * (`.tv-ramka`), a akapit z samych linii od „- ” to kafelki (lista uczestników). Linie od „• ” to lista punktów
 * z kropkami (`.tekst-planszy-punkty`, ściągi). Zwykła ciekawostka (jeden akapit bez znaczników) wygląda jak dawniej.
 */
export function TekstPlanszy({ tekst, className }: { tekst: string; className?: string }) {
  return (
    <div className={`tekst-planszy${className ? ` ${className}` : ""}`}>
      {tekst.split(/\n\s*\n/).map((akapit, i) =>
        // lista kafelków: każda linia akapitu od „- ” (np. lista uczestników na koniec quizu)
        akapit.split("\n").every((l) => l.startsWith("- ")) ? (
          <ul key={i} className="tekst-planszy-kafelki">
            {akapit.split("\n").map((l, j) => (
              <li key={j}>
                <ZPogrubieniem tekst={l.slice(2)} />
              </li>
            ))}
          </ul>
        ) : akapit.startsWith("> ") ? (
          <p key={i} className="tv-ramka">
            <ZPogrubieniem tekst={akapit.slice(2)} />
          </p>
        ) : akapit.split("\n").some((l) => l.startsWith("• ")) ? (
          // punkty „• ” (ściągi, 18.11): lista z kropkami i wcięciem zamiast linijek tekstu, reszta linii zwykłym tekstem
          <div key={i} className="tekst-planszy-akapit">
            {grupyLinii(akapit).map((g, j) =>
              g.punkty ? (
                <ul key={j} className="tekst-planszy-punkty">
                  {g.linie.map((l, k) => (
                    <li key={k}>
                      <ZPogrubieniem tekst={l.slice(2)} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p key={j}>
                  <ZPogrubieniem tekst={g.linie.join("\n")} />
                </p>
              ),
            )}
          </div>
        ) : (
          <p key={i}>
            <ZPogrubieniem tekst={akapit} />
          </p>
        ),
      )}
    </div>
  );
}

/** Kolejne linie akapitu w grupach: punkty „• ” razem, zwykłe linie razem. */
function grupyLinii(akapit: string): { punkty: boolean; linie: string[] }[] {
  const grupy: { punkty: boolean; linie: string[] }[] = [];
  for (const l of akapit.split("\n")) {
    const punkty = l.startsWith("• ");
    const ostatnia = grupy[grupy.length - 1];
    if (ostatnia && ostatnia.punkty === punkty) ostatnia.linie.push(l);
    else grupy.push({ punkty, linie: [l] });
  }
  return grupy;
}

function ZPogrubieniem({ tekst }: { tekst: string }) {
  return <>{tekst.split("**").map((kawalek, i) => (i % 2 ? <strong key={i}>{kawalek}</strong> : kawalek))}</>;
}
