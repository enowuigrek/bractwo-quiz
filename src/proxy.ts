import { NextResponse, type NextRequest } from "next/server";
import { CIASTECZKO_ADMINA, wazneCiasteczko } from "@/lib/admin";

// Szybkie przekierowanie niezalogowanych. Właściwa kontrola jest w `wymagajAdmina()`.
export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin/logowanie")) {
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
