import "server-only";
import { headers } from "next/headers";
import { motywZHosta, type Motyw } from "./motyw";

/** Motyw bieżącego żądania (src/lib/motyw.ts). */
export async function motywZadania(): Promise<Motyw> {
  const h = await headers();
  return motywZHosta(h.get("x-forwarded-host") ?? h.get("host"), process.env.HOSTY_NEUTRALNE);
}
