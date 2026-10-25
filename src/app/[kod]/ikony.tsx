// Ikony liniowe 24×24 telefonu gracza (jak w pilocie i panelu), kolor z `currentColor`.

const wspolne = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

/** Kółko z ptaszkiem: na dobrej drodze. */
export function IkonaDobrze() {
  return (
    <svg {...wspolne}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l3 3 5-6" />
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
