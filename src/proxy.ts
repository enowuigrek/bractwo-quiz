import { NextResponse, type NextRequest } from "next/server";
import { CIASTECZKO_ADMINA, wazneCiasteczko } from "@/lib/admin";
import { SEGMENTY_PANELU } from "@/lib/adres-ekranu";

// Szybkie przekierowanie niezalogowanych. Właściwa kontrola jest w `wymagajAdmina()`.
// Bez logowania: logowanie, zakładanie konta, hasło z linku (konta osobowe, 30.10) i dawne `/admin/<adres_ekranu>`
// (przekierowuje na logowanie).
const BEZ_LOGOWANIA = ["logowanie", "rejestracja", "haslo"];

export function proxy(request: NextRequest) {
  const [, segment, ...dalej] = request.nextUrl.pathname.split("/").filter(Boolean);
  if (BEZ_LOGOWANIA.includes(segment) || (segment && !dalej.length && !SEGMENTY_PANELU.includes(segment))) {
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
