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

/** „Na jedno”: pinta (nonic) z pianą. */
function Pinta() {
  return (
    <svg {...linia}>
      <path d="M19 9h26l-1.5 9 1.5 3.5-3.6 32.2a3 3 0 0 1-3 2.7H25.6a3 3 0 0 1-3-2.7L19 21.5l1.5-3.5z" />
      <path d="M20.6 18h22.8" />
      <path d="M24 9c0-3 3-4 5-2.6C30 4 34 4 35.4 6.4 37.6 5 41 6.4 40 9" />
      <circle cx="29" cy="32" r="1.2" />
      <circle cx="35" cy="40" r="1.2" />
      <circle cx="30.5" cy="46" r="1.2" />
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
