import "server-only";
import { headers } from "next/headers";
import { MARKI, markaWdrozenia, type IdMarki, type Marka } from "./marka";

/** Marka bieżącego żądania (src/lib/marka.ts): ze zmiennej `MARKA` wdrożenia, a bez niej z adresu strony. */
export async function idMarkiZadania(): Promise<IdMarki> {
  const h = await headers();
  return markaWdrozenia(h.get("x-forwarded-host") ?? h.get("host"), {
    MARKA: process.env.MARKA,
    HOSTY_NEUTRALNE: process.env.HOSTY_NEUTRALNE,
  });
}

export async function markaZadania(): Promise<Marka> {
  return MARKI[await idMarkiZadania()];
}
