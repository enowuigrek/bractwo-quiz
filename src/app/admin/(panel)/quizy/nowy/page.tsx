import type { Metadata } from "next";
import Link from "next/link";
import { widziWszystko, wymagajAdmina } from "@/lib/admin";
import { NAZWY_RODZAJOW } from "@/lib/tagi";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Nowy quiz · Bractwo Quiz" };

export default async function NowyQuiz({ searchParams }: PageProps<"/admin/quizy/nowy">) {
  const rola = await wymagajAdmina();
  const { rodzaj: rodzajZAdresu } = await searchParams;
  // rodzaj z zakładki listy quizów; w formularzu już się go nie zmienia
  const rodzaj = rodzajZAdresu === "klasyczny" ? "klasyczny" : "wyscig";
  return (
    <main>
      <p className="okruchy">
        <Link href={rodzaj === "klasyczny" ? "/admin/quizy?rodzaj=klasyczny" : "/admin/quizy"}>
          ← {NAZWY_RODZAJOW[rodzaj]}
        </Link>
      </p>
      <h1>{rodzaj === "klasyczny" ? "Nowy klasyczny pub quiz" : "Nowy wyścig po piwo"}</h1>
      <section className="karta">
        <FormularzQuizu glowny={widziWszystko(rola)} rodzaj={rodzaj} />
      </section>
    </main>
  );
}
