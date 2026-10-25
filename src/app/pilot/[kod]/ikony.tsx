// Ikony liniowe 24×24 pilota (jak w panelu: src/app/admin/(panel)/_komponenty/ikony.tsx), kolor z `currentColor`.

const wspolne = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

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
