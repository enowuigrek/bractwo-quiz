// Adres ekranu lokalu: /ekran/<adres>. Małe litery, cyfry i myślniki (kody gier to 4 wielkie litery).

const POLSKIE: Record<string, string> = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" };

export const FORMAT_ADRESU_EKRANU = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_ADRES_EKRANU = 60;

/** „Piwiarnia w Alejach” → „piwiarnia-w-alejach”. */
export function adresZNazwy(nazwa: string): string {
  const adres = nazwa
    .toLowerCase()
    .replace(/[ąćęłńóśźż]/g, (z) => POLSKIE[z])
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_ADRES_EKRANU - 3)
    .replace(/-+$/, "");
  return adres || "lokal";
}
