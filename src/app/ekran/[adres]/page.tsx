import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import QRCode from "qrcode";
import { adresAplikacji } from "@/lib/adres";
import { poprawnyKod } from "@/lib/gra/kod";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { EkranLokalu } from "../_ekran/ekran-lokalu";
import { Tv } from "../_ekran/tv";
import "../_ekran/tv.css";

type Lokal = { nazwa: string; logo_url: string | null };

/** `adres` to adres ekranu lokalu (małe litery) albo kod gry (4 litery). Lokal ma pierwszeństwo. */
async function lokalPoAdresie(adres: string): Promise<Lokal | null> {
  const { data } = await supabaseAdmin()
    .from("lokale")
    .select("nazwa, logo_url")
    .eq("adres_ekranu", adres.toLowerCase())
    .maybeSingle<Lokal>();
  return data;
}

export async function generateMetadata({ params }: PageProps<"/ekran/[adres]">): Promise<Metadata> {
  const { adres } = await params;
  const lokal = await lokalPoAdresie(adres);
  return { title: `Ekran ${lokal ? lokal.nazwa : adres.toUpperCase()} · Bractwo Quiz` };
}

export default async function StronaEkranu({ params }: PageProps<"/ekran/[adres]">) {
  const { adres } = await params;
  // Adres z bieżącego żądania (albo NEXT_PUBLIC_SITE_URL), bez domeny na sztywno.
  const baza = await adresAplikacji();

  const lokal = await lokalPoAdresie(adres);
  if (lokal) {
    if (adres !== adres.toLowerCase()) redirect(`/ekran/${adres.toLowerCase()}`);
    return <EkranLokalu adres={adres} lokal={lokal} baza={baza} />;
  }

  if (!poprawnyKod(adres)) notFound();
  if (adres !== adres.toUpperCase()) redirect(`/ekran/${adres.toUpperCase()}`);
  // SVG z biblioteki qrcode; jedyne dane to adres, który sami złożyliśmy
  const qr = await QRCode.toString(`${baza}/${adres}`, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#f4ecd8" },
  });
  return <Tv kod={adres} qr={qr} host={baza.replace(/^https?:\/\//, "")} />;
}
