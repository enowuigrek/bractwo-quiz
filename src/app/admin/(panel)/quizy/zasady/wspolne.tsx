// Wspólne kawałki stron zasad (wyścig po piwo i pub quiz, 28.10): liczby, wykres szybkości, opisy rodzajów pytań.

import { przedzial } from "@/lib/gra/punktacja";
import { NAZWY_TYPOW, type TypZadania } from "@/lib/zadania";

/** Liczba po polsku z odstępem tysięcy: „12 000”. */
export const pkt = (n: number) => n.toLocaleString("pl-PL", { useGrouping: true });
export const zakres = ([od, do_]: [number, number]) => (od === do_ ? `${pkt(od)}` : `${pkt(od)}–${pkt(do_)}`);

/** Rodzaj pytania: co trzeba wiedzieć i przykłady częściowych odpowiedzi (ocena 0..1 jak `wewn.ocena`). */
export const RODZAJE: Record<
  Exclude<TypZadania, "ciekawostka">,
  { zasady: string[]; czesciowe: { opis: string; ocena: number }[]; naglowek?: string }
> = {
  wybor: {
    zasady: ["Jedna dobra odpowiedź z kilku (A–D, czasem więcej).", "Liczy się tylko trafienie i czas."],
    czesciowe: [{ opis: "Zła odpowiedź albo brak", ocena: 0 }],
  },
  prawda_falsz: {
    zasady: ["Zdanie na ekranie jest prawdziwe albo fałszywe, gracz wybiera jedno."],
    czesciowe: [{ opis: "Zła odpowiedź albo brak", ocena: 0 }],
  },
  wielokrotny: {
    zasady: [
      "Dobrych odpowiedzi jest od 1 do 4, gracz zaznacza wszystkie, które uważa za dobre.",
      "Ocena: (trafione − złe) / liczba dobrych, nie mniej niż zero. Zła odpowiedź zabiera tyle, ile daje dobra.",
    ],
    czesciowe: [
      { opis: "2 z 3 dobrych, bez złych", ocena: 2 / 3 },
      { opis: "1 z 3 dobrych, bez złych", ocena: 1 / 3 },
      { opis: "3 dobre i 1 zła", ocena: 2 / 3 },
      { opis: "1 dobra i 1 zła (albo więcej złych niż dobrych)", ocena: 0 },
    ],
  },
  szacowanie: {
    zasady: [
      "Gracz ustawia liczbę na suwaku. Trafienie (co do pół kroku suwaka albo w widełkach) to pełne punkty.",
      "Bliżej = więcej: punkty maleją liniowo z odległością, do zera w odległości „tolerancji” ustawionej w pytaniu.",
      "Szybkość waży tu tylko 10%, bo liczy się precyzja. Przy widełkach odległość liczy się od najbliższego brzegu.",
    ],
    naglowek: "Blisko, ale nie w punkt",
    czesciowe: [
      { opis: "W połowie drogi do granicy tolerancji", ocena: 0.5 },
      { opis: "Tuż przy granicy (90% tolerancji)", ocena: 0.1 },
      { opis: "Dalej niż tolerancja", ocena: 0 },
    ],
  },
  pary: {
    zasady: ["Punkty za każdą dobrze połączoną parę."],
    czesciowe: [
      { opis: "3 z 4 par dobrze", ocena: 0.75 },
      { opis: "1 z 4 par dobrze", ocena: 0.25 },
    ],
  },
  kolejnosc: {
    zasady: [
      "Punkty za każdą dobrze ułożoną parę sąsiadów (A→B, B→C…), więc jedno przesunięcie nie zeruje całości.",
    ],
    czesciowe: [
      { opis: "4 elementy: 2 z 3 par sąsiadów", ocena: 2 / 3 },
      { opis: "4 elementy: 1 z 3 par sąsiadów", ocena: 1 / 3 },
    ],
  },
};

/** Tabelka częściowych odpowiedzi jednego rodzaju przy danym mnożniku. */
export function TabelaCzesciowych({ typ, mnoznik, zNazwa }: { typ: keyof typeof RODZAJE; mnoznik: number; zNazwa?: boolean }) {
  const r = RODZAJE[typ];
  return (
    <table className="zasady-tabela czesciowe">
      <thead>
        <tr>
          <th>{zNazwa ? NAZWY_TYPOW[typ] : (r.naglowek ?? "Częściowo dobrze")}</th>
          <th>za pytanie</th>
        </tr>
      </thead>
      <tbody>
        {r.czesciowe.map((c) => (
          <tr key={c.opis}>
            <td>{c.opis}</td>
            <td>{zakres(przedzial(typ, c.ocena, mnoznik))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Wykres punktów za dobrą odpowiedź w czasie (×1, okno 30 s): 1000 od razu, liniowo do 200, potem płasko. */
export function WykresSzybkosci() {
  // współrzędne: x 0..40 s → 40..300, y 0..1000 pkt → 170..20
  const x = (s: number) => 40 + (s / 40) * 260;
  const y = (p: number) => 170 - (p / 1000) * 150;
  return (
    <figure className="zasady-wykres">
      <svg viewBox="0 0 320 200" role="img" aria-label="Punkty za dobrą odpowiedź maleją z czasem od 1000 do 200">
        <line x1={x(0)} y1={y(0)} x2={x(40)} y2={y(0)} className="os" />
        <line x1={x(0)} y1={y(0)} x2={x(0)} y2={y(1000)} className="os" />
        {[200, 600, 1000].map((p) => (
          <g key={p}>
            <line x1={x(0)} y1={y(p)} x2={x(40)} y2={y(p)} className="siatka" />
            <text x={x(0) - 6} y={y(p) + 4} textAnchor="end">
              {p}
            </text>
          </g>
        ))}
        {[0, 15, 30, 40].map((s) => (
          <text key={s} x={x(s)} y={y(0) + 16} textAnchor="middle">
            {s} s
          </text>
        ))}
        <polyline points={`${x(0)},${y(1000)} ${x(30)},${y(200)} ${x(40)},${y(200)}`} className="linia" />
        <circle cx={x(0)} cy={y(1000)} r={4} className="kropka" />
        <circle cx={x(30)} cy={y(200)} r={4} className="kropka" />
      </svg>
      <figcaption>Dobra odpowiedź przy mnożniku ×1 i oknie 30 s</figcaption>
    </figure>
  );
}

