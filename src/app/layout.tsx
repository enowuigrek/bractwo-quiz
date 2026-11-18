import type { Metadata, Viewport } from "next";
import { Nunito, Open_Sans } from "next/font/google";
import "../../docs/tokens.css";
import "./globals.css";
import { POLYFILLE } from "@/lib/polyfille";
import { NAZWA_APLIKACJI } from "@/lib/motyw";
import { motywZadania } from "@/lib/motyw-serwer";
import { DostawcaMotywu } from "@/components/motyw";

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
  if (motyw === "neutralny") return { title: NAZWA_APLIKACJI.neutralny, description: "Quiz na żywo" };
  return { title: NAZWA_APLIKACJI.bractwo, description: "Quiz Bractwa Piwnego – Piwu Cześć!" };
}

export async function generateViewport(): Promise<Viewport> {
  // pasek przeglądarki na telefonie w kolorze tła motywu
  const motyw = await motywZadania();
  return { themeColor: motyw === "neutralny" ? "#ffffff" : "#000000", viewportFit: "cover" };
}

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // motyw z adresu strony (src/lib/motyw.ts): neutralny bez piwa i Bractwa, np. dla quizu firmowego
  const motyw = await motywZadania();
  return (
    <html lang="pl" className={`${openSans.variable} ${nunito.variable}`} data-motyw={motyw}>
      <head>
        {/* starsze przeglądarki telewizorów (src/lib/polyfille.ts): przed całym kodem Next */}
        <script dangerouslySetInnerHTML={{ __html: POLYFILLE }} />
      </head>
      <body>
        <DostawcaMotywu motyw={motyw}>{children}</DostawcaMotywu>
      </body>
    </html>
  );
}
