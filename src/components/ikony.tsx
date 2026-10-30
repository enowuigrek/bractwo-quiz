// Ikony liniowe 24×24 całej aplikacji (panel, pilot, telefon, TV), kolor z `currentColor`. Od 25.10 ikony zamiast
// emotek w interfejsie (docs/DESIGN-SYSTEM.md). Wielkość: domyślnie 1,1 em jak tekst (`.ikona-svg` w globals.css), gdzie indziej z CSS
// miejsca (np. `.pilot-ikona svg`, `.etap-uwaga svg`).

const wspolne = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  className: "ikona-svg",
} as const;

// panel

export function IkonaKosz() {
  return (
    <svg {...wspolne}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  );
}

export function IkonaEdytuj() {
  return (
    <svg {...wspolne}>
      <path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />
    </svg>
  );
}

/** Kartka z tekstem: gra ma notatki (lista rozgrywek, 29.10). */
export function IkonaNotatka() {
  return (
    <svg {...wspolne}>
      <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h7M9 16h5" />
    </svg>
  );
}

/** Przekreślone oko: quiz widzi tylko Bractwo, lokale nie (przełącznik widoczności na liście quizów, 30.10). */
export function IkonaOkoPrzekreslone() {
  return (
    <svg {...wspolne}>
      <path d="M2 12s3.6-7 10-7c2 0 3.7.7 5.1 1.6M22 12s-3.6 7-10 7c-2 0-3.7-.7-5.1-1.6" />
      <path d="M9.9 14.1a3 3 0 0 1 4.2-4.2M3 21L21 3" />
    </svg>
  );
}

/** Oko: quiz widoczny też dla lokali (przełącznik widoczności na liście quizów, 30.10). */
export function IkonaOko() {
  return (
    <svg {...wspolne}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function IkonaUstawienia() {
  return (
    <svg {...wspolne}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  );
}

export function IkonaKopiuj() {
  return (
    <svg {...wspolne}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
    </svg>
  );
}

export function IkonaGotowe() {
  return (
    <svg {...wspolne}>
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

// pilot i telefon

/** Głośnik z falami: muzyka na TV gra. */
export function IkonaGlosnik() {
  return (
    <svg {...wspolne}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16.5 8.5a5 5 0 0 1 0 7M19.5 5.5a9 9 0 0 1 0 13" />
    </svg>
  );
}

/** Przekreślony głośnik: muzyka wyłączona. */
export function IkonaWyciszony() {
  return (
    <svg {...wspolne}>
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M17 9l5 6M22 9l-5 6" />
    </svg>
  );
}

/** Robot: automatyczne prowadzenie. */
export function IkonaAutomat() {
  return (
    <svg {...wspolne}>
      <rect x="4" y="8" width="16" height="12" rx="3" />
      <path d="M12 8V4M9 13v1M15 13v1M9.5 17h5M2 13v2M22 13v2" />
      <circle cx="12" cy="3.5" r="0.5" />
    </svg>
  );
}

/** Kółko z ptaszkiem: na dobrej drodze. */
export function IkonaDobrze() {
  return (
    <svg {...wspolne}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
    </svg>
  );
}

/** Korona: twórca aplikacji (konto z pełnymi uprawnieniami, przycisk konta w panelu, 30.10). */
export function IkonaKorona() {
  return (
    <svg {...wspolne}>
      <path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5L3 8z" />
    </svg>
  );
}

/** Puchar: miejsce w finałowej trójce. */
export function IkonaPuchar() {
  return (
    <svg {...wspolne}>
      <path d="M8 4h8v5a4 4 0 0 1-8 0V4zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M8 20h8M9.5 17h5" />
    </svg>
  );
}

/** Trójkąt z wykrzyknikiem: zagrożony odpadnięciem. */
export function IkonaUwaga() {
  return (
    <svg {...wspolne}>
      <path d="M12 4l9 16H3l9-16zM12 10v4M12 17h.01" />
    </svg>
  );
}

/** Aparat: zdjęcie (selfie, zdjęcie nagrody). */
export function IkonaAparat() {
  return (
    <svg {...wspolne}>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

/** Kłódka: tylko dla głównego. */
export function IkonaKlodka() {
  return (
    <svg {...wspolne}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/** Megafon: okrzyki kibiców. */
export function IkonaMegafon() {
  return (
    <svg {...wspolne}>
      <path d="M3 10v4h3l9 5V5L6 10H3zM18 9a4 4 0 0 1 0 6" />
    </svg>
  );
}

/** Pinezka: miasto (kreator gry). */
export function IkonaMiasto() {
  return (
    <svg {...wspolne}>
      <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </svg>
  );
}

/** Jeden stopień podium z „1”: nagroda tylko za 1. miejsce (kreator gry). */
export function IkonaPodium1() {
  return (
    <svg {...wspolne}>
      <path d="M7 10h10v11H7zM12 3l1.2 2.4 2.6.4-1.9 1.8.5 2.6L12 9l-2.4 1.2.5-2.6-1.9-1.8 2.6-.4z" />
      <text x="12" y="18.6" textAnchor="middle" fontSize="7" fontWeight="900" fill="currentColor" stroke="none">
        1
      </text>
    </svg>
  );
}

/** Podium z trzema stopniami 2, 1, 3: nagrody dla pierwszej trójki (kreator gry). */
export function IkonaPodium3() {
  return (
    <svg {...wspolne}>
      <path d="M2 13h6.5v8H2zM8.5 8h7v13h-7zM15.5 15H22v6h-6.5z" />
      <g fill="currentColor" stroke="none" fontWeight="900" textAnchor="middle">
        <text x="5.25" y="19.2" fontSize="5.5">
          2
        </text>
        <text x="12" y="16.5" fontSize="6.5">
          1
        </text>
        <text x="18.75" y="20.2" fontSize="4.5">
          3
        </text>
      </g>
    </svg>
  );
}
