"use client";

/** Bok kwadratowego selfie w px. Na TV największe kółko ma 200 px, więcej nie trzeba. */
const BOK = 256;

/**
 * Zdjęcie z aparatu albo galerii → kwadrat 256×256 JPEG (ok. 20 KB), wycięty ze środka.
 * `createImageBitmap` z `imageOrientation` obraca zdjęcia z telefonów według EXIF.
 */
export async function przygotujZdjecie(plik: File): Promise<Blob> {
  const obraz = await createImageBitmap(plik, { imageOrientation: "from-image" }).catch(() => wczytajObraz(plik));
  const szer = "naturalWidth" in obraz ? obraz.naturalWidth : obraz.width;
  const wys = "naturalHeight" in obraz ? obraz.naturalHeight : obraz.height;
  const bok = Math.min(szer, wys);

  const plotno = document.createElement("canvas");
  plotno.width = BOK;
  plotno.height = BOK;
  const ctx = plotno.getContext("2d");
  if (!ctx) throw new Error("Nie da się przygotować zdjęcia.");
  ctx.drawImage(obraz, (szer - bok) / 2, (wys - bok) / 2, bok, bok, 0, 0, BOK, BOK);

  return new Promise((gotowe, zle) =>
    plotno.toBlob((blob) => (blob ? gotowe(blob) : zle(new Error("Nie da się przygotować zdjęcia."))), "image/jpeg", 0.82),
  );
}

function wczytajObraz(plik: File): Promise<HTMLImageElement> {
  return new Promise((gotowe, zle) => {
    const img = new Image();
    img.onload = () => gotowe(img);
    img.onerror = () => zle(new Error("To nie wygląda na zdjęcie."));
    img.src = URL.createObjectURL(plik);
  });
}

/** Zapisuje zdjęcie gracza (token z localStorage). Zwraca adres zdjęcia. */
export async function wyslijZdjecie(token: string, zdjecie: Blob): Promise<string> {
  const dane = new FormData();
  dane.append("token", token);
  dane.append("plik", new File([zdjecie], "selfie.jpg", { type: "image/jpeg" }));
  const odp = await fetch("/api/zdjecie", { method: "POST", body: dane });
  const wynik = (await odp.json().catch(() => ({}))) as { zdjecie?: string; blad?: string };
  if (!odp.ok || !wynik.zdjecie) throw new Error(wynik.blad ?? "Nie udało się wysłać zdjęcia.");
  return wynik.zdjecie;
}

/** Usuwa zdjęcie: gracz swoje (token) albo prowadzący cudze (kod, klucz pilota, nick). */
export async function usunZdjecie(
  kto: { token: string } | { kod: string; host_token: string; nick: string },
): Promise<void> {
  const odp = await fetch("/api/zdjecie", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(kto),
  });
  if (!odp.ok) {
    const wynik = (await odp.json().catch(() => ({}))) as { blad?: string };
    throw new Error(wynik.blad ?? "Nie udało się usunąć zdjęcia.");
  }
}
