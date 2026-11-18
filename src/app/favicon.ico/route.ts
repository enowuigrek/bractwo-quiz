import { NextResponse, type NextRequest } from "next/server";
import { motywZHosta } from "@/lib/motyw";

/**
 * `/favicon.ico` według motywu (src/lib/motyw.ts): Safari pobiera go sam, niezależnie od ikon w metadanych, więc
 * na adresie JOWES też musi dać ich koło. Pliki leżą w public/ikony.
 */
export function GET(zadanie: NextRequest) {
  const host = zadanie.headers.get("x-forwarded-host") ?? zadanie.headers.get("host");
  const motyw = motywZHosta(host, process.env.HOSTY_NEUTRALNE);
  const plik = motyw === "neutralny" ? "/ikony/jowes.ico" : "/ikony/bractwo.ico";
  const odpowiedz = NextResponse.redirect(new URL(plik, zadanie.url), 307);
  odpowiedz.headers.set("Cache-Control", "public, max-age=300");
  return odpowiedz;
}
