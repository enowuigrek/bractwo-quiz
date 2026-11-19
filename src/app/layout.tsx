import type { Metadata, Viewport } from "next";
import { Nunito, Open_Sans } from "next/font/google";
import "../../docs/tokens.css";
import "./globals.css";
import { POLYFILLE } from "@/lib/polyfille";
import { NAZWA_APLIKACJI } from "@/lib/motyw";
import { idMarkiZadania, motywZadania } from "@/lib/motyw-serwer";
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
  const motyw = await motywZadania();
  // podstrony podają sam swój tytuł, a nazwę aplikacji (według motywu) dokleja szablon
  const nazwa = NAZWA_APLIKACJI[motyw];
  const title = { default: nazwa, template: `%s · ${nazwa}` };
  // ikony według motywu (pliki w public/ikony, nie w app/, bo ikony z plików w app/ wygrywają z metadanymi)
  if (motyw === "neutralny") {
    return {
      title,
      description: "Quiz na żywo",
      icons: { icon: [{ url: "/ikony/jowes.ico", sizes: "32x32" }, "/ikony/jowes.png"], apple: "/ikony/jowes-apple.png" },
    };
  }
  return {
    title,
    description: "Quiz Bractwa Piwnego – Piwu Cześć!",
    icons: { icon: [{ url: "/ikony/bractwo.ico", sizes: "32x32" }, "/ikony/bractwo.png"], apple: "/ikony/bractwo-apple.png" },
  };
}

export async function generateViewport(): Promise<Viewport> {
  // pasek przeglądarki na telefonie w kolorze tła motywu
  const motyw = await motywZadania();
  return { themeColor: motyw === "neutralny" ? "#ffffff" : "#000000", viewportFit: "cover" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // motyw z adresu strony (src/lib/motyw.ts): neutralny bez piwa i Bractwa, np. dla quizu firmowego
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
