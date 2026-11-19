import type { Metadata } from "next";
import Link from "next/link";
import { mozeDegustacje, wymagajAdmina } from "@/lib/admin";
import { nazwaRodzajuQuizu, listaQuizow, nowyQuiz, rodzajZAdresu as czytajRodzaj } from "@/lib/tagi";
import { FormularzQuizu } from "../formularz-quizu";
import { markaZadania } from "@/lib/motyw-serwer";

export const metadata: Metadata = { title: "Nowy quiz" };

export default async function NowyQuiz({ searchParams }: PageProps<"/admin/quizy/nowy">) {
  const marka = await markaZadania();
  const rola = await wymagajAdmina();
  const { rodzaj: rodzajZAdresu } = await searchParams;
  // rodzaj z zakładki listy quizów; w formularzu już się go nie zmienia
  const rodzaj = czytajRodzaj(rodzajZAdresu, mozeDegustacje(rola));
  return (
    <main>
      <p className="okruchy">
        <Link href={listaQuizow(rodzaj).slice(0, -1)}>
          ← {nazwaRodzajuQuizu(rodzaj, marka)}
        </Link>
      </p>
      <h1>{nowyQuiz(rodzaj, marka)}</h1>
      <section className="karta">
        <FormularzQuizu rodzaj={rodzaj} />
      </section>
    </main>
  );
}
