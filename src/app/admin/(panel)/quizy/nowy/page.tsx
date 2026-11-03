import type { Metadata } from "next";
import Link from "next/link";
import { mozeDegustacje, wymagajAdmina } from "@/lib/admin";
import { NAZWY_RODZAJOW, listaQuizow, nowyQuiz, rodzajZAdresu as czytajRodzaj } from "@/lib/tagi";
import { FormularzQuizu } from "../formularz-quizu";

export const metadata: Metadata = { title: "Nowy quiz · Bractwo Quiz" };

export default async function NowyQuiz({ searchParams }: PageProps<"/admin/quizy/nowy">) {
  const rola = await wymagajAdmina();
  const { rodzaj: rodzajZAdresu } = await searchParams;
  // rodzaj z zakładki listy quizów; w formularzu już się go nie zmienia
  const rodzaj = czytajRodzaj(rodzajZAdresu, mozeDegustacje(rola));
  return (
    <main>
      <p className="okruchy">
        <Link href={listaQuizow(rodzaj).slice(0, -1)}>
          ← {NAZWY_RODZAJOW[rodzaj]}
        </Link>
      </p>
      <h1>{nowyQuiz(rodzaj)}</h1>
      <section className="karta">
        <FormularzQuizu rodzaj={rodzaj} />
      </section>
    </main>
  );
}
