/**
 * Tekst planszy (ciekawostki) na TV i telefonie (18.11, plansze JOWES): akapity oddziela pusta linia, nowe linie
 * w akapicie zostają, fragmenty w `**gwiazdkach**` są pogrubione, a akapit od „> ” (uwaga, pułapka) stoi w ramce
 * (`.tv-ramka`). Zwykła ciekawostka (jeden akapit bez znaczników) wygląda jak dawniej.
 */
export function TekstPlanszy({ tekst, className }: { tekst: string; className?: string }) {
  return (
    <div className={`tekst-planszy${className ? ` ${className}` : ""}`}>
      {tekst.split(/\n\s*\n/).map((akapit, i) =>
        akapit.startsWith("> ") ? (
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
