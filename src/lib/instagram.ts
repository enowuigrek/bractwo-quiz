/** Konto na Instagramie z pola formularza: bez @ i adresu. `null`: puste, `false`: nieprawidłowe. */
export function kontoInstagram(pole: FormDataEntryValue | null): string | null | false {
  const tekst = String(pole ?? "")
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  if (!tekst) return null;
  return /^[A-Za-z0-9._]{1,30}$/.test(tekst) ? tekst : false;
}
