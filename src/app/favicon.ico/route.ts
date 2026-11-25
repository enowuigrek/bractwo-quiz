import { NextResponse, type NextRequest } from "next/server";
import { MARKI, markaWdrozenia } from "@/lib/marka";

/**
 * `/favicon.ico` według marki (src/lib/marka.ts): Safari pobiera go sam, niezależnie od ikon w metadanych, więc
 * na adresie JOWES też musi dać ich koło. Pliki leżą w public/ikony.
 */
export function GET(zadanie: NextRequest) {
  const host = zadanie.headers.get("x-forwarded-host") ?? zadanie.headers.get("host");
  const plik =
    MARKI[markaWdrozenia(host, { MARKA: process.env.MARKA, HOSTY_NEUTRALNE: process.env.HOSTY_NEUTRALNE })].ikony.ico;
  const odpowiedz = NextResponse.redirect(new URL(plik, zadanie.url), 307);
  odpowiedz.headers.set("Cache-Control", "public, max-age=300");
  return odpowiedz;
}
