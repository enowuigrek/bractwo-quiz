import type { Metadata, Viewport } from "next";
import { Nunito, Open_Sans } from "next/font/google";
import "../../docs/tokens.css";
import "./globals.css";
import { POLYFILLE } from "@/lib/polyfille";
import { idMarkiZadania, markaZadania, motywZadania } from "@/lib/motyw-serwer";
import { DostawcaMarki } from "@/components/motyw";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

// font motywu neutralnego (JOWES), jak na jowes.pl
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin", "latin-ext"],
});

export async function generateMetadata(): Promise<Metadata> {
  const { nazwa, opis, ikony } = await markaZadania();
  // podstrony podają sam swój tytuł, a nazwę aplikacji (według marki) dokleja szablon; ikony z public/ikony,
  // nie z app/, bo ikony z plików w app/ wygrywają z metadanymi
  return {
    title: { default: nazwa, template: `%s · ${nazwa}` },
    description: opis,
    icons: { icon: [{ url: ikony.ico, sizes: "32x32" }, ikony.png], apple: ikony.apple },
  };
}

export async function generateViewport(): Promise<Viewport> {
  // pasek przeglądarki na telefonie w kolorze tła marki
  return { themeColor: (await markaZadania()).kolory.pasek, viewportFit: "cover" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // marka z adresu strony (src/lib/marka.ts); `data-motyw` zostaje dla CSS do czasu przejścia na `data-marka`
  const [motyw, marka] = await Promise.all([motywZadania(), idMarkiZadania()]);
  return (
    <html lang="pl" className={`${openSans.variable} ${nunito.variable}`} data-motyw={motyw} data-marka={marka}>
      <head>
        {/* starsze przeglądarki telewizorów (src/lib/polyfille.ts): przed całym kodem Next */}
        <script dangerouslySetInnerHTML={{ __html: POLYFILLE }} />
      </head>
      <body>
        <DostawcaMarki marka={marka}>{children}</DostawcaMarki>
      </body>
    </html>
  );
}
