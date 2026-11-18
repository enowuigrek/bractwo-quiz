import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { poprawnyKod } from "@/lib/gra/kod";
import { Gracz } from "./gracz";
import { NAZWA_APLIKACJI } from "@/lib/motyw";
import { motywZadania } from "@/lib/motyw-serwer";

export async function generateMetadata({ params }: PageProps<"/[kod]">): Promise<Metadata> {
  const { kod } = await params;
  return { title: `${kod.toUpperCase()} · ${NAZWA_APLIKACJI[await motywZadania()]}` };
}

export default async function StronaGracza({ params }: PageProps<"/[kod]">) {
  const { kod } = await params;
  if (!poprawnyKod(kod)) notFound();
  // jeden adres na grę, żeby token w localStorage nie zależał od wielkości liter
  if (kod !== kod.toUpperCase()) redirect(`/${kod.toUpperCase()}`);

  return (
    // `ekran-gracza`: ciepłe, prawie czarne powierzchnie jak na TV (globals.css)
    <main className="kolumna ekran-gracza">
      <Gracz kod={kod} />
    </main>
  );
}
