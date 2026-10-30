import { LITERY, liczbaZJednostka, NAZWY_TYPOW, poprawnaSzacowania, type ZadanieDane } from "@/lib/zadania";

/**
 * Pytanie na liście quizu pod treścią (30.10, Łukasz: „Poprawna: …” obok rodzaju zawijało się w bałagan): w pierwszym
 * wierszu rodzaj w swoim kolorze i dopiski, pod nim odpowiedzi jako kafelki z literą, poprawne zielone z ✓.
 */
export function PytanieNaLiscie({ z }: { z: ZadanieDane }) {
  const dopiski = [
    z.dane.podpowiedzi?.length ? `podpowiedzi: ${z.dane.podpowiedzi.length}` : null,
    z.dane.odslaniaj ? "odsłaniana grafika" : null,
  ].filter(Boolean);
  return (
    <div className="pytanie-skrot">
      <p className="pytanie-skrot-rodzaj">
        <span className={`rodzaj-pytania ${z.typ}`}>{NAZWY_TYPOW[z.typ]}</span>
        {dopiski.length > 0 && <span className="lista-opis">{dopiski.join(" · ")}</span>}
      </p>
      <Odpowiedzi z={z} />
    </div>
  );
}

function Kafelek({ litera, tekst, dobra = false }: { litera?: string; tekst: string; dobra?: boolean }) {
  return (
    <li className={dobra ? "dobra" : undefined}>
      {litera && <b>{litera}</b>}
      <span>{tekst}</span>
      {dobra && <span aria-label="poprawna"> ✓</span>}
    </li>
  );
}

function Odpowiedzi({ z }: { z: ZadanieDane }) {
  switch (z.typ) {
    case "wybor":
    case "prawda_falsz":
    case "wielokrotny": {
      const dobra = (i: number) => (z.typ === "wielokrotny" ? z.dane.poprawna.includes(i) : z.dane.poprawna === i);
      return (
        <ol className="odpowiedzi-skrot">
          {z.dane.odpowiedzi.map((o, i) => (
            <Kafelek key={i} litera={z.typ === "prawda_falsz" ? undefined : LITERY[i]} tekst={o} dobra={dobra(i)} />
          ))}
        </ol>
      );
    }
    case "szacowanie":
      return (
        <ol className="odpowiedzi-skrot">
          <Kafelek tekst={poprawnaSzacowania(z.dane.poprawna, z.dane.poprawna_do, z.dane.jednostka)} dobra />
          <Kafelek tekst={`zakres ${liczbaZJednostka(z.dane.min)}–${liczbaZJednostka(z.dane.max)}`} />
        </ol>
      );
    case "kolejnosc":
      return (
        <ol className="odpowiedzi-skrot">
          {z.dane.poprawna.map((i, poz) => (
            <Kafelek key={i} litera={String(poz + 1)} tekst={z.dane.elementy[i] ?? "?"} />
          ))}
        </ol>
      );
    case "pary":
      return (
        <ol className="odpowiedzi-skrot">
          {z.dane.lewe.map((l, i) => (
            <Kafelek key={i} tekst={`${l} – ${z.dane.prawe[z.dane.poprawna[i]] ?? "?"}`} />
          ))}
        </ol>
      );
    case "ciekawostka":
      return <p className="lista-opis pytanie-skrot-tekst">{z.dane.tekst}</p>;
  }
}
