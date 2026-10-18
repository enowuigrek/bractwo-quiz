import type { Metadata, Viewport } from "next";
import { Open_Sans } from "next/font/google";
import "../../docs/tokens.css";
import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin", "latin-ext"],
  axes: ["wdth"],
});

export const metadata: Metadata = {
  title: "Bractwo Quiz",
  description: "Quiz Bractwa Piwnego – Piwu Cześć!",
};

export const viewport: Viewport = {
  themeColor: "#000000",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pl" className={openSans.variable}>
      <body>{children}</body>
    </html>
  );
}
