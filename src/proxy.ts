import { NextResponse, type NextRequest } from "next/server";
import { CIASTECZKO_ADMINA, wazneCiasteczko } from "@/lib/admin";
import { SEGMENTY_PANELU } from "@/lib/adres-ekranu";

// Szybkie przekierowanie niezalogowanych. Właściwa kontrola jest w `wymagajAdmina()`.
// Bez logowania: `/admin/logowanie` (główny) i `/admin/<adres_ekranu>` (logowanie lokalu, 26.10).
export function proxy(request: NextRequest) {
  const [, segment, ...dalej] = request.nextUrl.pathname.split("/").filter(Boolean);
  if (segment === "logowanie" || (segment && !dalej.length && !SEGMENTY_PANELU.includes(segment))) {
    return NextResponse.next();
  }
  if (!wazneCiasteczko(request.cookies.get(CIASTECZKO_ADMINA)?.value)) {
    return NextResponse.redirect(new URL("/admin/logowanie", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
