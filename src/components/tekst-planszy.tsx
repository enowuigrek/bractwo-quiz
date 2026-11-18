/**
 * Tekst planszy (ciekawostki) na TV i telefonie (18.11, plansze JOWES): akapity oddziela pusta linia, nowe linie
 * w akapicie zostają, fragmenty w `**gwiazdkach**` są pogrubione, a akapit od „> ” (uwaga, pułapka) stoi w ramce
 * (`.tv-ramka`), a akapit z samych linii od „- ” to kafelki (lista uczestników). Zwykła ciekawostka (jeden akapit bez znaczników) wygląda jak dawniej.
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
        ) : (
          <p key={i}>
            <ZPogrubieniem tekst={akapit} />
          </p>
        ),
      )}
    </div>
  );
}

function ZPogrubieniem({ tekst }: { tekst: string }) {
  return <>{tekst.split("**").map((kawalek, i) => (i % 2 ? <strong key={i}>{kawalek}</strong> : kawalek))}</>;
}
