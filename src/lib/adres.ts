import "server-only";
import { headers } from "next/headers";

/**
 * Adres aplikacji do linków i kodów QR. Bez domeny na sztywno:
 * `NEXT_PUBLIC_SITE_URL`, a jeśli go nie ma, adres bieżącego żądania.
 */
export async function adresAplikacji(): Promise<string> {
  const zEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (zEnv) return zEnv.replace(/\/+$/, "");

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const protokol = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protokol}://${host}`;
}
