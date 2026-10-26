import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { poprawnyKod } from "@/lib/gra/kod";
import { Pilot } from "./pilot";

export async function generateMetadata({ params }: PageProps<"/pilot/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  return { title: `Pilot ${kod.toUpperCase()} · Bractwo Quiz`, robots: { index: false } };
}

export default async function StronaPilota({ params, searchParams }: PageProps<"/pilot/[kod]">) {
  const { kod } = await params;
  const { t } = await searchParams;
  if (!poprawnyKod(kod)) notFound();
  const token = typeof t === "string" ? t : null;
  if (kod !== kod.toUpperCase()) {
    redirect(`/pilot/${kod.toUpperCase()}${token ? `?t=${encodeURIComponent(token)}` : ""}`);
  }

  return (
    <main className="kolumna kolumna-pilot">
      <Pilot kod={kod} tokenZAdresu={token} />
    </main>
  );
}
