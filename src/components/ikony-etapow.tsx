/* eslint-disable @next/next/no-img-element -- dawne ikony etapów z /public, gdyby któryś quiz miał własną */

// Ikony etapów (26.10, Łukasz: grafiki z AI wyglądały przypadkowo): proste liniowe ikony jak reszta aplikacji
// (`src/components/ikony.tsx`), złotą linią (`currentColor`). W bazie zostaje adres dawnej grafiki (`etapy.ikona`),
// a ikonę wybiera jego nazwa pliku; nieznana nazwa pokazuje sam obrazek.

const linia = {
  viewBox: "0 0 64 64",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** „Na jedno”: szklanka shaker z pianą, która spływa po szkle, i bąbelkami. */
function Pinta() {
  return (
    <svg {...linia}>
      <path d="M16.5 16l4.5 39.5a2.5 2.5 0 0 0 2.5 2h17a2.5 2.5 0 0 0 2.5-2l4.5-39.5" />
      <path d="M20.5 51h23" />
      <path
        d="M15 16c-4 0-4-7 1-6 0-5 7-6 10-3 2-4 10-4 12 0 3-3 9-1 9 3 5 0 5 6 2 6h-6v4a2.5 2.5 0 0 1-5 0v-4H27v7a3 3 0 0 1-6 0v-7z"
        fill="currentColor"
        fillOpacity={0.2}
      />
      <circle cx="33" cy="30" r="1" />
      <circle cx="29" cy="38" r="1.3" />
      <circle cx="35" cy="45" r="1.6" />
    </svg>
  );
}

/** „Jednak więcej”: deska degustacyjna z czterema szklankami. */
function Deska() {
  return (
    <svg {...linia}>
      <path d="M4 46h52a2 2 0 0 1 0 4H4a2 2 0 0 1 0-4z" />
      <path d="M56 48h4" />
      {[8, 21, 34, 47].map((x) => (
        <g key={x}>
          <path d={`M${x} 22h9l-1.2 24h-6.6z`} />
          <path d={`M${x + 0.4} 28h8.2`} />
        </g>
      ))}
    </svg>
  );
}

/** „Ile?”: menzurka z podziałką. */
function Miarka() {
  return (
    <svg {...linia}>
      <path d="M23 6h18" />
      <path d="M26 6v46a4 4 0 0 0 4 4h4a4 4 0 0 0 4-4V6" />
      <path d="M20 58h24" />
      <path d="M26 16h5M26 24h8M26 32h5M26 40h8M26 48h5" />
      <path d="M26 30c4-2 8 2 12 0" />
    </svg>
  );
}

/** „Jakoś się ułoży”: element puzzli. */
function Puzzel() {
  return (
    <svg {...linia}>
      <path d="M12 20h11a6 6 0 1 1 12 0h11v11a6 6 0 1 1 0 12v11H35a6 6 0 1 0-12 0H12V43a6 6 0 1 0 0-12z" />
    </svg>
  );
}

/** „Jeszcze zdążę”: klepsydra. */
function Klepsydra() {
  return (
    <svg {...linia}>
      <path d="M15 6h34M15 58h34" />
      <path d="M20 6c0 14 10 17 10 26S20 44 20 58M44 6c0 14-10 17-10 26s10 12 10 26" />
      <path d="M24.5 17h15L32 27z" fill="currentColor" fillOpacity={0.35} />
      <path d="M32 34v8" />
      <path d="M23 56c2-6 6-8 9-8s7 2 9 8z" fill="currentColor" fillOpacity={0.35} />
    </svg>
  );
}

const IKONY: Record<string, () => React.ReactElement> = {
  "na-jedno": Pinta,
  "jednak-wiecej": Deska,
  ile: Miarka,
  "poskladaj-sie": Puzzel,
  "jeszcze-zdaze": Klepsydra,
};

/** Ikona etapu z `etapy.ikona` (adres grafiki): liniowa, gdy znamy nazwę, inaczej sam obrazek. */
export function IkonaEtapu({ ikona, className }: { ikona: string; className: string }) {
  const nazwa = ikona.split("/").pop()?.replace(/\.[a-z]+$/, "") ?? "";
  const Ikona = IKONY[nazwa];
  if (!Ikona) return <img src={ikona} alt="" className={className} />;
  return (
    <span className={`${className} ikona-etapu`}>
      <Ikona />
    </span>
  );
}
