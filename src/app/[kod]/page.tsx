import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { poprawnyKod } from "@/lib/gra/kod";
import { Gracz } from "./gracz";

export async function generateMetadata({ params }: PageProps<"/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  return { title: `${kod.toUpperCase()} · Bractwo Quiz` };
}

export default async function StronaGracza({ params }: PageProps<"/[kod]">) {
  const { kod } = await params;
  if (!poprawnyKod(kod)) notFound();
  // jeden adres na grę, żeby token w localStorage nie zależał od wielkości liter
  if (kod !== kod.toUpperCase()) redirect(`/${kod.toUpperCase()}`);

  return (
    <main className="kolumna">
      <Gracz kod={kod} />
    </main>
  );
}
