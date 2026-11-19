import { ImageResponse } from "next/og";
import { adresAplikacji } from "@/lib/adres";
import { supabaseAdmin } from "@/lib/supabase/serwer";
import { ma } from "@/lib/marka";
import { markaZadania } from "@/lib/motyw-serwer";

// Miniatura linku do ekranu (Messenger, WhatsApp, SMS): logo Bractwa i lokalu na ciemnym tle ze złotą poświatą,
// pod nimi „Quiz Bractwa Piwnego” i nazwa lokalu. Dla kodu gry samo logo Bractwa i kod. Tytuł, podpis, tło i logo
// z marki (`podglad` w src/lib/marka.ts): JOWES ma jasne tło, samo logo JOWES i „Quiz na żywo” (18.11).

export const alt = "Quiz";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const PIANA = "#f4ecd8";

/** Plik z `public/` jako data URI (generator nie pobiera obrazków sam). `null`: nie udało się. */
async function obrazek(sciezka: string, baza: string): Promise<string | null> {
  try {
    const odp = await fetch(new URL(sciezka, baza));
    if (!odp.ok) return null;
    if (sciezka.endsWith(".svg")) {
      // logo Bractwa jest czarne, a na stronie wybiela je CSS (`filter: invert(1)`), którego generator nie ma
      const svg = (await odp.text())
        .replace("<svg ", `<svg fill="${PIANA}" `)
        .replace(/stroke:#000\b/g, `stroke:${PIANA}`);
      return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
    }
    const typ = odp.headers.get("content-type") ?? "image/png";
    return `data:${typ};base64,${Buffer.from(await odp.arrayBuffer()).toString("base64")}`;
  } catch {
    return null;
  }
}

/** Open Sans jak na TV, tylko ze znakami z `tekst` (Google Fonts); bez sieci zostaje font generatora. */
async function openSans(waga: number, tekst: string): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=Open+Sans:wght@${waga}&text=${encodeURIComponent(tekst)}`,
    ).then((o) => o.text());
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await fetch(url).then((o) => o.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

export default async function Miniatura({ params }: { params: Promise<{ adres: string }> }) {
  const { adres } = await params;
  const baza = await adresAplikacji();
  const { data: lokal } = await supabaseAdmin()
    .from("lokale")
    .select("nazwa, logo_url")
    .eq("adres_ekranu", adres.toLowerCase())
    .maybeSingle<{ nazwa: string; logo_url: string | null }>();

  const marka = await markaZadania();
  const { podglad } = marka;
  const tytul = podglad.tytul;
  const podpis = podglad.podpis ?? (lokal ? lokal.nazwa : `Gra ${adres.toUpperCase()}`);
  // logo lokalu tylko z naszych plików (PNG albo SVG; WebP generator nie umie)
  const [bractwo, logoLokalu, gruby, polgruby] = await Promise.all([
    obrazek(marka.logo.plik, baza),
    // marka bez logo lokalu obok swojego (JOWES: logo lokalu to to samo koło) ma samo swoje
    ma(marka, "logo-lokalu-w-naglowku") && lokal?.logo_url && /\.(png|svg|jpe?g)$/i.test(lokal.logo_url)
      ? obrazek(lokal.logo_url, baza)
      : null,
    openSans(800, tytul),
    openSans(600, podpis),
  ]);
  const fonty = [
    ...(gruby ? [{ name: "Open Sans", data: gruby, weight: 800 as const, style: "normal" as const }] : []),
    ...(polgruby ? [{ name: "Open Sans", data: polgruby, weight: 600 as const, style: "normal" as const }] : []),
  ];

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 36,
        background: podglad.tlo,
        color: podglad.tekst,
        fontFamily: "Open Sans",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        {bractwo && (
          <img
            src={bractwo}
            alt=""
            width={podglad.logo.szer}
            height={podglad.logo.wys}
            style={{ objectFit: "contain" }}
          />
        )}
        {logoLokalu && (
          <img src={logoLokalu} alt="" width={260} height={260} style={{ objectFit: "contain", borderRadius: 130 }} />
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 68, fontWeight: 800, color: marka.kolory.akcent }}>{tytul}</div>
        <div style={{ fontSize: 42, fontWeight: 600 }}>{podpis}</div>
      </div>
    </div>,
    { ...size, fonts: fonty },
  );
}
