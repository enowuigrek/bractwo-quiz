import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { poprawnyKod } from "@/lib/gra/kod";
import { Tv } from "./tv";
import "./tv.css";

export async function generateMetadata({ params }: PageProps<"/tv/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  return { title: `TV ${kod.toUpperCase()} · Bractwo Quiz` };
}

export default async function StronaTv({ params }: PageProps<"/tv/[kod]">) {
  const { kod } = await params;
  if (!poprawnyKod(kod)) notFound();
  if (kod !== kod.toUpperCase()) redirect(`/tv/${kod.toUpperCase()}`);

  // Adres z bieżącego żądania (albo NEXT_PUBLIC_SITE_URL), bez domeny na sztywno.
  const adres = await adresAplikacji();
  const linkGracza = `${adres}/${kod}`;
  // SVG z biblioteki qrcode; jedyne dane to adres, który sami złożyliśmy
  const qr = await QRCode.toString(linkGracza, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#f4ecd8" },
  });

  return <Tv kod={kod} qr={qr} adres={linkGracza.replace(/^https?:\/\//, "")} />;
}
