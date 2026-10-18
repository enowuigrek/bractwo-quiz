import type { StanFormularza } from "@/lib/typy";

/** Komunikat pod formularzem: błąd albo potwierdzenie zapisu. */
export function KomunikatFormularza({ stan }: { stan: StanFormularza }) {
  if (stan.blad) {
    return (
      <p className="blad" role="alert" style={{ margin: 0 }}>
        {stan.blad}
      </p>
    );
  }
  if (stan.ok) {
    return (
      <p className="sukces" role="status" style={{ margin: 0 }}>
        {stan.ok}
      </p>
    );
  }
  return null;
}
