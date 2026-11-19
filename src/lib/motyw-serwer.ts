import "server-only";
import { headers } from "next/headers";
import { MARKI, markaZHosta, type IdMarki, type Marka } from "./marka";
import type { Motyw } from "./motyw";

/** Marka bieżącego żądania (src/lib/marka.ts), z adresu strony. */
export async function idMarkiZadania(): Promise<IdMarki> {
  const h = await headers();
  return markaZHosta(h.get("x-forwarded-host") ?? h.get("host"), process.env.HOSTY_NEUTRALNE);
}

export async function markaZadania(): Promise<Marka> {
  return MARKI[await idMarkiZadania()];
}

/** Motyw bieżącego żądania (dawny podział, do czasu przejścia wszystkich miejsc na markę). */
export async function motywZadania(): Promise<Motyw> {
  return (await idMarkiZadania()) === "bractwo" ? "bractwo" : "neutralny";
}
